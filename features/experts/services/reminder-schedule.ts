import { getExpertBySlug } from "@/features/experts/data/experts-data";
import {
  claimReminderStage,
  releaseReminderStage,
  saveReminderEmailIds,
} from "@/features/experts/services/bookings.service";
import {
  sendSessionReminder,
  STAGE_LEAD_MS,
  type ReminderStage,
} from "@/features/experts/emails/sessionReminder";

/* ────────────────────────────────────────────────────────────────
   Reminder scheduling.

   Both stages are handed to Resend with `scheduledAt` at the moment
   the booking is created, so delivery lands on the exact 24h and 1h
   marks without us running a minute-resolution cron (Vercel Hobby
   only allows daily crons). The daily cron is a top-up sweeper: it
   re-runs this for anything that failed to queue, and for bookings
   made so far out that the send instant was still beyond Resend's
   30-day scheduling horizon.
──────────────────────────────────────────────────────────────── */

/** Expert notifications fall back here if an expert has no per-expert email. */
export const NOTIFY_FALLBACK = "sahil@growqr.ai";

/** Resend refuses a schedule past 30 days. Stay a day clear of the edge. */
export const MAX_SCHEDULE_AHEAD_MS = 29 * 24 * 60 * 60_000;

/**
 * How late a stage can be picked up and still sent immediately. Past this the
 * copy would be wrong ("tomorrow" when it's in six hours), so the stage is
 * abandoned instead. Wider for 24h because the wording tolerates more drift.
 */
const STAGE_GRACE_MS: Record<ReminderStage, number> = {
  "24h": 60 * 60_000,
  "1h": 15 * 60_000,
};

export const REMINDER_STAGES: ReminderStage[] = ["24h", "1h"];

export type StagePlan =
  /** Hand to Resend, held until `sendAt`. */
  | { action: "schedule"; sendAt: Date }
  /** The mark just passed; send straight away. */
  | { action: "send-now" }
  /** The mark is unreachable (booked too late, or picked up too late). */
  | { action: "skip"; reason: string }
  /** Too far out for Resend to hold. Leave pending for a later sweep. */
  | { action: "defer"; reason: string };

/**
 * Decide what to do with one reminder stage of one booking. Pure — all the
 * timing rules live here so they can be tested without Resend or the database.
 */
export function planReminderStage(opts: {
  startTime: string | Date;
  stage: ReminderStage;
  now?: Date;
}): StagePlan {
  const { stage } = opts;
  const now = opts.now ?? new Date();
  const start = new Date(opts.startTime);
  const sendAt = new Date(start.getTime() - STAGE_LEAD_MS[stage]);
  const nowMs = now.getTime();

  if (sendAt.getTime() > nowMs + MAX_SCHEDULE_AHEAD_MS) {
    return { action: "defer", reason: `${stage} mark is beyond the 30-day scheduling horizon` };
  }
  if (sendAt.getTime() > nowMs) {
    return { action: "schedule", sendAt };
  }
  if (nowMs - sendAt.getTime() <= STAGE_GRACE_MS[stage] && start.getTime() > nowMs) {
    return { action: "send-now" };
  }
  return { action: "skip", reason: `${stage} mark already passed when the booking was seen` };
}

/** The booking fields the scheduler needs. */
export type ReminderBooking = {
  id: string;
  expert_slug: string;
  user_name: string;
  user_email: string;
  start_time: string;
  google_meet_link: string | null;
  reminder_24h_sent: boolean;
  reminder_1h_sent: boolean;
};

export type StageOutcome = {
  stage: ReminderStage;
  result: "scheduled" | "sent" | "skipped" | "deferred" | "already-handled" | "failed";
  sendAt?: string;
  reason?: string;
};

function stageAlreadyHandled(booking: ReminderBooking, stage: ReminderStage): boolean {
  return stage === "24h" ? booking.reminder_24h_sent : booking.reminder_1h_sent;
}

/**
 * Queue both reminder stages for one booking.
 *
 * Each stage is claimed in the database before the send so overlapping runs
 * (the booking request and the cron sweep firing at once) can never
 * double-send; a stage that fails to queue is released for the next sweep.
 *
 * Never throws — a booking must not be lost because a reminder could not be
 * queued. Callers can log the returned outcomes.
 */
export async function scheduleRemindersForBooking(
  booking: ReminderBooking,
  now: Date = new Date(),
): Promise<StageOutcome[]> {
  const expert = getExpertBySlug(booking.expert_slug);
  const expertName = expert?.name ?? booking.expert_slug;
  const expertEmail = expert?.email ?? NOTIFY_FALLBACK;

  const outcomes: StageOutcome[] = [];

  for (const stage of REMINDER_STAGES) {
    if (stageAlreadyHandled(booking, stage)) {
      outcomes.push({ stage, result: "already-handled" });
      continue;
    }

    const plan = planReminderStage({ startTime: booking.start_time, stage, now });

    // Leave it pending — a later sweep will be inside the horizon.
    if (plan.action === "defer") {
      outcomes.push({ stage, result: "deferred", reason: plan.reason });
      continue;
    }

    // Claim before doing anything observable.
    const claimed = await claimReminderStage(booking.id, stage);
    if (!claimed) {
      outcomes.push({ stage, result: "already-handled" });
      continue;
    }

    // Claimed purely to retire it — the mark is unreachable, nothing to send.
    if (plan.action === "skip") {
      outcomes.push({ stage, result: "skipped", reason: plan.reason });
      continue;
    }

    try {
      const { ok, emailIds } = await sendSessionReminder({
        stage,
        expertName,
        expertEmail,
        userName: booking.user_name,
        userEmail: booking.user_email,
        sessionStart: booking.start_time,
        meetingUrl: booking.google_meet_link,
        ...(plan.action === "schedule" ? { scheduledAt: plan.sendAt.toISOString() } : {}),
      });

      if (!ok) {
        await releaseReminderStage(booking.id, stage);
        outcomes.push({ stage, result: "failed", reason: "Resend rejected both recipients" });
        continue;
      }

      await saveReminderEmailIds(booking.id, stage, emailIds);
      outcomes.push(
        plan.action === "schedule"
          ? { stage, result: "scheduled", sendAt: plan.sendAt.toISOString() }
          : { stage, result: "sent" },
      );
    } catch (err) {
      await releaseReminderStage(booking.id, stage);
      const reason = err instanceof Error ? err.message : "reminder send threw";
      console.error(`[reminder-schedule] ${stage} failed for booking ${booking.id}:`, err);
      outcomes.push({ stage, result: "failed", reason });
    }
  }

  return outcomes;
}
