import "server-only";
import { createAdminClient, isDatabaseConfigured } from "@/lib/data/server";
import type { EventRow } from "../types/event";

const EVENT_COLUMNS =
  "id, slug, title, short_description, full_description, " +
  "speaker_name, speaker_designation, speaker_company, speaker_image, speaker_bio, " +
  "poster_url, venue, city, country, event_date, start_time, end_time, timezone, " +
  "duration, format, badge, price, learnings, agenda, registration_limit, is_active, " +
  "event_mode, meeting_platform, meeting_url, created_at, updated_at";

function normaliseRow(row: unknown): EventRow {
  const r = row as EventRow & { learnings?: unknown; agenda?: unknown };
  return {
    ...r,
    learnings: Array.isArray(r.learnings) ? (r.learnings as string[]) : [],
    agenda: Array.isArray(r.agenda) ? (r.agenda as EventRow["agenda"]) : [],
    event_mode: (r.event_mode === "online" ? "online" : "offline") as EventRow["event_mode"],
    meeting_platform: (r.meeting_platform ?? null) as EventRow["meeting_platform"],
    meeting_url: r.meeting_url ?? null,
  };
}

export async function listActiveEvents(): Promise<EventRow[]> {
  if (!isDatabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("is_active", true)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("listActiveEvents error:", error);
    return [];
  }
  return (data ?? []).map(normaliseRow);
}

export async function getActiveEventBySlug(
  slug: string,
): Promise<EventRow | null> {
  if (!isDatabaseConfigured()) return null;
  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("getActiveEventBySlug error:", error);
    return null;
  }
  return data ? normaliseRow(data) : null;
}

export async function listActiveEventSlugs(): Promise<string[]> {
  if (!isDatabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select("slug")
    .eq("is_active", true);
  if (error) {
    console.error("listActiveEventSlugs error:", error);
    return [];
  }
  return (data ?? []).map((r) => r.slug as string);
}

/** Slug + last-touched timestamp for every active event, for the sitemap.
 *
 *  Kept separate from listActiveEventSlugs (which feeds generateStaticParams)
 *  so the sitemap can carry a real <lastmod> without changing which event
 *  pages get prerendered. */
export async function listEventsForSitemap(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  if (!isDatabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("events")
    .select("slug, updated_at")
    .eq("is_active", true);
  if (error) {
    console.error("listEventsForSitemap error:", error);
    return [];
  }
  return (data ?? []).flatMap((r) => {
    const parsed = new Date(r.updated_at as string);
    // Skip an unparseable timestamp rather than emit an Invalid Date, which
    // would serialise to a malformed <lastmod> and get the whole sitemap
    // entry distrusted.
    return Number.isNaN(parsed.getTime())
      ? []
      : [{ slug: r.slug as string, updatedAt: parsed }];
  });
}

export async function countRegistrations(eventId: string): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  const db = createAdminClient();
  const { count, error } = await db
    .from("event_registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);
  if (error) {
    console.error("countRegistrations error:", error);
    return 0;
  }
  return count ?? 0;
}
