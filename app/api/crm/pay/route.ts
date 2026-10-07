import { out, rate } from "@/lib/studio/api";
import { databaseConfigured, one } from "@/lib/portal/db";
import * as VF from "@/lib/crm/verify";
import * as VP from "@/lib/crm/verify-pay";

export const dynamic = "force-dynamic";

// Razorpay checkout for the student's verification fee. The student is identified by the private file link token, not a login.
export async function POST(req: Request) {
  if (!databaseConfigured()) return out({ ok: false, error: "Not available right now." }, 503);
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return out({ ok: false, error: "Not allowed." }, 403);
  let input: Record<string, unknown> = {};
  try {
    const raw = await req.text();
    if (raw.length > 4096) return out({ ok: false, error: "That is too large." }, 413);
    input = JSON.parse(raw);
  } catch {
    return out({ ok: false, error: "Unknown request." }, 400);
  }
  const tok = String(input.t ?? "");
  const limited = rate(tok.slice(0, 32) || "none", "crmpay", 12);
  if (limited) return limited;
  const lead = /^[a-f0-9]{32}$/.test(tok) ? await one<{ id: number; name: string; email: string; phone: string }>("SELECT id, name, email, phone FROM crm_leads WHERE access_token = $1", [tok]) : null;
  if (!lead) return out({ ok: false, error: "This link is not valid." }, 403);

  if (input.act === "order") {
    const v = await VF.find(Number(input.v) || 0);
    if (!v || v.lead_id !== lead.id) return out({ ok: false, error: "We could not find that verification." }, 404);
    try {
      const o = await VP.createOrder(v.id);
      return out({ ok: true, ...o, name: "GrowQR Document Verification", description: "Third-party verification of your documents", prefill: { name: lead.name, email: lead.email, contact: lead.phone } });
    } catch (e) {
      if (e instanceof VP.VerifyPayError) return out({ ok: false, error: e.message }, 400);
      throw e;
    }
  }
  if (input.act === "verify") {
    const r = await VP.verifyCallback(lead.id, String(input.razorpay_order_id ?? ""), String(input.razorpay_payment_id ?? ""), String(input.razorpay_signature ?? ""));
    return out(r, r.ok ? 200 : 400);
  }
  return out({ ok: false, error: "Unknown request." }, 400);
}
