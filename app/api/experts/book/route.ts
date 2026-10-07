export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getExpertBySlug, sessionMinutes } from "@/features/experts/data/experts-data";
import {
  createPaidBooking,
  createFreeBooking,
  isSlotTaken,
  attachGoogleEvent,
  getBookingByPaymentId,
} from "@/features/experts/services/bookings.service";
import { isStartTimeBookable } from "@/features/experts/services/validateSlot";
import { recordPaymentIncident } from "@/features/experts/services/incidents.service";
import { getCompanyConnection, createMeetEvent } from "@/lib/google/calendar";
import { getRazorpay } from "@/lib/razorpay";
import { resolveBookingAmountINR } from "@/lib/payments/booking-amount";
import { sendInvoiceEmail } from "@/lib/invoice/send-invoice";
import { sendExpertNotification } from "@/features/experts/emails/expertNotification";
import { sendUserConfirmation } from "@/features/experts/emails/userConfirmation";
import { sendSupportNotification } from "@/features/experts/emails/supportNotification";
import { scheduleRemindersForBooking } from "@/features/experts/services/reminder-schedule";
import type { BookingRow } from "@/features/experts/services/bookings.service";
import { rateLimit, rateLimited } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const EXPERT_TZ = "Asia/Kolkata";
const NOTIFY_FALLBACK = "sahil@growqr.ai"; // expert notifications land here if no per-expert email
const REFUND_CONTACT =
  "If you were charged, your payment will be refunded — contact support@growqr.ai.";

/**
 * Queue the 24h and 1h pre-session reminders for a freshly created booking.
 * Called once the Meet link is known so it can be embedded in the reminder.
 * Never throws — a booking is not lost because a reminder failed to queue, and
 * the daily cron sweeper retries anything left pending.
 */
async function queueReminders(row: BookingRow, meetingUrl: string | null) {
  const outcomes = await scheduleRemindersForBooking({
    id: row.id,
    expert_slug: row.expert_slug,
    user_name: row.user_name,
    user_email: row.user_email,
    start_time: row.start_time,
    google_meet_link: meetingUrl,
    reminder_24h_sent: row.reminder_24h_sent,
    reminder_1h_sent: row.reminder_1h_sent,
  });
  for (const outcome of outcomes) {
    if (outcome.result === "failed") {
      console.error(
        `[experts/book] reminder ${outcome.stage} not queued for booking ${row.id}: ${outcome.reason}`,
      );
    }
  }
}

/**
 * TEMP: payment step disabled. While false, bookings are created without a
 * Razorpay charge and no invoice is sent (see the free-booking branch in POST).
 * Flip to true to restore the full pay-then-book flow below — all payment code
 * is preserved and unchanged.
 */
const PAYMENTS_ENABLED = false;

type BookBody = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  /** Turnstile token — required on both the paid and the free path. */
  token?: string;
  booking: {
    slug: string;
    packageId?: string;
    start: string; // ISO
    name: string;
    email: string;
    phone?: string;
    topic?: string;
    timeZone?: string;
  };
};

/**
 * Flag a booking that was created without a Google Meet link. Neither branch
 * below loses the booking when the calendar call fails, so without this row the
 * only trace is a log line: the attendee and the expert are both told an invite
 * is coming and none ever arrives. Reuses the payment-incident queue — on the
 * free path the amount and the Razorpay ids are simply null.
 */
async function flagMissingMeetLink(input: {
  bookingId: string;
  booking: BookBody["booking"];
  startISO: string;
  reason: string;
  amountINR?: number | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
}) {
  await recordPaymentIncident({
    kind: "calendar_failed",
    expert_slug: input.booking.slug,
    user_email: input.booking.email,
    user_name: input.booking.name,
    start_time: input.startISO,
    amount_inr: input.amountINR ?? null,
    razorpay_order_id: input.razorpayOrderId ?? null,
    razorpay_payment_id: input.razorpayPaymentId ?? null,
    detail: `booking ${input.bookingId}: ${input.reason}`,
  });
}

