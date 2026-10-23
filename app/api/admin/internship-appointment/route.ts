export const dynamic = "force-dynamic";

import fs from "fs";
import path from "path";
import { createElement } from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/data/server";
import { createAdminLog } from "@/lib/admin-logs";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { renderAppointmentLetter, type AppointmentLetterParams } from "@/lib/internship/appointment-letter";
import { AppointmentLetterPDF } from "@/lib/internship/appointment-letter-pdf";
import { appointmentLetterIssued } from "@/lib/internship/emails";
import { sendInternshipEmail } from "@/lib/internship/send-email";
import { nextStatusOrNull } from "@/lib/internship/status-flow";
import type { TablesInsert } from "@/types/database";

/**
 * Prepare, preview and issue the internship appointment letter.
 *
 * The particulars live in internship_appointments (one row per application).
 * "save" upserts them; "send" upserts then renders the letter to a PDF and
 * mails it to the candidate, stamping issued_at. The letter says nothing about
 * compensation and neither does this route.
 *
 * Deliberately does NOT change the application status. Issuing the letter is an
 * HR action, but moving the pipeline to Offer stays a separate, explicit human
 * step (and that step is what mails the offer note), so the two never fire each
 * other by surprise.
 */

const LOGO_PATH = path.join(process.cwd(), "public", "emailogo.png");

/**
 * The wordmark as a base64 data URI, read once and cached. Embedding it beats
 * passing a file path to react-pdf because a route handler's own filesystem is
 * the one thing guaranteed to be there at runtime, whereas a public/ asset is
 * not reliably traced into a serverless bundle. If it cannot be read, the
 * letter still renders, just without the mark.
 */
