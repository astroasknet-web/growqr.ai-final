import { createAdminClient } from "@/lib/data/server";
import { createLogger } from "@/lib/log";

/**
 * booking_intents are write-once, read-once attribution scratch space. Once the
 * matching booking has arrived (or clearly never will), the row is dead weight
 * holding personal-ish data — a landing page and a referrer — for no purpose.
 *
 * 30 days is generous: the gap between clicking "Book a call" and completing
 * the Cal form is minutes, and a booking made against a much older intent would
 * mean somebody shared the link, in which case the attribution belonged to a
 * different person anyway and is better lost than misapplied.
 */

const log = createLogger("cal-purge");

const RETENTION_DAYS = 30;

export async function purgeExpiredBookingIntents(): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("booking_intents")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    log.error("purge failed:", error);
    return 0;
  }

  const purged = data?.length ?? 0;
  if (purged) log.info(`purged ${purged} booking intent(s) older than ${RETENTION_DAYS} days`);
  return purged;
}