// POST /api/experts/book
// Verifies payment → records booking → creates Google event + Meet → emails.
export async function POST(req: NextRequest) {
  const limit = await rateLimit(req, { key: "experts-book", limit: 10, windowMs: 10 * 60_000 });
  if (!limit.ok) return rateLimited(limit.retryAfterSec);

  let body: BookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking } = body;

  // ── Bot gate ─────────────────────────────────────────────────────────────
  //    Ahead of BOTH branches, and deliberately not skipped on the free path:
  //    that is precisely the branch with nothing else standing in the way. A
  //    booking consumes a real calendar slot, creates a Google Meet event and
  //    emails the expert and the attendee, so an unguarded free path lets a
  //    script exhaust an expert's availability and mail-bomb them. The paid
  //    path additionally verifies the Razorpay signature and the captured
  //    amount below; this check costs one round trip and covers both.
  if (!(await verifyTurnstile(body.token, "experts-book"))) {
    return NextResponse.json(
      { status: "error", error: "Security verification failed. Please refresh and try again." },
      { status: 403 },
    );
  }

  // ── Payment disabled: book directly (no charge, no invoice) ──────────────
  //    Keeps slot validation, the double-book guard, Google Meet creation and
  //    the expert notification — only the Razorpay + invoice steps are skipped.
  if (!PAYMENTS_ENABLED) {
    return handleFreeBooking(booking);
  }

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !booking?.slug ||
    !booking?.start ||
    !booking?.name ||
    !booking?.email
  ) {
    return NextResponse.json({ status: "error", error: "Missing required fields" }, { status: 400 });
  }

  // ── 1. Verify Razorpay signature ─────────────────────────────
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ status: "error", error: "Payment config missing" }, { status: 500 });
  }
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expectedSig !== razorpay_signature) {
    console.error("[experts/book] Signature mismatch");
    return NextResponse.json({ status: "error", error: "Payment verification failed" }, { status: 400 });
  }

  // ── 2. Resolve expert + amount (server-side, never trust client) ──
  const expert = getExpertBySlug(booking.slug);
  if (!expert) {
    return NextResponse.json({ status: "error", error: "Expert not found" }, { status: 404 });
  }
  const sessionMin = sessionMinutes(expert);
  const amountINR = resolveBookingAmountINR(booking.slug);

  const startISO = new Date(booking.start).toISOString();
  const endISO = new Date(new Date(booking.start).getTime() + sessionMin * 60_000).toISOString();

  // ── 3. Idempotency — if this payment already produced a booking, return it ──
  //    Lets the client safely retry (e.g. after a network blip) without erroring.
  const existing = await getBookingByPaymentId(razorpay_payment_id);
  if (existing && existing.status !== "cancelled") {
    return NextResponse.json({
      status: "success",
      data: {
        bookingId: existing.id,
        start: existing.start_time,
        end: existing.end_time,
        meetingUrl: existing.google_meet_link,
        title: `${expert.name} session`,
      },
    });
  }

  // ── 4. Verify the CAPTURED payment with Razorpay (amount + status + order) ──
  //    Signature alone does not cover the amount, so confirm the real payment.
  try {
    const rzp = getRazorpay();
    const payment = await rzp.payments.fetch(razorpay_payment_id);
    const expectedPaise = amountINR * 100;
    const paidPaise = Number(payment.amount);
    const amountOk = paidPaise === expectedPaise;
    const statusOk = payment.status === "captured";
    const orderOk = payment.order_id === razorpay_order_id;

    if (!amountOk || !statusOk || !orderOk) {
      await recordPaymentIncident({
        kind: "amount_mismatch",
        expert_slug: booking.slug,
        user_email: booking.email,
        user_name: booking.name,
        start_time: startISO,
        amount_inr: amountINR,
        razorpay_order_id,
        razorpay_payment_id,
        detail: `expected ${expectedPaise} captured paise; got amount=${payment.amount} status=${payment.status} order=${payment.order_id}`,
      });
      return NextResponse.json(
        {
          status: "error",
          error: `Payment could not be verified. ${REFUND_CONTACT}`,
        },
        { status: 400 },
      );
    }
  } catch (err) {
    console.error("[experts/book] payment verification failed:", err);
    await recordPaymentIncident({
      kind: "verify_failed",
      expert_slug: booking.slug,
      user_email: booking.email,
      user_name: booking.name,
      start_time: startISO,
      amount_inr: amountINR,
      razorpay_order_id,
      razorpay_payment_id,
      detail: err instanceof Error ? err.message : "payments.fetch threw",
    });
    return NextResponse.json(
      { status: "error", error: `Could not verify payment. ${REFUND_CONTACT}` },
      { status: 502 },
    );
  }

  // ── 5. Revalidate the slot server-side (don't trust the client's start) ──
  if (!(await isStartTimeBookable(booking.slug, startISO, sessionMin))) {
    await recordPaymentIncident({
      kind: "invalid_slot",
      expert_slug: booking.slug,
      user_email: booking.email,
      user_name: booking.name,
      start_time: startISO,
      amount_inr: amountINR,
      razorpay_order_id,
      razorpay_payment_id,
      detail: "start time is not a valid bookable slot",
    });
    return NextResponse.json(
      {
        status: "error",
        error: `The selected time is no longer a valid booking slot. ${REFUND_CONTACT}`,
      },
      { status: 422 },
    );
  }

  // ── 6. Guard against double-booking (payment already captured here) ──
  if (await isSlotTaken(booking.slug, startISO)) {
    await recordPaymentIncident({
      kind: "slot_taken_after_payment",
      expert_slug: booking.slug,
      user_email: booking.email,
      user_name: booking.name,
      start_time: startISO,
      amount_inr: amountINR,
      razorpay_order_id,
      razorpay_payment_id,
      detail: "slot taken between availability and payment",
    });
    return NextResponse.json(
      {
        status: "error",
        error: `This slot was just booked by someone else. ${REFUND_CONTACT}`,
      },
      { status: 409 },
    );
  }

  // ── 7. Record the paid booking ───────────────────────────────
  let bookingId: string;
  let bookingRow: BookingRow;
  try {
    const { booking: row, duplicate } = await createPaidBooking({
      expert_slug: booking.slug,
      user_name: booking.name,
      user_email: booking.email,
      user_phone: booking.phone ?? null,
      session_topic: booking.topic ?? null,
      start_time: startISO,
      end_time: endISO,
      amount_inr: amountINR,
      razorpay_order_id,
      razorpay_payment_id,
    });
    if (duplicate || !row) {
      await recordPaymentIncident({
        kind: "slot_taken_after_payment",
        expert_slug: booking.slug,
        user_email: booking.email,
        user_name: booking.name,
        start_time: startISO,
        amount_inr: amountINR,
        razorpay_order_id,
        razorpay_payment_id,
        detail: "unique-index conflict on insert (slot or payment id)",
      });
      return NextResponse.json(
        { status: "error", error: `Slot no longer available. ${REFUND_CONTACT}` },
        { status: 409 },
      );
    }
    bookingId = row.id;
    bookingRow = row;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not record booking";
    console.error("[experts/book] createPaidBooking:", message);
    await recordPaymentIncident({
      kind: "booking_insert_failed",
      expert_slug: booking.slug,
      user_email: booking.email,
      user_name: booking.name,
      start_time: startISO,
      amount_inr: amountINR,
      razorpay_order_id,
      razorpay_payment_id,
      detail: message,
    });
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }

  // ── 8. Create Google Meet on the GrowQR company calendar ─────
  //    One shared account hosts the Meet; the client and expert are both added
  //    as attendees so both receive the invite + link. Failure here must NOT
  //    lose a paid booking — log, flag, continue.
  let meetingUrl: string | null = null;
  try {
    const conn = await getCompanyConnection();
    if (conn?.google_refresh_token) {
      const { eventId, meetLink } = await createMeetEvent(conn, {
        summary: `GrowQR · ${expert.name} ↔ ${booking.name}`,
        description: booking.topic
          ? `Topic: ${booking.topic}\n\nBooked via GrowQR Advisory.`
          : "Booked via GrowQR Advisory.",
        startISO,
        endISO,
        timeZone: EXPERT_TZ,
        attendees: [booking.email, expert.email ?? NOTIFY_FALLBACK].filter(Boolean),
      });
      meetingUrl = meetLink;
      await attachGoogleEvent(bookingId, eventId, meetLink);
    } else {
      console.warn(`[experts/book] No company calendar connected — booking ${bookingId} has no Meet link.`);
      await flagMissingMeetLink({
        bookingId,
        booking,
        startISO,
        reason: "no company calendar connected",
        amountINR,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });
    }
  } catch (err) {
    console.error(`[experts/book] Google event failed for booking ${bookingId} (payment kept):`, err);
    await flagMissingMeetLink({
      bookingId,
      booking,
      startISO,
      reason: err instanceof Error ? err.message : "calendar error",
      amountINR,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
  }

  // ── 9. Emails — send them before returning so the serverless function does
  //    not exit before Resend starts the outbound requests. Booking success is
  //    still preserved even if one or more emails fail.
  await Promise.allSettled([
    sendInvoiceEmail({
      customerName: booking.name,
      customerEmail: booking.email,
      expertName: expert.name,
      sessionStart: startISO,
      sessionMinutes: sessionMin,
      amountINR,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      meetingUrl: meetingUrl ?? undefined,
    }),
    sendExpertNotification({
      expertName: expert.name,
      expertEmail: expert.email ?? NOTIFY_FALLBACK,
      userName: booking.name,
      userEmail: booking.email,
      userPhone: booking.phone,
      sessionTopic: booking.topic,
      sessionStart: startISO,
      meetingUrl,
    }),
    sendUserConfirmation({
      userName: booking.name,
      userEmail: booking.email,
      expertName: expert.name,
      sessionTopic: booking.topic,
      sessionStart: startISO,
      meetingUrl,
    }),
    sendSupportNotification({
      expertName: expert.name,
      userName: booking.name,
      userEmail: booking.email,
      userPhone: booking.phone,
      sessionTopic: booking.topic,
      sessionStart: startISO,
      meetingUrl,
    }),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[experts/book] email send failed:", result.reason);
      }
    }
  });

  // ── 10. Queue the 24h + 1h reminders (held at Resend until due) ──
  await queueReminders(bookingRow, meetingUrl);

  return NextResponse.json({
    status: "success",
    data: {
      bookingId,
      start: startISO,
      end: endISO,
      meetingUrl,
      title: `${expert.name} session`,
    },
  });
}

