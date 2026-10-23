import { createHmac } from "node:crypto";
import Stripe from "stripe";
import { setRazorpayTransport } from "./providers/razorpay";
import { setStripeClient } from "./providers/stripe";

/**
 * Fake provider back-ends for tests. They imitate the parts of the Razorpay and Stripe HTTP APIs that the adapters use, hold their own
 * state, and let a test play the customer ("pay this order") or the provider ("send this webhook"). They make no network calls.
 * They prove our code behaves correctly against the documented API shapes; they are NOT proof of a live provider integration.
 */
type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const RZP_WEBHOOK_SECRET = "whsec_test_razorpay_secret";
export const STRIPE_WEBHOOK_SECRET = "whsec_test_stripe_secret";

export function setTestEnv(): void {
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
  process.env.PAY_RAZORPAY_WEBHOOK_SECRET = RZP_WEBHOOK_SECRET;
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  process.env.STRIPE_WEBHOOK_SECRET = STRIPE_WEBHOOK_SECRET;
  process.env.PAY_ALERT_EMAIL = "payments-team@pay-test.invalid";
  delete process.env.RESEND_API_KEY;
}

export class FakeRazorpay {
  orders = new Map<string, Obj>();
  payments = new Map<string, Obj>();
  refunds = new Map<string, Obj>();
  calls: string[] = [];
  failNext: { path: RegExp; status: number } | null = null;
  private n = 0;
  /** A per-run prefix, so ids never repeat across test runs against the same database. */
  private readonly run = Math.random().toString(36).slice(2, 8);

  install(): void {
    setRazorpayTransport(async (method, path, body) => this.handle(method, path, body));
  }
  uninstall(): void {
    setRazorpayTransport(null);
  }

  private async handle(method: string, path: string, body: Obj | null): Promise<{ status: number; json: Obj }> {
    this.calls.push(`${method} ${path.split("?")[0]}`);
    if (this.failNext && this.failNext.path.test(path)) { const s = this.failNext.status; this.failNext = null; return { status: s, json: { error: { code: "SERVER_ERROR" } } }; }
    let m: RegExpExecArray | null;
    if (method === "POST" && path === "/orders") {
      const id = `order_${this.run}_${++this.n}`;
      const o = { id, amount: body?.amount, currency: body?.currency, receipt: body?.receipt, notes: body?.notes ?? {}, status: "created" };
      this.orders.set(id, o);
      return { status: 200, json: o };
    }
    if ((m = /^\/orders\/([^/]+)\/payments$/.exec(path)) && method === "GET") return { status: 200, json: { items: [...this.payments.values()].filter((p) => p.order_id === m![1]) } };
    if ((m = /^\/orders\/([^/]+)$/.exec(path)) && method === "GET") { const o = this.orders.get(m[1]); return o ? { status: 200, json: o } : { status: 404, json: { error: { code: "BAD_REQUEST_ERROR" } } }; }
    if ((m = /^\/payments\/([^/]+)\/capture$/.exec(path)) && method === "POST") {
      const p = this.payments.get(m[1]);
      if (!p || p.status !== "authorized") return { status: 400, json: { error: { code: "BAD_REQUEST_ERROR" } } };
      p.status = "captured";
      return { status: 200, json: p };
    }
    if ((m = /^\/payments\/([^/]+)\/refunds$/.exec(path)) && method === "GET") return { status: 200, json: { items: [...this.refunds.values()].filter((r) => r.payment_id === m![1]) } };
    if ((m = /^\/payments\/([^/]+)\/refund$/.exec(path)) && method === "POST") {
      const p = this.payments.get(m[1]);
      if (!p) return { status: 400, json: { error: { code: "BAD_REQUEST_ERROR" } } };
      const id = `rfnd_${this.run}_${++this.n}`;
      const r = { id, payment_id: p.id, amount: body?.amount, currency: p.currency, status: "pending", receipt: body?.receipt ?? null, notes: body?.notes ?? {} };
      this.refunds.set(id, r);
      return { status: 200, json: r };
    }
    if ((m = /^\/payments\/([^/]+)$/.exec(path)) && method === "GET") { const p = this.payments.get(m[1]); return p ? { status: 200, json: p } : { status: 404, json: { error: { code: "BAD_REQUEST_ERROR" } } }; }
    if ((m = /^\/refunds\/([^/]+)$/.exec(path)) && method === "GET") { const r = this.refunds.get(m[1]); return r ? { status: 200, json: r } : { status: 404, json: { error: { code: "BAD_REQUEST_ERROR" } } }; }
    if (method === "GET" && path.startsWith("/payments?")) return { status: 200, json: { items: [...this.payments.values()] } };
    return { status: 404, json: { error: { code: "NOT_FOUND" } } };
  }

