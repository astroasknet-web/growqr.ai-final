import { NextResponse } from "next/server";
import * as pay from "@/lib/studio/pay";
import { webhook as crmWebhook } from "@/lib/crm/verify-pay";

// Orders that are not Resume Studio orders may be CRM verification fees: they share this one Razorpay webhook.
pay.setUnknownOrderHandler(crmWebhook);

export const dynamic = "force-dynamic";

// Razorpay -> us. No login: trust comes only from the HMAC signature over the raw body.
export async function POST(req: Request) {
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 200000) return NextResponse.json({ ok: false }, { status: 413 });
  const r = await pay.webhook(raw, req.headers.get("x-razorpay-signature") ?? "");
  return NextResponse.json({ ok: r.status === 200, message: r.message }, { status: r.status });
}
