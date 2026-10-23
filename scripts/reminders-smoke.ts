/**
 * Pre-session reminder smoke test — proves the 24h + 1h pipeline end to end
 * against the live database and live Resend, without emailing anyone real.
 *
 *   npx tsx scripts/reminders-smoke.ts          # dry run: plan only, no I/O
 *   npx tsx scripts/reminders-smoke.ts --live   # full round trip
 *
 * Dry run prints what the scheduler WOULD do for every upcoming booking
 * currently pending a reminder. Nothing is written, nothing is sent.
 *
 * --live additionally inserts one throwaway booking addressed to SMOKE_EMAIL,
 * runs the real scheduler against it (so Resend genuinely accepts a scheduled
 * send), reads the stored email ids back, then cancels both scheduled emails
 * and deletes the row. Cleanup runs in a finally block.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const SMOKE_EMAIL = "sahil@growqr.ai";
// Deliberately NOT a real expert slug. getExpertBySlug() returns undefined, so
// the expert recipient falls back to NOTIFY_FALLBACK and both copies land in
// our own inbox — a real slug would mail that expert's actual address. It also
// cannot collide with a genuine booking on the (expert_slug, start_time) index.
const SMOKE_SLUG = "__reminder-smoke-test__";

async function main() {
  const live = process.argv.includes("--live");

  const { getBookingsWithPendingReminders } = await import(
    "../features/experts/services/bookings.service"
  );
  const { planReminderStage, REMINDER_STAGES, scheduleRemindersForBooking } = await import(
    "../features/experts/services/reminder-schedule"
  );
  const { createAdminClient } = await import("../lib/data/server");
  const { getResend } = await import("../lib/resend");

  const now = new Date();
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }) + " IST";

  // ── 1. Dry run over the real pending bookings ──────────────────────────
  console.log(`\n=== Pending bookings (as of ${fmt(now)}) ===\n`);
  const pending = await getBookingsWithPendingReminders(now);
  if (pending.length === 0) console.log("  (none)");

  for (const b of pending) {
    console.log(`• ${b.expert_slug} ↔ ${b.user_email}`);
    console.log(`  starts ${fmt(b.start_time)}`);
    for (const stage of REMINDER_STAGES) {
      const plan = planReminderStage({ startTime: b.start_time, stage, now });
      const detail =
        plan.action === "schedule"
          ? `send at ${fmt(plan.sendAt)}`
          : plan.action === "send-now"
            ? "send immediately"
            : plan.reason;
      console.log(`  ${stage.padEnd(4)} → ${plan.action.padEnd(9)} ${detail}`);
    }
    console.log();
  }

  if (!live) {
    console.log("Dry run only. Re-run with --live to exercise Resend + the database.\n");
    return;
  }

  // ── 2. Live round trip on a throwaway booking ──────────────────────────
  //
  // Pre-flight: a send-only Resend key can schedule but NOT cancel, which
  // would strand the test emails in the queue until they really deliver.
  // Probe with a throwaway id — a full-access key 404s, a restricted one 401s.
  // Refuse to run if SMOKE_SLUG resolves to a real expert — that would put a
  // fake "your session is tomorrow" in an actual expert's inbox.
  const { getExpertBySlug } = await import("../features/experts/data/experts-data");
  const resolved = getExpertBySlug(SMOKE_SLUG);
  if (resolved) {
    console.error(
      `\nAborting --live: SMOKE_SLUG "${SMOKE_SLUG}" is a real expert ` +
        `(${resolved.email ?? "no email"}). The smoke test must only mail ${SMOKE_EMAIL}.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const probe = await fetch(
    "https://api.resend.com/emails/00000000-0000-0000-0000-000000000000",
    { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } },
  );
  if (probe.status === 401) {
    console.error(
      "\nAborting --live: RESEND_API_KEY is send-only, so the scheduled test\n" +
        "emails could not be cancelled afterwards and would actually deliver.\n" +
        "Use a full-access key for this script.\n",
    );
    process.exitCode = 1;
    return;
  }

  const db = createAdminClient();
  // 10 days out: inside Resend's 30-day horizon so both stages really schedule,
  // and on an odd minute so it cannot collide with a real :00/:30 slot.
  const start = new Date(now.getTime() + 10 * 24 * 3_600_000);
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(37);

  console.log("=== Live round trip ===\n");
  const { data: row, error: insertErr } = await db
    .from("bookings")
    .insert({
      expert_slug: SMOKE_SLUG,
      user_name: "Reminder Smoke Test",
      user_email: SMOKE_EMAIL,
      start_time: start.toISOString(),
      end_time: new Date(start.getTime() + 30 * 60_000).toISOString(),
      status: "confirmed",
      payment_status: "unpaid",
    })
    .select("*")
    .single();

  if (insertErr || !row) {
    console.error("insert failed:", insertErr?.message);
    process.exitCode = 1;
    return;
  }
  console.log(`inserted booking ${row.id}, session ${fmt(row.start_time)}`);

  const emailIds: string[] = [];
  try {
    const outcomes = await scheduleRemindersForBooking(
      {
        id: row.id,
        expert_slug: row.expert_slug,
        user_name: row.user_name,
        user_email: row.user_email,
        start_time: row.start_time,
        google_meet_link: "https://meet.google.com/smoke-test-xyz",
        reminder_24h_sent: row.reminder_24h_sent,
        reminder_1h_sent: row.reminder_1h_sent,
      },
      now,
    );

    for (const o of outcomes) {
      console.log(`  ${o.stage.padEnd(4)} → ${o.result}${o.sendAt ? ` at ${fmt(o.sendAt)}` : ""}${o.reason ? ` (${o.reason})` : ""}`);
    }

    // Read the row back: flags claimed, Resend ids persisted.
    const { data: after } = await db
      .from("bookings")
      .select("reminder_24h_sent, reminder_1h_sent, reminder_24h_email_ids, reminder_1h_email_ids")
      .eq("id", row.id)
      .single();

    console.log("\n  stored state:", JSON.stringify(after, null, 2));
    emailIds.push(...(after?.reminder_24h_email_ids ?? []), ...(after?.reminder_1h_email_ids ?? []));

    const ok =
      after?.reminder_24h_sent === true &&
      after?.reminder_1h_sent === true &&
      emailIds.length === 4; // 2 stages × (attendee + expert)

    console.log(
      `\n  ${ok ? "PASS" : "FAIL"} — expected both stages claimed and 4 scheduled Resend ids, got ${emailIds.length}`,
    );
    if (!ok) process.exitCode = 1;
  } finally {
    // ── 3. Cleanup: cancel the scheduled emails, drop the row ────────────
    const resend = getResend();
    for (const id of emailIds) {
      const res = await resend.emails.cancel(id);
      console.log(`  cancelled ${id}${res.error ? ` (error: ${res.error.message})` : ""}`);
    }
    await db.from("bookings").delete().eq("id", row.id);
    console.log(`  deleted booking ${row.id}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
