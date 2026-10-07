import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import { mfaRequiredFor } from "@/lib/portal/auth";
import * as AC from "@/lib/crm/access";
import * as RP from "@/lib/crm/reports";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const no = (s: number, t: string) => new Response(t, { status: s, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (!databaseConfigured()) return no(503, "Not available.");
  const me = (await getSession())?.user;
  if (!me || !["admin", "counselor"].includes(me.role)) return no(401, "Please log in.");
  if (mfaRequiredFor(me) && !me.mfa_enabled_at) return no(403, "Set up two-step login first.");
  if (!(await AC.isManager(me))) return no(403, "Managers only.");
  const q = new URL(req.url).searchParams;
  const d = Number(q.get("days"));
  const days = d in RP.RANGES ? d : 30;
  const what = q.get("what") === "team" ? "team" : "funnel";
  return new Response("﻿" + (await RP.csv(what, days)), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="crm-${what}-${days}d.csv"`, "Cache-Control": "private, no-store" },
  });
}
