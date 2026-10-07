export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getBookingsWithPendingReminders } from "@/features/experts/services/bookings.service";
import {
  scheduleRemindersForBooking,
  type StageOutcome,
} from "@/features/experts/services/reminder-schedule";

/**
 * GET /api/cron/expert-reminders
 *
 * Top-up sweeper for the 24h and 1h pre-session reminders.
 *
 * The reminders themselves are queued at Resend with `scheduledAt` the moment
 * a booking is created, so this cron is NOT what times delivery — which is why
 * a once-a-day run is enough. It exists to catch the two cases the booking
 * request can't: a stage that failed to queue (Resend down, transient error),
 * and a booking made so far ahead that the send instant was still beyond
 * Resend's 30-day scheduling horizon.
 *
 * Idempotent: every stage is claimed in the database before it is queued, so
 * a stage already handled at booking time is never queued twice.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` (Vercel Cron adds this
 * automatically). Fails closed — an unset CRON_SECRET used to leave this open,
 * so a misconfigured deploy meant anyone could trigger reminder emails to real
 * users.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/expert-reminders] CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
  }

  const pending = await getBookingsWithPendingReminders();

  const tally: Record<StageOutcome["result"], number> = {
    scheduled: 0,
    sent: 0,
    skipped: 0,
    deferred: 0,
    "already-handled": 0,
    failed: 0,
  };

  for (const booking of pending) {
    const outcomes = await scheduleRemindersForBooking(booking);
    for (const outcome of outcomes) {
      tally[outcome.result]++;
      if (outcome.result === "failed") {
        console.error(
          `[cron/expert-reminders] booking ${booking.id} stage ${outcome.stage}: ${outcome.reason}`,
        );
      }
    }
  }

  return NextResponse.json({
    status: "success",
    bookings: pending.length,
    stages: tally,
  });
}