  /** The customer pays (or fails to pay) a Razorpay order. */
  pay(orderId: string, opts: { status?: "captured" | "authorized" | "failed"; amount?: number; method?: string } = {}): Obj {
    const o = this.orders.get(orderId) as Obj;
    const id = `pay_${this.run}_${++this.n}`;
    const p = { id, order_id: orderId, amount: opts.amount ?? o.amount, currency: o.currency, status: opts.status ?? "captured", method: opts.method ?? "upi", amount_refunded: 0, created_at: Math.floor(Date.now() / 1000), notes: { ...(o.notes ?? {}) }, error_code: opts.status === "failed" ? "BAD_REQUEST_ERROR" : null, error_description: opts.status === "failed" ? "Payment failed at the bank" : null };
    this.payments.set(id, p);
    if (p.status === "captured") o.status = "paid";
    return p;
  }
  processRefund(refundId: string): void {
    const r = this.refunds.get(refundId) as Obj;
    r.status = "processed";
    const p = this.payments.get(r.payment_id) as Obj;
    p.amount_refunded += r.amount;
  }

  /** A signed webhook delivery as Razorpay would send it. */
  webhook(event: string, payload: Obj, id: string): { raw: string; headers: Headers } {
    const raw = JSON.stringify({ entity: "event", event, created_at: Math.floor(Date.now() / 1000), payload });
    return { raw, headers: new Headers({ "x-razorpay-signature": createHmac("sha256", RZP_WEBHOOK_SECRET).update(raw).digest("hex"), "x-razorpay-event-id": id }) };
  }
  paymentEvent(event: string, paymentId: string, id: string): { raw: string; headers: Headers } {
    return this.webhook(event, { payment: { entity: this.payments.get(paymentId) } }, id);
  }
}

export class FakeStripe {
  sessions = new Map<string, Obj>();
  refunds = new Map<string, Obj>();
  charges = new Map<string, Obj>();
  calls: string[] = [];
  refundStatus: "succeeded" | "pending" | "failed" = "succeeded";
  client: Stripe;
  private n = 0;
  private readonly run = Math.random().toString(36).slice(2, 8);

  constructor() {
    this.client = new Stripe("sk_test_fake", { httpClient: Stripe.createFetchHttpClient(((url: string | URL, init?: RequestInit) => this.fetch(String(url), init ?? {})) as typeof fetch), maxNetworkRetries: 0 });
  }
  install(): void { setStripeClient(this.client); }
  uninstall(): void { setStripeClient(null); }

