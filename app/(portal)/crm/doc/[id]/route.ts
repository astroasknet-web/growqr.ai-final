import { databaseConfigured } from "@/lib/portal/db";
import { getSession } from "@/lib/portal/session";
import { mfaRequiredFor } from "@/lib/portal/auth";
import * as store from "@/lib/abroad/store";
import * as AC from "@/lib/crm/access";
import * as DC from "@/lib/crm/docs";
import * as LD from "@/lib/crm/leads";

export const dynamic = "force-dynamic";

const plain = (body: string, status: number) => new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });

// Staff download of a lead's document. Needs CRM access and visibility of the lead; every open is audited.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!databaseConfigured()) return plain("Not available.", 503);
  const me = (await getSession())?.user;
  if (!me || !["admin", "counselor"].includes(me.role)) return plain("Please log in.", 401);
  if (mfaRequiredFor(me) && !me.mfa_enabled_at) return plain("Set up two-step login first.", 403);
  if (!(await AC.has(me))) return plain("No CRM access.", 403);
  const { id: raw } = await params;
  const doc = /^\d{1,9}$/.test(raw) ? await DC.find(Number(raw)) : null;
  const lead = doc ? await LD.find(doc.lead_id) : null;
  if (!doc || !lead || !(await LD.canView(me, lead))) return plain("Document not found.", 404);
  const bytes = await DC.bytes(doc);
  if (!bytes) return plain("File is no longer available.", 404);
  await store.audit(me.id, null, "crm.doc.view", `lead #${lead.id} ${doc.doc_type} #${doc.id}`);
  return DC.response(doc, bytes);
}
