import { createAdminClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";

export type BookingRow = {
  id: string;
  expert_slug: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  session_topic: string | null;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_inr: number | null;
  google_event_id: string | null;
  google_meet_link: string | null;
  /** Legacy single-stage flag. Nothing writes it since migration 0024. */
  reminder_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
  reminder_24h_email_ids: string[] | null;
  reminder_1h_email_ids: string[] | null;
  created_at: string;
};

/** Start times (ISO) of non-cancelled bookings for an expert within a range. */
export async function getBookedSlots(
  slug: string,
  fromISO: string,
  toISO: string,
): Promise<string[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("start_time")
    .eq("expert_slug", slug)
    .neq("status", "cancelled")
    .gte("start_time", fromISO)
    .lte("start_time", toISO);

  if (error) {
    console.error("[bookings.service] getBookedSlots:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.start_time as string);
}

/** True if a non-cancelled booking already exists for this expert+start. */
export async function isSlotTaken(slug: string, startISO: string): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("id")
    .eq("expert_slug", slug)
    .eq("start_time", startISO)
    .neq("status", "cancelled")
    .maybeSingle();

  if (error) {
    console.error("[bookings.service] isSlotTaken:", error.message);
    return false;
  }
  return !!data;
}

/**
 * Find an existing booking by Razorpay payment id (idempotency).
 * Lets /api/experts/book be safely retried — a duplicate verify call returns
 * the booking that was already created for that payment instead of erroring.
 */
export async function getBookingByPaymentId(
  paymentId: string,
): Promise<BookingRow | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .eq("razorpay_payment_id", paymentId)
    .maybeSingle();

  if (error) {
    console.error("[bookings.service] getBookingByPaymentId:", error.message);
    return null;
  }
  return (data as BookingRow) ?? null;
}

/** Insert a paid booking (called after payment is verified). */
export async function createPaidBooking(input: {
  expert_slug: string;
  user_name: string;
  user_email: string;
  user_phone?: string | null;
  session_topic?: string | null;
  start_time: string;
  end_time: string;
  amount_inr: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
}): Promise<{ booking: BookingRow | null; duplicate: boolean }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .insert({
      ...input,
      status: "confirmed",
      payment_status: "paid",
    })
    .select("*")
    .single();

  if (error) {
    // Unique index violation → slot was taken between availability and payment.
    if (error.code === "23505") return { booking: null, duplicate: true };
    console.error("[bookings.service] createPaidBooking:", error.message);
    throw new Error(error.message);
  }
  return { booking: data as BookingRow, duplicate: false };
}

/**
 * Insert a free (no-payment) booking. Used while the payment step is disabled —
 * mirrors createPaidBooking but leaves the Razorpay fields null and marks the
 * booking unpaid. Remove (or stop calling) once payments are re-enabled.
 */
export async function createFreeBooking(input: {
  expert_slug: string;
  user_name: string;
  user_email: string;
  user_phone?: string | null;
  session_topic?: string | null;
  start_time: string;
  end_time: string;
}): Promise<{ booking: BookingRow | null; duplicate: boolean }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .insert({
      ...input,
      status: "confirmed",
      payment_status: "unpaid",
      razorpay_order_id: null,
      razorpay_payment_id: null,
      amount_inr: null,
    })
    .select("*")
    .single();

  if (error) {
    // Unique index violation → slot was taken between availability and submit.
    if (error.code === "23505") return { booking: null, duplicate: true };
    console.error("[bookings.service] createFreeBooking:", error.message);
    throw new Error(error.message);
  }
  return { booking: data as BookingRow, duplicate: false };
}

/** The two pre-session reminder stages, by how far ahead of the session they go out. */
export type ReminderStageKey = "24h" | "1h";

type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

/** The stage's boolean column name, for the guarded-update predicate. */
function stageFlagColumn(stage: ReminderStageKey) {
  return stage === "24h" ? ("reminder_24h_sent" as const) : ("reminder_1h_sent" as const);
}

// Written out per stage rather than with a computed key: a computed key widens
// to a string index signature, which the generated Supabase types reject.
function stageFlagPatch(stage: ReminderStageKey, value: boolean): BookingUpdate {
  return stage === "24h" ? { reminder_24h_sent: value } : { reminder_1h_sent: value };
}

function stageIdsPatch(stage: ReminderStageKey, ids: string[]): BookingUpdate {
  return stage === "24h"
    ? { reminder_24h_email_ids: ids }
    : { reminder_1h_email_ids: ids };
}

/**
 * Upcoming, non-cancelled bookings with at least one reminder stage still
 * pending. Ordered soonest-first.
 *
 * Deliberately unfiltered by how far out the session is: the scheduler decides
 * per stage whether the send instant is inside Resend's 30-day scheduling
 * horizon, and leaves anything beyond it for a later sweep. Bounded by `limit`
 * so one bad run can't fan out unboundedly.
 */
export async function getBookingsWithPendingReminders(
  now: Date = new Date(),
  limit = 500,
): Promise<BookingRow[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .neq("status", "cancelled")
    .gt("start_time", now.toISOString())
    .or("reminder_24h_sent.eq.false,reminder_1h_sent.eq.false")
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[bookings.service] getBookingsWithPendingReminders:", error.message);
    return [];
  }
  return (data ?? []) as BookingRow[];
}

/**
 * Claim one reminder stage for a booking. Guarded on the current flag so two
 * overlapping runs can't both claim the same stage (the second update matches
 * no rows). Returns true only if THIS call flipped the flag — the caller then
 * owns the send and must releaseReminderStage() if it fails.
 */
export async function claimReminderStage(
  bookingId: string,
  stage: ReminderStageKey,
): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bookings")
    .update(stageFlagPatch(stage, true))
    .eq("id", bookingId)
    .eq(stageFlagColumn(stage), false)
    .select("id");

  if (error) {
    console.error(`[bookings.service] claimReminderStage(${stage}):`, error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * Hand a claimed stage back after a failed send, so the next sweep retries it.
 */
export async function releaseReminderStage(
  bookingId: string,
  stage: ReminderStageKey,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("bookings")
    .update(stageFlagPatch(stage, false))
    .eq("id", bookingId);

  if (error) {
    console.error(`[bookings.service] releaseReminderStage(${stage}):`, error.message);
  }
}

/**
 * Record the Resend email ids for a scheduled stage, so it can be cancelled or
 * rescheduled if the booking changes. Best-effort: the reminder is already
 * queued at Resend, so a failure here costs traceability, not delivery.
 */
export async function saveReminderEmailIds(
  bookingId: string,
  stage: ReminderStageKey,
  emailIds: string[],
): Promise<void> {
  if (emailIds.length === 0) return;
  const db = createAdminClient();
  const { error } = await db
    .from("bookings")
    .update(stageIdsPatch(stage, emailIds))
    .eq("id", bookingId);

  if (error) {
    console.error(`[bookings.service] saveReminderEmailIds(${stage}):`, error.message);
  }
}

/** Attach the Google Calendar event id + Meet link to a booking. */
export async function attachGoogleEvent(
  bookingId: string,
  googleEventId: string,
  meetLink: string | null,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("bookings")
    .update({ google_event_id: googleEventId, google_meet_link: meetLink })
    .eq("id", bookingId);

  if (error) console.error("[bookings.service] attachGoogleEvent:", error.message);
}
