/**
 * Send the missed-session follow-up to a seeker who did not join a booked
 * session. One template, any expert.
 *
 *   npx tsx scripts/send-missed-session.ts --list
 *   npx tsx scripts/send-missed-session.ts --booking <id>
 *   npx tsx scripts/send-missed-session.ts --booking <id> --send
 *
 * When the booking predates the bookings table, pass it by hand instead:
 *
 *   npx tsx scripts/send-missed-session.ts \
 *     --expert ruchi-sharma \
 *     --name "Vanapalli Madhu Kishore" \
 *     --email someone@example.com \
 *     --start "2026-08-31T10:00:00+05:30"
 *
 * Nothing sends without --send. The default prints the resolved recipient,
 * subject and plain-text body so the copy can be read before it goes out.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const IST = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true }) + " IST";

async function listPastBookings() {
  const { createAdminClient } = await import("../lib/supabase-server");
  const since = new Date(Date.now() - 90 * 24 * 60 * 60_000).toISOString();

  const { data, error } = await createAdminClient()
    .from("bookings")
    .select("id, expert_slug, user_name, user_email, start_time, status")
    .neq("status", "cancelled")
    .gte("start_time", since)
    .lte("start_time", new Date().toISOString())
    .order("start_time", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  console.log(`\n${rows.length} session(s) already past, last 90 days:\n`);
  for (const r of rows) {
    console.log(`  ${r.id}`);
    console.log(`    ${r.user_name} <${r.user_email}>  with  ${r.expert_slug}`);
    console.log(`    ${IST(r.start_time as string)}   [${r.status}]\n`);
  }
  console.log("Pick one and re-run with --booking <id>.\n");
}

async function resolveInput() {
  const { missedSessionInputFromBooking } = await import(
    "../features/experts/emails/missedSession"
  );

  const bookingId = arg("booking");
  if (bookingId) {
    const { createAdminClient } = await import("../lib/supabase-server");
    const { data, error } = await createAdminClient()
      .from("bookings")
      .select("expert_slug, user_name, user_email, session_topic, start_time")
      .eq("id", bookingId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error(`No booking with id ${bookingId}`);

    const input = missedSessionInputFromBooking(data as never);
    if (!input) throw new Error(`Unknown expert slug on booking ${bookingId}`);
    return input;
  }

  // Hand-typed path, for sessions that never landed in the table.
  const slug = arg("expert");
  const name = arg("name");
  const email = arg("email");
  const start = arg("start");
  if (!slug || !name || !email || !start) {
    throw new Error(
      "Pass --booking <id>, or all of --expert <slug> --name <name> --email <email> --start <iso>.",
    );
  }

  const parsed = new Date(start);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Unparseable --start: ${start}`);

  const input = missedSessionInputFromBooking({
    expert_slug: slug,
    user_name: name,
    user_email: email,
    session_topic: arg("topic") ?? null,
    start_time: parsed.toISOString(),
  });
  if (!input) throw new Error(`Unknown expert slug: ${slug}`);
  return input;
}

async function main() {
  if (flag("list")) {
    await listPastBookings();
    return;
  }

  const { buildMissedSessionEmail, sendMissedSessionEmail } = await import(
    "../features/experts/emails/missedSession"
  );

  const input = await resolveInput();
  const mail = buildMissedSessionEmail(input);

  console.log(`\nTo:       ${input.userName} <${input.userEmail}>`);
  console.log(`Expert:   ${input.expertName}`);
  console.log(`Session:  ${IST(input.sessionStart)}`);
  console.log(`Subject:  ${mail.subject}\n`);
  console.log("─".repeat(72));
  console.log(mail.text);
  console.log("─".repeat(72));

  if (!flag("send")) {
    console.log("\nDry run. Re-run with --send to actually send this.\n");
    return;
  }

  await sendMissedSessionEmail(input);
  console.log(`\nSent to ${input.userEmail}.\n`);
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
