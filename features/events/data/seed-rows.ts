import { eventsData } from "./events-data";
import type { EventRow } from "../types/event";

// Maps a seed (marketing placeholder) event to the same EventRow shape the DB
// returns, so pages can render seed events identically to real ones. Used as
// the fallback when the events table is empty or the database isn't configured
// (e.g. a preview/demo deployment) — see app/events/page.tsx and
// app/events/[slug]/page.tsx.
function toRow(e: (typeof eventsData)[number]): EventRow {
  return {
    id: e.slug,
    slug: e.slug,
    title: e.title,
    short_description: e.subtitle,
    full_description: e.description,
    speaker_name: e.speaker.name,
    speaker_designation: e.speaker.role,
    speaker_company: null,
    speaker_image: e.speaker.image || null,
    speaker_bio: e.speaker.bio,
    poster_url: e.image || null,
    venue: null,
    city: null,
    country: null,
    event_date: e.isoDate,
    start_time: e.time,
    end_time: null,
    timezone: null,
    duration: e.duration,
    format: e.format,
    badge: e.badge,
    price: e.price ?? null,
    learnings: e.learnings,
    agenda: e.agenda,
    registration_limit: null,
    is_active: true,
    event_mode: /online/i.test(e.format) ? "online" : "offline",
    meeting_platform: null,
    meeting_url: null,
    created_at: "",
    updated_at: "",
  };
}

export function seedEventsAsRows(): EventRow[] {
  return eventsData.map(toRow);
}

export function seedEventBySlug(slug: string): EventRow | null {
  const e = eventsData.find((x) => x.slug === slug);
  return e ? toRow(e) : null;
}

export function seedEventSlugs(): string[] {
  return eventsData.map((e) => e.slug);
}
