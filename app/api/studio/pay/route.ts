import { isResponse, out, rate, studentJson } from "@/lib/studio/api";
import * as access from "@/lib/studio/access";
import * as pay from "@/lib/studio/pay";

export const dynamic = "force-dynamic";

// Start a Razorpay checkout (act=order) or confirm one the browser says is finished (act=verify).
export async function POST(req: Request) {
  const ctx = await studentJson(req);
  if (isResponse(ctx)) return ctx;
  const limited = rate(ctx.sessionId, "pay", 12);
  if (limited) return limited;
  const { me, input } = ctx;

  if (input.act === "order") {
    try {
      const o = await pay.createOrder(me.id);
      return out({
        ok: true, order_id: o.order_id, amount: o.amount, currency: o.currency, key: o.key,
        name: "GrowQR Resume Studio Pro",
        description: (access.isLifetime() ? "Lifetime, " : `${access.periodDays()} days, `) + "all 45 templates, unlimited updates",
        prefill: { name: me.name, email: me.email },
      });
    } catch (e) {
      if (e instanceof pay.PayError) return out({ ok: false, error: e.message }, 400);
      throw e;
    }
  }
  if (input.act === "verify") {
    const r = await pay.verifyCallback(me.id, String(input.razorpay_order_id ?? ""), String(input.razorpay_payment_id ?? ""), String(input.razorpay_signature ?? ""));
    return out(r, r.ok ? 200 : 400);
  }
  return out({ ok: false, error: "Unknown request." }, 400);
}
