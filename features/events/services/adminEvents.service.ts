import "server-only";
import { createAdminClient } from "@/lib/data/server";
import type { EventRow } from "../types/event";

export interface EventWithCount extends EventRow {
  registration_count: number;
}

export interface AdminEventStats {
  total: number;
  active: number;
  inactive: number;
  totalRegistrations: number;
}

export interface RegistrationRow {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  // FIXME(backlog): "designation" and "linkedin_url" do not exist in the live
  // event_registrations schema — these fields are always undefined at runtime.
  designation: string | null;
  linkedin_url: string | null;
  expectations: string | null;
  confirmation_sent: boolean;
  created_at: string;
}

export async function listEventsAdmin(opts: {
  q?: string;
  filter?: "all" | "active" | "inactive";
} = {}): Promise<EventWithCount[]> {
  const admin = createAdminClient();

  let query = admin
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  if (opts.filter === "active") query = query.eq("is_active", true);
  if (opts.filter === "inactive") query = query.eq("is_active", false);

  const { data: events, error } = await query;
  if (error) { console.error("listEventsAdmin error:", error); return []; }
  if (!events?.length) return [];

  // Registration counts, aggregated in the database. This used to pull every
  // matching registration row back and tally them in JavaScript, which meant
  // PostgREST's unranged-select cap (1,000 rows) silently truncated the tally
  // once registrations across the listed events crossed it — the counts just
  // started reading low with no error anywhere.
  const { data: regCounts, error: regErr } = await admin.rpc(
    "admin_event_registration_counts",
  );
  if (regErr) console.error("admin_event_registration_counts error:", regErr);

  const countMap: Record<string, number> = {};
  for (const r of regCounts ?? []) {
    countMap[r.event_id] = Number(r.total) || 0;
  }

  const rows = (events as unknown as EventRow[]).map((e) => ({
    ...e,
    learnings: Array.isArray(e.learnings) ? e.learnings : [],
    agenda: Array.isArray(e.agenda) ? e.agenda : [],
    event_mode: (e.event_mode === "online" ? "online" : "offline") as EventRow["event_mode"],
    meeting_url: e.meeting_url ?? null,
    registration_count: countMap[e.id] ?? 0,
  })) as EventWithCount[];

  if (opts.q) {
    const q = opts.q.toLowerCase();
    return rows.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.speaker_name ?? "").toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function getEventAdmin(id: string): Promise<EventRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { console.error("getEventAdmin error:", error); return null; }
  if (!data) return null;
  const r = data as unknown as EventRow;
  return {
    ...r,
    learnings: Array.isArray(r.learnings) ? r.learnings : [],
    agenda: Array.isArray(r.agenda) ? r.agenda : [],
    event_mode: (r.event_mode === "online" ? "online" : "offline") as EventRow["event_mode"],
    meeting_url: r.meeting_url ?? null,
  };
}

export async function getAdminEventStats(): Promise<AdminEventStats> {
  const admin = createAdminClient();
  // All four tiles in a single aggregate rather than a select-everything plus
  // a separate count. The queries are sub-millisecond; the round trips weren't.
  const { data, error } = await admin.rpc("admin_event_stats");
  if (error) {
    console.error("getAdminEventStats error:", error);
    return { total: 0, active: 0, inactive: 0, totalRegistrations: 0 };
  }
  const row = data?.[0];
  return {
    total: Number(row?.total) || 0,
    active: Number(row?.active) || 0,
    inactive: Number(row?.inactive) || 0,
    totalRegistrations: Number(row?.total_registrations) || 0,
  };
}

export async function getEventRegistrations(
  eventId: string,
): Promise<RegistrationRow[]> {
  const admin = createAdminClient();

  // PostgREST caps an unranged select at a project-configured row limit
  // (commonly 1,000), so a single select here silently dropped attendees off
  // both the registrations screen and the CSV export once an event passed that
  // many sign-ups. Loop with .range() the same way the application exports do.
  const BATCH_SIZE = 1000;
  const rows: RegistrationRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) {
      console.error("getEventRegistrations error:", error);
      // Return what we have rather than nothing: a partial list is still
      // useful, and callers already handle an empty result.
      return rows;
    }
    rows.push(...((data ?? []) as unknown as RegistrationRow[]));
    if (!data || data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }
  return rows;
}