let logoDataUri: string | null | undefined;
function getLogoDataUri(): string | undefined {
  if (logoDataUri !== undefined) return logoDataUri ?? undefined;
  try {
    logoDataUri = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString("base64")}`;
  } catch (e) {
    console.warn("[appointment] wordmark unavailable, rendering letter without it:", e);
    logoDataUri = null;
  }
  return logoDataUri ?? undefined;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Date-only or ISO string to "1 October 2026". Formatted in UTC so a date-only value never rolls back a day. */
function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface Particulars {
  referenceNo: string;
  designation: string;
  department: string;
  startDate: string;
  endDate: string | null;
  duration: string;
  reportingManager: string;
  location: string;
  signatoryName: string | null;
  signatoryTitle: string | null;
}

/** Validate and normalise the form body. Returns the record or an error message. */
function parseParticulars(body: Record<string, unknown>, applicationId: string): Particulars | string {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const designation = str(body.designation).slice(0, 200);
  const department = str(body.department).slice(0, 200);
  const startDate = str(body.startDate);
  const endDateRaw = str(body.endDate);
  const duration = str(body.duration).slice(0, 100);
  const reportingManager = str(body.reportingManager).slice(0, 200);
  const location = str(body.location).slice(0, 200);

  if (!designation) return "Designation is required";
  if (!department) return "Department is required";
  if (!ISO_DATE.test(startDate)) return "A valid start date is required";
  if (endDateRaw && !ISO_DATE.test(endDateRaw)) return "End date must be a valid date";
  if (!duration) return "Duration is required";
  if (!reportingManager) return "Reporting manager is required";
  if (!location) return "Work location is required";

  const year = new Date().getFullYear();
  const referenceNo =
    str(body.referenceNo).slice(0, 60) ||
    `GQR/INT/${year}/${applicationId.replace(/-/g, "").slice(-4).toUpperCase()}`;

  return {
    referenceNo,
    designation,
    department,
    startDate,
    endDate: endDateRaw || null,
    duration,
    reportingManager,
    location,
    signatoryName: str(body.signatoryName).slice(0, 200) || null,
    signatoryTitle: str(body.signatoryTitle).slice(0, 200) || null,
  };
}

function toLetterParams(
  p: Particulars,
  app: { full_name: string; email: string },
  issueDate: string,
): AppointmentLetterParams {
  return {
    date: issueDate,
    referenceNo: p.referenceNo,
    internName: app.full_name,
    internEmail: app.email,
    designation: p.designation,
    department: p.department,
    startDate: formatDate(p.startDate),
    endDate: p.endDate ? formatDate(p.endDate) : p.duration,
    duration: p.duration,
    reportingManager: p.reportingManager,
    location: p.location,
    signatoryName: p.signatoryName ?? undefined,
    signatoryTitle: p.signatoryTitle ?? undefined,
  };
}

/** GET /api/admin/internship-appointment?applicationId=<id> — HTML preview of the saved letter. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applicationId = new URL(req.url).searchParams.get("applicationId")?.trim() ?? "";
  if (!applicationId) return badRequest("Missing applicationId");

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("internship_applications")
    .select("full_name, email")
    .eq("id", applicationId)
    .single();
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const { data: appt } = await admin
    .from("internship_appointments")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (!appt) {
    return new NextResponse(
      "<p style='font-family:sans-serif;padding:24px'>No appointment letter prepared yet. Fill in the particulars and save first.</p>",
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const params = toLetterParams(
    {
      referenceNo: appt.reference_no,
      designation: appt.designation,
      department: appt.department,
      startDate: appt.start_date,
      endDate: appt.end_date,
      duration: appt.duration,
      reportingManager: appt.reporting_manager,
      location: appt.location,
      signatoryName: appt.signatory_name,
      signatoryTitle: appt.signatory_title,
    },
    app,
    formatDate(appt.issued_at ?? new Date().toISOString()),
  );

  return new NextResponse(renderAppointmentLetter(params), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return badRequest("Invalid request body");

  const applicationId = typeof body.applicationId === "string" ? body.applicationId : "";
  const action = body.action === "send" ? "send" : "save";
  if (!applicationId) return badRequest("Missing applicationId");

  const parsed = parseParticulars(body, applicationId);
  if (typeof parsed === "string") return badRequest(parsed);

  const admin = createAdminClient();
  const { data: app, error: appError } = await admin
    .from("internship_applications")
    .select("id, full_name, email, status")
    .eq("id", applicationId)
    .single();
  if (appError || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  // Upsert the particulars either way, so "send" always mails the latest values.
  const record: TablesInsert<"internship_appointments"> = {
    application_id: applicationId,
    reference_no: parsed.referenceNo,
    designation: parsed.designation,
    department: parsed.department,
    start_date: parsed.startDate,
    end_date: parsed.endDate,
    duration: parsed.duration,
    reporting_manager: parsed.reportingManager,
    location: parsed.location,
    signatory_name: parsed.signatoryName,
    signatory_title: parsed.signatoryTitle,
    created_by: user.email ?? null,
  };

  const { error: upsertError } = await admin
    .from("internship_appointments")
    .upsert(record, { onConflict: "application_id" });
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  if (action === "save") {
    return NextResponse.json({ success: true, referenceNo: parsed.referenceNo });
  }

  // action === "send": render the PDF and mail it.
  const issueDate = formatDate(new Date().toISOString());
  const params = toLetterParams(parsed, app, issueDate);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      createElement(AppointmentLetterPDF, { params, logoSrc: getLogoDataUri() }) as unknown as Parameters<
        typeof renderToBuffer
      >[0],
    );
  } catch (e) {
    console.error("[appointment] PDF render failed:", e);
    return NextResponse.json({ error: "Could not generate the letter PDF." }, { status: 500 });
  }

  const email = appointmentLetterIssued(app.full_name, parsed.designation);
  const safeRef = parsed.referenceNo.replace(/[^a-zA-Z0-9]+/g, "-");
  const result = await sendInternshipEmail({
    applicationId,
    kind: "appointment_letter",
    to: app.email,
    subject: email.subject,
    html: email.html,
    attachments: [{ filename: `${safeRef}.pdf`, content: pdfBuffer }],
    sentBy: user.email ?? null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: `The letter could not be emailed. ${result.error ?? ""}`.trim() },
      { status: 502 },
    );
  }

  const issuedAt = new Date().toISOString();
  await admin
    .from("internship_appointments")
    .update({ issued_at: issuedAt })
    .eq("application_id", applicationId);

  // Issuing the letter is the offer, so move the pipeline to Offer, forward-only.
  // No offer email fires here: the letter email above is the offer's message.
  const advanced = nextStatusOrNull(app.status, "offer");
  if (advanced) {
    await admin
      .from("internship_applications")
      .update({ status: advanced })
      .eq("id", applicationId);
  }

  createAdminLog({
    admin_email: user.email!,
    admin_id: user.id,
    action_type: "details_updated",
    target_id: applicationId,
    target_name: app.full_name,
    new_value: `Appointment letter issued (${parsed.referenceNo})`,
    details: { module: "internship", appointment_ref: parsed.referenceNo },
  }).catch((e) => console.error("Appointment log failed:", e));

  return NextResponse.json({ success: true, referenceNo: parsed.referenceNo, issuedAt });
}
