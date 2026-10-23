/**
 * Run the reminder sweeper by hand, against the live database and live Resend.
 *
 *   npx tsx scripts/reminders-run.ts
 *
 * Identical to what GET /api/cron/expert-reminders does — same query, same
 * scheduler, same claiming — but callable without the deploy or the cron
 * secret. Use it to queue reminders for bookings that are already in the
 * database before the daily cron next fires.
 *
 * This SENDS. Reminders queued at Resend cannot be recalled with a send-only
 * API key, so check `npm run reminders:smoke` (dry run) first.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getBookingsWithPendingReminders } = await import(
    "../features/experts/services/bookings.service"
  );
  const { scheduleRemindersForBooking } = await import(
    "../features/experts/services/reminder-schedule"
  );

  const now = new Date();
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }) + " IST";

  const pending = await getBookingsWithPendingReminders(now);
  console.log(`\nSweeping ${pending.length} booking(s) at ${fmt(now)}\n`);

  let failures = 0;
  for (const b of pending) {
    console.log(`• ${b.expert_slug} ↔ ${b.user_email} — starts ${fmt(b.start_time)}`);
    const outcomes = await scheduleRemindersForBooking(b, now);
    for (const o of outcomes) {
      const detail = o.sendAt ? `→ ${fmt(o.sendAt)}` : (o.reason ?? "");
      console.log(`   ${o.stage.padEnd(4)} ${o.result.padEnd(15)} ${detail}`);
      if (o.result === "failed") failures++;
    }
  }

  console.log(failures === 0 ? "\nDone, no failures.\n" : `\nDone, ${failures} failed stage(s).\n`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
