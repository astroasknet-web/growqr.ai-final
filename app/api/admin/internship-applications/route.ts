export const dynamic = "force-dynamic";

import { NextRequest, NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { createAdminLog } from "@/lib/admin-logs";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { INTERNSHIP_STATUSES } from "@/components/admin/InternshipStatusBadge";
import {
  fetchInternshipPage,
  InvalidFilterError,
  DEFAULT_PAGE_SIZE,
} from "@/lib/admin/applications-query";
import {
  STATUS_EMAIL,
  buildStatusEmail,
  isEmailableStatus,
} from "@/lib/internship/status-email";
import { sendInternshipEmail } from "@/lib/internship/send-email";
import type { TablesUpdate } from "@/types/database";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // The query itself lives in lib/admin/applications-query so this route and
  // the page's server-rendered first page can never drift apart on filtering,
  // validation, or which columns come back.
  try {
    const result = await fetchInternshipPage({
      page: parseInt(searchParams.get("page") ?? "1", 10),
      limit: parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10),
      search: searchParams.get("search")?.trim() ?? "",
      status: searchParams.get("status")?.trim() ?? "",
      role: searchParams.get("role")?.trim() ?? "",
      availability: searchParams.get("availability")?.trim() ?? "",
      mode: searchParams.get("mode")?.trim() ?? "",
      duration: searchParams.get("duration")?.trim() ?? "",
      triage: searchParams.get("triage")?.trim() ?? "",
      sort: searchParams.get("sort") === "asc" ? "asc" : "desc",
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InvalidFilterError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Internship list query failed:", err);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, internal_notes, notify } = body as {
    id: string;
    status?: string;
    internal_notes?: string;
    /** When true, a status change that has a candidate email actually sends it. */
    notify?: boolean;
  };

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (status && !INTERNSHIP_STATUSES.includes(status as (typeof INTERNSHIP_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: current, error: fetchError } = await admin
    .from("internship_applications")
    .select("status, full_name, internal_notes, email, preferred_role")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Application not found or database error" }, { status: 500 });
  }

  const updates: TablesUpdate<"internship_applications"> = {};
  if (status) updates.status = status;
  if (typeof internal_notes === "string") updates.internal_notes = internal_notes;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("internship_applications")
    .update(updates)
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const logAction = async () => {
    if (status && current && status !== current.status) {
      await createAdminLog({
        admin_email: user.email!,
        admin_id: user.id,
        action_type: "status_change",
        target_id: id,
        target_name: current.full_name,
        old_value: current.status,
        new_value: status,
        // Without this the activity feed can't tell an internship status change
        // from an ambassador one, and links "View Application" to the wrong
        // module. The other internship log types already carry it.
        details: { module: "internship" },
      });
    }

    if (typeof internal_notes === "string" && current && internal_notes !== current.internal_notes) {
      await createAdminLog({
        admin_email: user.email!,
        admin_id: user.id,
        action_type: "note_updated",
        target_id: id,
        target_name: current.full_name,
        details: { note_preview: internal_notes.substring(0, 50) + (internal_notes.length > 50 ? "..." : ""), module: "internship" },
      });
    }
  };

  // Fire and forget
  logAction().catch(e => console.error("Async log failed:", e));

  // Candidate email on an emailing status change, only when the reviewer asked
  // for it (the confirm box). Runs after the response so the dropdown returns
  // immediately; a send failure is recorded in the ledger, never surfaced as a
  // failed status change, because the status change already succeeded.
  const statusChanged = Boolean(status && current && status !== current.status);
  if (statusChanged && notify === true && status && isEmailableStatus(status) && current) {
    const emailStatus = status;
    const name = current.full_name;
    const role = current.preferred_role ?? "the internship";
    const to = current.email;
    const sentBy = user.email ?? null;

    after(async () => {
      try {
        // The offer email carries the start date and duration when a letter has
        // already been prepared; otherwise it goes out without them.
        let offer: { startLabel: string | null; durationLabel: string | null } | undefined;
        if (emailStatus === "offer") {
          const { data: appt } = await admin
            .from("internship_appointments")
            .select("start_date, duration")
            .eq("application_id", id)
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

        const email = buildStatusEmail(emailStatus, name, role, offer);
        await sendInternshipEmail({
          applicationId: id,
          kind: STATUS_EMAIL[emailStatus].kind,
          to,
          subject: email.subject,
          html: email.html,
          sentBy,
        });
      } catch (e) {
        console.error("Internship status email failed:", e);
      }
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("internship_applications")
    .select("full_name")
    .eq("id", id)
    .single();

  const { error } = await admin
    .from("internship_applications")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "application_deleted",
    target_id: id,
    target_name: current?.full_name || "Unknown",
    details: { deleted_at: new Date().toISOString(), module: "internship" },
  });

  return NextResponse.json({ success: true });
}
