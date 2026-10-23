export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { createAdminLog } from "@/lib/admin-logs";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { CURRENT_COHORT } from "@/lib/cohorts";
import { AMBASSADOR_STATUSES } from "@/lib/admin/statuses";
import {
  fetchAmbassadorPage,
  InvalidFilterError,
  DEFAULT_PAGE_SIZE,
} from "@/lib/admin/applications-query";
import type { TablesInsert, TablesUpdate } from "@/types/database";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  // The query itself lives in lib/admin/applications-query so this route and
  // the page's server-rendered first page can never drift apart on filtering,
  // validation, or which columns come back.
  try {
    const result = await fetchAmbassadorPage({
      page: parseInt(searchParams.get("page") ?? "1", 10),
      limit: parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10),
      search: searchParams.get("search")?.trim() ?? "",
      status: searchParams.get("status")?.trim() ?? "",
      cohort: searchParams.get("cohort")?.trim() ?? "",
      sort: searchParams.get("sort") === "asc" ? "asc" : "desc",
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InvalidFilterError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Ambassador list query failed:", err);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }
}


export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, internal_notes } = body as {
    id: string;
    status?: string;
    internal_notes?: string;
  };

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (status && !(AMBASSADOR_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch current state for logging
  const { data: current, error: fetchError } = await admin
    .from("ambassador_applications")
    .select("status, full_name, internal_notes")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Application not found or database error" }, { status: 500 });
  }

  const updates: TablesUpdate<"ambassador_applications"> = {};
  if (status) updates.status = status;
  if (typeof internal_notes === "string") updates.internal_notes = internal_notes;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("ambassador_applications")
    .update(updates)
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Log the action asynchronously so we don't block the response
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
      });
    }

    if (typeof internal_notes === "string" && current && internal_notes !== current.internal_notes) {
      await createAdminLog({
        admin_email: user.email!,
        admin_id: user.id,
        action_type: "note_updated",
        target_id: id,
        target_name: current.full_name,
        details: { note_preview: internal_notes.substring(0, 50) + (internal_notes.length > 50 ? "..." : "") }
      });
    }
  };

  // Fire and forget
  logAction().catch(e => console.error("Async log failed:", e));

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const fullName = text(body.full_name);
  // Normalised the same way the public form does. Without the lowercase, an
  // address typed with different capitalisation slips past the unique email
  // index and the same person lands in the table twice.
  const email = text(body.email).toLowerCase();
  const college = text(body.college);
  const course = text(body.course);
  const phone = text(body.phone);
  const whatsapp = text(body.whatsapp);
  const passingYear = text(body.passing_year);
  const studentId = text(body.student_id);
  const linkedin = text(body.linkedin);
  const resume = text(body.resume);
  const whyJoin = text(body.why_join);
  const whyFit = text(body.why_fit);
  const ledSomething = text(body.led_something);
  const instagram = text(body.instagram);
  const youtube = text(body.youtube);
  const experience = text(body.experience);

  // Validated here against the same rules the table's CHECK constraints
  // enforce. Quick Add previously sent a partial row and let the database reject
  // it, which surfaced as a raw constraint name — and because "resume" was
  // omitted entirely, every single Quick Add failed. Checking up front means
  // the admin gets told which field is wrong instead.
  const url = /^https?:\/\//i;
  const problems: string[] = [];

  if (fullName.length < 2 || fullName.length > 200) problems.push("Full name (2-200 characters)");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) problems.push("A valid email address");
  if (college.length < 2 || college.length > 300) problems.push("College (2-300 characters)");
  if (course.length < 2 || course.length > 200) problems.push("Course (2-200 characters)");
  if (phone.length < 7 || phone.length > 25) problems.push("Phone (7-25 characters)");
  if (whatsapp.length < 7 || whatsapp.length > 25) problems.push("WhatsApp (7-25 characters)");
  if (!/^\d{4}$/.test(passingYear)) problems.push("Passing year (4 digits)");
  if (studentId.length < 2 || studentId.length > 100) problems.push("Student ID (2-100 characters)");
  if (!url.test(linkedin)) problems.push("LinkedIn URL (must start with http:// or https://)");
  if (!url.test(resume)) problems.push("Resume link (must start with http:// or https://)");
  if (whyJoin.length < 20) problems.push("Why do you want to join? (at least 20 characters)");
  if (whyFit.length < 20) problems.push("Why are you a good fit? (at least 20 characters)");
  if (!["yes", "no"].includes(ledSomething)) problems.push("Have you led or organized something? (yes or no)");
  if (youtube && !url.test(youtube)) problems.push("YouTube URL (must start with http:// or https://)");

  if (problems.length) {
    return NextResponse.json(
      { error: `Please complete: ${problems.join("; ")}.` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ambassador_applications")
    .insert([{
      full_name: fullName,
      email,
      college,
      course,
      phone,
      whatsapp,
      passing_year: passingYear,
      student_id: studentId,
      linkedin,
      resume,
      instagram: instagram || null,
      youtube: youtube || null,
      why_join: whyJoin,
      why_fit: whyFit,
      led_something: ledSomething,
      experience: experience || null,
      status: "pending",
      cohort: CURRENT_COHORT,
    } satisfies TablesInsert<"ambassador_applications">])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An application with this email already exists." },
        { status: 409 },
      );
    }
    console.error("Quick Add insert failed:", error);
    return NextResponse.json(
      { error: "Could not save this application. Please try again." },
      { status: 500 },
    );
  }

  // Log the manual entry
  await createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "manual_entry",
    target_id: data.id,
    target_name: fullName,
    details: { email, college, source: "manual_quick_add" }
  });

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch name for logging before deleting
  const { data: current } = await admin
    .from("ambassador_applications")
    .select("full_name")
    .eq("id", id)
    .single();

  const { error } = await admin
    .from("ambassador_applications")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the deletion
  await createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "application_deleted",
    target_id: id,
    target_name: current?.full_name || "Unknown",
    details: { deleted_at: new Date().toISOString() }
  });

  return NextResponse.json({ success: true });
}
