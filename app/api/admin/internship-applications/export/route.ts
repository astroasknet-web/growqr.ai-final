export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/data/server";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { FILTERABLE_ROLES, AVAILABILITY_VALUES, MODE_VALUES, DURATION_VALUES } from "@/lib/internship-options";

const EXPORT_COLUMNS =
  "full_name,email,phone,gender,dob,father_name,mother_name,aadhaar_number,college,college_location,course,degree_specialization,graduation_year,home_town,current_address,preferred_role,skills,availability,mode,duration,languages,career_profile_score,status,created_at,growqr_user_id,growqr_profile_url,growqr_rq_score,triage,triage_score,linkedin,portfolio,resume,why_intern,additional_notes,internal_notes";

// PostgREST caps unpaginated selects at a project-configured row limit
// (commonly 1000). See the identical comment in the ambassador export
// route. This loops with .range() so a table past that cap doesn't get
// silently truncated in the CSV.
const BATCH_SIZE = 1000;

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const status = searchParams.get("status");
  const role = searchParams.get("role");
  const availability = searchParams.get("availability");
  const mode = searchParams.get("mode");
  const duration = searchParams.get("duration");

  if (role && !FILTERABLE_ROLES.includes(role)) {
    return new NextResponse("Invalid role", { status: 400 });
  }
  if (availability && !AVAILABILITY_VALUES.includes(availability)) {
    return new NextResponse("Invalid availability", { status: 400 });
  }
  if (mode && !MODE_VALUES.includes(mode)) {
    return new NextResponse("Invalid mode", { status: 400 });
  }
  if (duration && !DURATION_VALUES.includes(duration)) {
    return new NextResponse("Invalid duration", { status: 400 });
  }

  const admin = createAdminClient();

  const rows: Record<string, unknown>[] = [];
  let offset = 0;
  for (;;) {
    let query = admin
      .from("internship_applications")
      .select(EXPORT_COLUMNS)
      .order("created_at", { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1);

    if (start) query = query.gte("created_at", `${start}T00:00:00`);
    if (end) query = query.lte("created_at", `${end}T23:59:59`);
    if (status) query = query.eq("status", status);
    if (role) query = query.eq("preferred_role", role);
    if (availability) query = query.eq("availability", availability);
    if (mode) query = query.eq("mode", mode);
    if (duration) query = query.eq("duration", duration);

    const { data, error } = await query;
    if (error) return new NextResponse(error.message, { status: 500 });

    rows.push(...(data ?? []));
    if (!data || data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  const headers = [
    "Full Name", "Email", "Phone", "Gender", "Date of Birth", "Father's Name", "Mother's Name",
    "Aadhaar Number", "College", "Campus Location",
    "Course", "Degree Specialization", "Graduation Year", "Home Town", "Current Address", "Preferred Role",
    "Skills", "Availability", "Mode", "Duration", "Languages", "Career Profile Score",
    "Status", "Applied At", "GrowQR User ID", "GrowQR Profile", "GrowQR RQ-Score", "Triage", "Triage Score",
    "LinkedIn", "Portfolio", "Resume",
    "Why Intern", "Additional Notes", "Internal Notes",
  ];

  const csvRows = rows.map((app: any) => [
    app.full_name,
    app.email,
    app.phone,
    app.gender,
    app.dob,
    app.father_name,
    app.mother_name,
    app.aadhaar_number,
    app.college,
    app.college_location,
    app.course,
    app.degree_specialization,
    app.graduation_year,
    app.home_town,
    (app.current_address || "").replace(/\n/g, " "),
    app.preferred_role,
    app.skills,
    app.availability,
    app.mode,
    app.duration,
    app.languages,
    app.career_profile_score,
    app.status,
    app.created_at,
    app.growqr_user_id,
    app.growqr_profile_url,
    app.growqr_rq_score,
    app.triage,
    app.triage_score,
    app.linkedin,
    app.portfolio,
    app.resume,
    (app.why_intern || "").replace(/\n/g, " "),
    (app.additional_notes || "").replace(/\n/g, " "),
    (app.internal_notes || "").replace(/\n/g, " "),
  ]);

  const csvContent = [
    headers.join(","),
    ...csvRows.map(row => row.map(cell => `"${(cell ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="internship_applications_${new Date().toISOString().split("T")[0]}.csv"`
    }
  });
}
