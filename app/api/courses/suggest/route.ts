import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/portal/db";
import * as courses from "@/lib/market/courses";

export const dynamic = "force-dynamic";

// Type-ahead for the courses search box. Read-only, public, tiny JSON.
export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, max-age=30", "X-Content-Type-Options": "nosniff" };
  if (!databaseConfigured()) return NextResponse.json([], { headers });
  try {
    const q = Array.from((new URL(req.url).searchParams.get("q") ?? "").trim()).slice(0, 60).join("");
    return NextResponse.json((await courses.suggest(q)).map((r) => ({ slug: r.slug, title: r.title, cat: r.cat_name })), { headers });
  } catch (e) {
    console.error("courses-suggest:", e instanceof Error ? e.message : e);
    return NextResponse.json([], { headers });
  }
}
