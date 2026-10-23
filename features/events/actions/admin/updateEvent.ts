"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/data/server";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminLog } from "@/lib/admin-logs";
import type { EventFormPayload } from "./createEvent";
import type { Json } from "@/types/database";

function toNullable(v: string): string | null {
  return v.trim() === "" ? null : v.trim();
}

function parseLimit(v: string): number | null {
  const n = parseInt(v, 10);
  return isNaN(n) || n <= 0 ? null : n;
}

export async function updateEvent(
  id: string,
  payload: EventFormPayload,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  if (!payload.title?.trim()) return { ok: false, error: "Title is required." };
  if (!payload.slug?.trim()) return { ok: false, error: "Slug is required." };
  if (!payload.event_date) return { ok: false, error: "Event date is required." };

  const admin = createAdminClient();

  const { error } = await admin
    .from("events")
    .update({
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
      meeting_platform: (toNullable(payload.meeting_platform) as "zoom" | "google_meet" | null),
      meeting_url: toNullable(payload.meeting_url),
      learnings: payload.learnings.filter((l) => l.trim()),
      // AgendaItem has no index signature, so it isn't assignable to the
      // generated Json column type; the shape is JSON-safe by construction.
      agenda: payload.agenda.filter((a) => a.title.trim()) as unknown as Json,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Another event uses this slug." };
    console.error("updateEvent error:", error);
    return { ok: false, error: "Failed to save changes. Please try again." };
  }

  createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "details_updated",
    target_id: id,
    target_name: payload.title.trim(),
    new_value: "Event updated",
    details: { module: "events" },
  }).catch((e) => console.error("Event update log failed:", e));

  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/events");
  revalidatePath(`/events/${payload.slug}`);
  revalidatePath("/events");
  revalidatePath("/events/all");

  return { ok: true };
}