/**
 * Free-booking flow used while PAYMENTS_ENABLED is false. Mirrors the paid flow
 * minus the Razorpay verification and invoice email: validate → revalidate slot
 * → guard double-book → record (unpaid) → Google Meet → notify expert.
 */
async function handleFreeBooking(booking: BookBody["booking"]) {
  if (!booking?.slug || !booking?.start || !booking?.name || !booking?.email) {
    return NextResponse.json({ status: "error", error: "Missing required fields" }, { status: 400 });
  }

  const expert = getExpertBySlug(booking.slug);
  if (!expert) {
    return NextResponse.json({ status: "error", error: "Expert not found" }, { status: 404 });
  }

  const sessionMin = sessionMinutes(expert);
  const startISO = new Date(booking.start).toISOString();
  const endISO = new Date(new Date(booking.start).getTime() + sessionMin * 60_000).toISOString();

  // Revalidate the slot server-side (don't trust the client's start).
  if (!(await isStartTimeBookable(booking.slug, startISO, sessionMin))) {
    return NextResponse.json(
      { status: "error", error: "The selected time is no longer a valid booking slot." },
      { status: 422 },
    );
  }

  // Guard against double-booking.
  if (await isSlotTaken(booking.slug, startISO)) {
    return NextResponse.json(
      { status: "error", error: "This slot was just booked by someone else." },
      { status: 409 },
    );
  }

  // Record the (unpaid) booking.
  let bookingId: string;
  let bookingRow: BookingRow;
  try {
    const { booking: row, duplicate } = await createFreeBooking({
      expert_slug: booking.slug,
      user_name: booking.name,
      user_email: booking.email,
      user_phone: booking.phone ?? null,
      session_topic: booking.topic ?? null,
      start_time: startISO,
      end_time: endISO,
    });
    if (duplicate || !row) {
      return NextResponse.json(
        { status: "error", error: "Slot no longer available." },
        { status: 409 },
      );
    }
    bookingId = row.id;
    bookingRow = row;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not record booking";
    console.error("[experts/book] createFreeBooking:", message);
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }

  // Create Google Meet on the GrowQR company calendar (client + expert as
  // attendees). Failure must not lose the booking.
  let meetingUrl: string | null = null;
  try {
    const conn = await getCompanyConnection();
    if (conn?.google_refresh_token) {
      const { eventId, meetLink } = await createMeetEvent(conn, {
        summary: `GrowQR · ${expert.name} ↔ ${booking.name}`,
        description: booking.topic
          ? `Topic: ${booking.topic}\n\nBooked via GrowQR Advisory.`
          : "Booked via GrowQR Advisory.",
        startISO,
        endISO,
        timeZone: EXPERT_TZ,
        attendees: [booking.email, expert.email ?? NOTIFY_FALLBACK].filter(Boolean),
      });
      meetingUrl = meetLink;
      await attachGoogleEvent(bookingId, eventId, meetLink);
    } else {
      console.warn(`[experts/book] No company calendar connected — booking ${bookingId} has no Meet link.`);
      await flagMissingMeetLink({
        bookingId,
        booking,
        startISO,
        reason: "no company calendar connected",
      });
    }
  } catch (err) {
    console.error(`[experts/book] Google event failed for free booking ${bookingId}:`, err);
    await flagMissingMeetLink({
      bookingId,
      booking,
      startISO,
      reason: err instanceof Error ? err.message : "calendar error",
    });
  }

  // Notify the expert, confirm to the user, and alert support. Send them
  // before returning so they are not dropped by a short-lived serverless
  // invocation.
  await Promise.allSettled([
    sendExpertNotification({
      expertName: expert.name,
      expertEmail: expert.email ?? NOTIFY_FALLBACK,
      userName: booking.name,
      userEmail: booking.email,
      userPhone: booking.phone,
      sessionTopic: booking.topic,
      sessionStart: startISO,
      meetingUrl,
    }),
    sendUserConfirmation({
      userName: booking.name,
      userEmail: booking.email,
      expertName: expert.name,
      sessionTopic: booking.topic,
      sessionStart: startISO,
      meetingUrl,
    }),
    sendSupportNotification({
      expertName: expert.name,
      userName: booking.name,
      userEmail: booking.email,
      userPhone: booking.phone,
      sessionTopic: booking.topic,
      sessionStart: startISO,
      meetingUrl,
    }),
  ]).then((results) => {
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[experts/book] email send failed:", result.reason);
      }
    }
  });

  // Queue the 24h + 1h reminders (held at Resend until due).
  await queueReminders(bookingRow, meetingUrl);

  return NextResponse.json({
    status: "success",
    data: {
      bookingId,
      start: startISO,
      end: endISO,
      meetingUrl,
      title: `${expert.name} session`,
    },
  });
}
