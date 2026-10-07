import { NextRequest, NextResponse } from "next/server";
import {
  getEventAdmin,
  getEventRegistrations,
} from "@/features/events/services/adminEvents.service";
import { getAdminUser } from "@/lib/auth/admin";

function csvCell(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  // Auth — must be an authorized admin (allowlist)
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { eventId } = await params;
  const [event, rows] = await Promise.all([
    getEventAdmin(eventId),
    getEventRegistrations(eventId),
  ]);
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const header = [
    "Full Name", "Email", "Phone", "Company", "Designation",
    "LinkedIn", "Expectations", "Confirmation Sent", "Registered At",
  ].join(",");

  const body = rows
    .map((r) =>
      [
        csvCell(r.full_name),
        csvCell(r.email),
        csvCell(r.phone),
        csvCell(r.company),
        csvCell(r.designation),
        csvCell(r.linkedin_url),
        csvCell(r.expectations),
        r.confirmation_sent ? "yes" : "no",
        csvCell(r.created_at),
      ].join(","),
    )
    .join("\n");

  const csv = `${header}\n${body}\n`;
  const safeSlug = event.slug.replace(/[^a-z0-9-]/gi, "-");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${safeSlug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
