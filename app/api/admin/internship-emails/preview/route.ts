export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { buildStatusEmail, isEmailableStatus } from "@/lib/internship/status-email";

/**
 * Renders the exact candidate email a status change would send, so the confirm
 * dialog's "Preview" opens the real thing rather than a mock. Read-only: it
 * builds the template and returns its HTML, and sends nothing.
 *
 * GET /api/admin/internship-emails/preview?applicationId=<id>&status=<status>
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get("applicationId")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  if (!applicationId) return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
  if (!isEmailableStatus(status)) {
    return NextResponse.json({ error: "This status does not email the candidate" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: app, error } = await admin
    .from("internship_applications")
    .select("full_name, preferred_role")
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const name = app.full_name;
  const role = app.preferred_role ?? "the internship";

  let offer: { startLabel: string | null; durationLabel: string | null } | undefined;
  if (status === "offer") {
    const { data: appt } = await admin
      .from("internship_appointments")
      .select("start_date, duration")
      .eq("application_id", applicationId)
      .maybeSingle();
    if (appt) {
      offer = {
        startLabel: appt.start_date
          ? new Date(appt.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
          : null,
        durationLabel: appt.duration ?? null,
      };
    }
  }

  const email = buildStatusEmail(status, name, role, offer);
  return new NextResponse(email.html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
