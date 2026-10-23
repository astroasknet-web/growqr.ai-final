"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/data/server";
import { getAdminUser } from "@/lib/auth/admin";
import { createAdminLog } from "@/lib/admin-logs";

export async function toggleEventStatus(
  id: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getAdminUser();
  if (!user) return { ok: false, error: "Not authorized." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("toggleEventStatus error:", error);
    return { ok: false, error: "Failed to update status." };
  }

  // Fire-and-forget, matching the internship and ambassador routes: a failed
  // log must never fail the action the admin actually asked for.
  createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "status_change",
    target_id: id,
    old_value: isActive ? "inactive" : "active",
    new_value: isActive ? "active" : "inactive",
    details: { module: "events" },
  }).catch((e) => console.error("Event status log failed:", e));

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
  return { ok: true };
}
