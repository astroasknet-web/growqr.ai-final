export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/log";
import { runSyncSweep } from "@/lib/crm/sync";
import { alertOnStuckRows } from "@/lib/crm/health";
import { isCrmSyncEnabled } from "@/lib/crm/sources";
import { retryPendingBookingNotifications } from "@/lib/cal/notify";
import { purgeExpiredBookingIntents } from "@/lib/cal/purge";
import { flushIdleTranscripts } from "@/lib/bot/transcript";
import { syncInterviewResults } from "@/lib/internship/sync-results";
import { adzunaConfigured, syncAdzuna } from "@/lib/market/external";

const log = createLogger("cron/crm-sync");

/**
 * GET /api/cron/crm-sync — the CRM queue's durability layer (schedule in
 * vercel.json; DAILY on the current Vercel Hobby plan, which caps crons at
 * once per day). Reaps stale 'syncing' claims and drains 'pending'/'failed'
 * rows for every enabled source. The inline after() hook is just the fast
 * path; this sweep is what guarantees no lead is ever lost — on a daily
 * schedule it guarantees it within 24h rather than 15 minutes.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`, failing closed when
 * the secret is unset (same contract as cron/expert-reminders). Respects the
 * CRM_SYNC_ENABLED kill switch: while off, rows accumulate untouched and the
 * sweep drains them after re-enable — zero data loss.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    log.error("CRON_SECRET is not set — refusing to run");
    return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ status: "error", error: "Unauthorized" }, { status: 401 });
  }

  // Two booking lanes that run BEFORE — and independently of — the CRM kill
  // switch, on purpose:
  //
  //  - A booked call must reach the team even when CRM_SYNC_ENABLED is false or
  //    Zoho is unreachable. Gating the notification on the CRM switch would mean
  //    turning off CRM sync silently turns off booking alerts too, which is the
  //    kind of coupling nobody remembers at 2am.
  //  - booking_intents are write-once attribution scratch space, worthless once
  //    their booking has arrived (or hasn't, weeks later), and their purge has
  //    nothing to do with Zoho at all.
  //
  // Both are best-effort: neither can fail this cron.
  const notified = await retryPendingBookingNotifications().catch((error) => {
    log.error("booking notification retry failed:", error);
    return 0;
  });
  const purged = await purgeExpiredBookingIntents().catch((error) => {
    log.error("booking intent purge failed:", error);
    return 0;
  });

  // Internship interview results: pull finished AI assessments into their rows.
  // Independent of the CRM kill switch and best-effort, for the same reason the
  // booking lanes are: a candidate's score must land even when CRM sync is off.
  // No-op unless the interview key is configured, and it self-heals on the next
  // run if the service is briefly down.
  const interviews = await syncInterviewResults()
    .then((r) => (r.ok ? r.data : null))
    .catch((error) => {
      log.error("interview results sync failed:", error);
      return null;
    });
  if (interviews) log.info("interview sync:", JSON.stringify(interviews));

  // Adzuna India feed for the "More internships from the web" section. Same rules as the lanes above: independent of the CRM kill
  // switch, best-effort, and a no-op until ADZUNA_APP_ID / ADZUNA_APP_KEY are set.
  if (adzunaConfigured()) {
    const feed = await syncAdzuna().catch((error) => {
      log.error("external internships sync failed:", error instanceof Error ? error.message : error);
      return null;
    });
    if (feed) log.info("external internships:", JSON.stringify(feed));
  }

  if (!isCrmSyncEnabled()) {
    return NextResponse.json({
      status: "skipped",
      reason: "CRM_SYNC_ENABLED is not true",
      notified,
      purged,
    });
  }

  try {
    const summary = await runSyncSweep();
    log.info("sweep complete:", JSON.stringify(summary));

    // Chat transcripts, AFTER the sweep: a conversation's Note can only be
    // attached once its Lead exists in Zoho, and the sweep is what creates the
    // ones the after() fast path missed. Running it first would defer every
    // such transcript a full day.
    //
    // SalesIQ has no end-of-chat webhook, so "finished" means "quiet for 20
    // minutes" (see lib/bot/transcript.ts). On the Hobby plan's daily cron
    // that makes the transcript up to 24h behind the Lead itself — the Lead
    // and its conversation id still land within seconds, so a rep is never
    // blocked, they just get the full exchange the next morning. A shorter
    // cron interval is the one thing that would tighten it.
    const transcripts = await flushIdleTranscripts().catch((error) => {
      log.error("transcript flush failed:", error);
      return { flushed: 0, failed: 0, purged: 0 };
    });
    // After the sweep (and its reaper) has done all it can: anything still
    // stuck needs a human — one digest email per run, only when non-empty.
    // alertOnStuckRows never throws; a broken alert path can't fail the cron.
    const alert = await alertOnStuckRows();
    return NextResponse.json({ status: "ok", summary, alert, notified, purged, transcripts });
  } catch (error) {
    log.error("sweep crashed:", error);
    return NextResponse.json({ status: "error", error: "Sweep failed" }, { status: 500 });
  }
}