  private json(status: number, body: Obj): Response {
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "request-id": "req_fake" } });
  }

  private async fetch(url: string, init: RequestInit): Promise<Response> {
    const u = new URL(url);
    const method = (init.method ?? "GET").toUpperCase();
    this.calls.push(`${method} ${u.pathname}`);
    const form = new URLSearchParams(typeof init.body === "string" ? init.body : "");
    let m: RegExpExecArray | null;
    if (method === "POST" && u.pathname === "/v1/checkout/sessions") {
      let total = 0;
      for (let i = 0; i < 20; i++) { const amt = form.get(`line_items[${i}][price_data][unit_amount]`); if (amt) total += Number(amt) * Number(form.get(`line_items[${i}][quantity]`) ?? 1); }
      const id = `cs_test_${this.run}_${++this.n}`;
      const s = { id, object: "checkout.session", url: `https://checkout.stripe.test/c/pay/${id}`, amount_total: total, currency: form.get("line_items[0][price_data][currency]"), client_reference_id: form.get("client_reference_id"), metadata: { order_id: form.get("metadata[order_id]") }, payment_status: "unpaid", status: "open", payment_intent: null, created: Math.floor(Date.now() / 1000), customer_email: form.get("customer_email") };
      this.sessions.set(id, s);
      return this.json(200, s);
    }
    if ((m = /^\/v1\/checkout\/sessions\/([^/]+)\/expire$/.exec(u.pathname)) && method === "POST") {
      const s = this.sessions.get(m[1]);
      if (!s || s.status !== "open") return this.json(400, { error: { type: "invalid_request_error", message: "not open" } });
      s.status = "expired";
      return this.json(200, s);
    }
    if ((m = /^\/v1\/checkout\/sessions\/([^/]+)$/.exec(u.pathname)) && method === "GET") {
      const s = this.sessions.get(m[1]);
      return s ? this.json(200, this.expanded(s)) : this.json(404, { error: { type: "invalid_request_error", code: "resource_missing", message: "no such session" } });
    }
    if (method === "GET" && u.pathname === "/v1/checkout/sessions") return this.json(200, { object: "list", data: [...this.sessions.values()].map((s) => this.expanded(s)), has_more: false, url: "/v1/checkout/sessions" });
    if (method === "POST" && u.pathname === "/v1/refunds") {
      const pi = form.get("payment_intent") as string;
      const id = `re_${this.run}_${++this.n}`;
      const r = { id, object: "refund", payment_intent: pi, amount: Number(form.get("amount")), currency: [...this.sessions.values()].find((s) => s.payment_intent_id === pi)?.currency ?? "usd", status: this.refundStatus, metadata: { refund_id: form.get("metadata[refund_id]") } };
      this.refunds.set(id, r);
      if (r.status === "succeeded") this.addRefunded(pi, r.amount);
      return this.json(200, r);
    }
    if (method === "GET" && u.pathname === "/v1/refunds") return this.json(200, { object: "list", data: [...this.refunds.values()].filter((r) => r.payment_intent === u.searchParams.get("payment_intent")), has_more: false, url: "/v1/refunds" });
    if ((m = /^\/v1\/refunds\/([^/]+)$/.exec(u.pathname)) && method === "GET") { const r = this.refunds.get(m[1]); return r ? this.json(200, r) : this.json(404, { error: { type: "invalid_request_error", message: "none" } }); }
    return this.json(404, { error: { type: "invalid_request_error", message: `not handled: ${method} ${u.pathname}` } });
  }

  private addRefunded(pi: string, amount: number): void {
    const c = this.charges.get(pi) ?? { amount_refunded: 0 };
    c.amount_refunded += amount;
    this.charges.set(pi, c);
  }
  private expanded(s: Obj): Obj {
    if (!s.payment_intent_id) return s;
    return { ...s, payment_intent: { id: s.payment_intent_id, object: "payment_intent", metadata: { order_id: s.client_reference_id }, last_payment_error: null, payment_method_types: ["card"], latest_charge: { id: `ch_${s.payment_intent_id}`, object: "charge", amount_refunded: this.charges.get(s.payment_intent_id)?.amount_refunded ?? 0, payment_method_details: { type: "card" } } } };
  }

  /** The customer completes Stripe Checkout. `async` leaves it unpaid (a delayed method); call `settle` later. */
  pay(sessionId: string, opts: { async?: boolean } = {}): string {
    const s = this.sessions.get(sessionId) as Obj;
    const pi = `pi_${this.run}_${++this.n}`;
    s.payment_intent_id = pi;
    s.payment_intent = pi;
    s.status = "complete";
    s.payment_status = opts.async ? "unpaid" : "paid";
    return pi;
  }
  settle(sessionId: string): void { (this.sessions.get(sessionId) as Obj).payment_status = "paid"; }
  expire(sessionId: string): void { (this.sessions.get(sessionId) as Obj).status = "expired"; }

  /** A signed webhook delivery as Stripe would send it. */
  event(type: string, object: Obj, id: string): { raw: string; headers: Headers } {
    const raw = JSON.stringify({ id, object: "event", type, created: Math.floor(Date.now() / 1000), data: { object } });
    return { raw, headers: new Headers({ "stripe-signature": this.client.webhooks.generateTestHeaderString({ payload: raw, secret: STRIPE_WEBHOOK_SECRET }) }) };
  }
  sessionEvent(type: string, sessionId: string, id: string): { raw: string; headers: Headers } {
    return this.event(type, this.sessions.get(sessionId) as Obj, id);
  }
}
