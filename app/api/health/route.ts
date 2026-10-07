import { NextResponse } from "next/server";
import { databaseConfigured, val } from "@/lib/portal/db";

export const dynamic = "force-dynamic";

// For uptime checks after a deploy: is the server up, and can it reach the database? Reveals nothing else.
export async function GET() {
  const h = { "Cache-Control": "no-store" };
  if (!databaseConfigured()) return NextResponse.json({ ok: false, database: "not configured" }, { status: 503, headers: h });
  try {
    await val("SELECT 1");
    return NextResponse.json({ ok: true, database: "ok" }, { headers: h });
  } catch {
    return NextResponse.json({ ok: false, database: "unreachable" }, { status: 503, headers: h });
  }
}
