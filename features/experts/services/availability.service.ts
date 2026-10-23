import { createAdminClient } from "@/lib/data/server";

export type AvailabilityRule = {
  id: string;
  expert_slug: string;
  day_of_week: number; // 0=Sun .. 6=Sat
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  slot_duration_min: number;
};

/** Active weekly availability rules for an expert. */
export async function getWeeklyAvailability(slug: string): Promise<AvailabilityRule[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("expert_availability")
    .select("id, expert_slug, day_of_week, start_time, end_time, slot_duration_min")
    .eq("expert_slug", slug)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("[availability.service] getWeeklyAvailability:", error.message);
    return [];
  }
  return (data ?? []) as AvailabilityRule[];
}
