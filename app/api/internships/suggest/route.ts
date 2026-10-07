import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/portal/db";
import { suggest } from "@/lib/market/job-search";
import * as jobs from "@/lib/market/jobs";

export const dynamic = "force-dynamic";

// Type-ahead for the internship search box. Read-only, public, tiny JSON: roles, skills, companies and fields.
const hits = new Map<string, { t: number; n: number }>();

export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, max-age=30", "X-Content-Type-Options": "nosniff" };
  if (!databaseConfigured()) return NextResponse.json({ items: [] }, { headers });
  // A person typing makes a request every ~150 ms; cap it so the endpoint cannot be used to hammer the database.
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const now = Math.floor(Date.now() / 1000);
  let w = hits.get(ip) ?? { t: now, n: 0 };
  if (now - w.t >= 60) w = { t: now, n: 0 };
  w.n++;
  hits.set(ip, w);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.t >= 60) hits.delete(k);
  if (w.n > 240) return NextResponse.json({ items: [] }, { status: 429 });
  try {
    const q = Array.from((new URL(req.url).searchParams.get("q") ?? "").trim()).slice(0, 60).join("");
    return NextResponse.json({ items: suggest(await jobs.live(), q, 6) }, { headers });
  } catch (e) {
    console.error("internship-suggest:", e instanceof Error ? e.message : e);
    return NextResponse.json({ items: [] }, { headers });
  }
}
