export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminUser as getAuthUser } from "@/lib/auth/admin";
import { syncInterviewResults } from "@/lib/internship/sync-results";

/**
 * Pull AI-assessment results into our interview rows on demand.
 *
 * POST body: { applicationId?: string }
 *   - with applicationId: sync only that candidate's rounds (the card button).
 *   - without: sync every pending round (also called from the crm-sync cron).
 *
 * The heavy lifting and all the edge cases live in syncInterviewResults; this
 * is just the authenticated entry point.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const applicationId =
    body && typeof body.applicationId === "string" ? body.applicationId : undefined;

  const res = await syncInterviewResults({ applicationId });
  if (!res.ok) {
    return NextResponse.json({ error: `Could not sync results. ${res.error}` }, { status: 502 });
  }

  return NextResponse.json({ success: true, ...res.data });
}
