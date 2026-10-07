export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { createAdminLog } from "@/lib/admin-logs";
import { getInternshipSettings, updateInternshipSettings } from "@/lib/internship/settings";

/**
 * Read and write the one internship automation settings row.
 *
 * GET returns the current config (defaults when the row has never been saved).
 * PUT validates the whole patch in updateInternshipSettings and returns the
 * re-read config, so the client always renders exactly what the DB now holds.
 * Both are admin-only.
 */

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getInternshipSettings() });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const settings = await updateInternshipSettings(body, user.email ?? null);
    createAdminLog({
      admin_email: user.email!,
      admin_id: user.id,
      action_type: "details_updated",
      target_id: "internship-settings",
      target_name: "Internship automation settings",
      new_value: "Settings updated",
      details: { module: "internship", settings: true },
    }).catch((e) => console.error("Settings log failed:", e));
    return NextResponse.json({ success: true, settings });
  } catch (e) {
    console.error("Internship settings update failed:", e);
    return NextResponse.json({ error: "Could not save settings. Try again." }, { status: 500 });
  }
}
