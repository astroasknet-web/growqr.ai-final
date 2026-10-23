export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { isCohort } from "@/lib/cohorts";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const status = searchParams.get("status");
  const cohort = searchParams.get("cohort");

  if (cohort && !isCohort(cohort)) {
    return new NextResponse("Invalid cohort", { status: 400 });
  }

  const admin = createAdminClient();

  // PostgREST caps an unpaginated select at a project-configured row limit
  // (the getStats() head-count queries in app/admin/ambassador/page.tsx hit
  // the same cap, which is why they exist), with 1,124+ rows in this table,
  // a single unranged select here was silently truncating the CSV. Loop with
  // .range() so exports always include every matching row.
  const BATCH_SIZE = 1000;
  const data: any[] = [];
  let offset = 0;
  for (;;) {
    let query = admin
      .from("ambassador_applications")
      .select("full_name,email,phone,whatsapp,gender,aadhaar_number,college,college_location,course,semester,passing_year,student_id,home_town,current_address,cohort,status,created_at,linkedin,instagram,youtube,why_join,why_fit,led_something,experience,internal_notes")
      .order("created_at", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (start) query = query.gte("created_at", `${start}T00:00:00`);
    if (end) query = query.lte("created_at", `${end}T23:59:59`);
    if (status) query = query.eq("status", status);
    if (cohort) query = query.eq("cohort", cohort);

    const { data: batch, error } = await query;
    if (error) return new NextResponse(error.message, { status: 500 });

    data.push(...(batch ?? []));
    if (!batch || batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  // Convert to CSV
  const headers = [
    "Full Name", "Email", "Phone", "WhatsApp", "Gender", "Aadhaar Number", "College", "Campus Location",
    "Course", "Semester", "Passing Year", "Student ID", "Home Town", "Current Address",
    "Cohort", "Status", "Applied At", "LinkedIn", "Instagram", "YouTube", "Why Join", "Why Fit", "Leadership", "Experience", "Notes"
  ];

  const rows = (data ?? []).map((app) => [
    app.full_name,
    app.email,
    app.phone,
    app.whatsapp,
    app.gender,
    app.aadhaar_number,
    app.college,
    app.college_location,
    app.course,
    app.semester,
    app.passing_year,
    app.student_id,
    app.home_town,
    (app.current_address || "").replace(/\n/g, " "),
    app.cohort,
    app.status,
    app.created_at,
    app.linkedin,
    app.instagram,
    app.youtube,
    (app.why_join || "").replace(/\n/g, " "),
    (app.why_fit || "").replace(/\n/g, " "),
    (app.led_something || "").replace(/\n/g, " "),
    (app.experience || "").replace(/\n/g, " "),
    (app.internal_notes || "").replace(/\n/g, " ")
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ambassador_applications_${new Date().toISOString().split("T")[0]}.csv"`
    }
  });
}
