"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-server";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminLog } from "@/lib/admin-logs";
import type { AgendaItem } from "../../types/event";
import type { Json } from "@/types/database";

export interface EventFormPayload {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  speaker_name: string;
  speaker_designation: string;
  speaker_company: string;
  speaker_bio: string;
  speaker_image: string;
  poster_url: string;
  venue: string;
  city: string;
  country: string;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  duration: string;
  format: string;
  badge: string;
  price: string;
  registration_limit: string;
  is_active: boolean;
  event_mode: "offline" | "online";
  meeting_platform: string;
  meeting_url: string;
  learnings: string[];
  agenda: AgendaItem[];
}

function toNullable(v: string): string | null {
  return v.trim() === "" ? null : v.trim();
}

function parseLimit(v: string): number | null {
  const n = parseInt(v, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

export async function createEvent(
  payload: EventFormPayload,
): Promise<{ error?: string }> {
  const user = await getAdminUser();
  if (!user) return { error: "Not authorized." };
  if (!payload.title?.trim()) return { error: "Title is required." };
  if (!payload.slug?.trim()) return { error: "Slug is required." };
  if (!payload.event_date) return { error: "Event date is required." };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("events")
    .insert({
      title: payload.title.trim(),
      slug: payload.slug.trim().toLowerCase(),
      short_description: toNullable(payload.short_description),
      full_description: toNullable(payload.full_description),
      speaker_name: toNullable(payload.speaker_name),
      speaker_designation: toNullable(payload.speaker_designation),
      speaker_company: toNullable(payload.speaker_company),
      speaker_bio: toNullable(payload.speaker_bio),
      speaker_image: toNullable(payload.speaker_image),
      poster_url: toNullable(payload.poster_url),
      venue: toNullable(payload.venue),
      city: toNullable(payload.city),
      country: toNullable(payload.country),
      event_date: payload.event_date,
      start_time: toNullable(payload.start_time),
      end_time: toNullable(payload.end_time),
      timezone: payload.timezone || "Asia/Kolkata",
      duration: toNullable(payload.duration),
      format: payload.format || "Online",
      badge: payload.badge || "Free",
      price: toNullable(payload.price),
      registration_limit: parseLimit(payload.registration_limit),
      is_active: payload.is_active,
      event_mode: payload.event_mode || "offline",
      meeting_platform: toNullable(payload.meeting_platform) as "zoom" | "google_meet" | null,
      meeting_url: toNullable(payload.meeting_url),
      learnings: payload.learnings.filter((l) => l.trim()),
      // AgendaItem has no index signature, so it isn't assignable to the
      // generated Json column type; the shape is JSON-safe by construction.
      agenda: payload.agenda.filter((a) => a.title.trim()) as unknown as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "An event with this slug already exists." };
    console.error("createEvent error:", error);
    return { error: "Failed to create event. Please try again." };
  }

  createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "manual_entry",
    target_id: data.id,
    target_name: payload.title.trim(),
    new_value: "Event created",
    details: { module: "events" },
  }).catch((e) => console.error("Event create log failed:", e));

  // redirect() throws to unwind, so nothing may follow it here.
  redirect(`/admin/events/${data.id}`);
}
