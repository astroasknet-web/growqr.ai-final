import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { boot, DB, emailOf, mkProduct, mkUser, tag, type Boot } from "./test-setup";

/**
 * The HTTP layer on a real database with fake providers: the route handlers are called with real Request objects. This covers what a
 * browser or an attacker can reach: same-origin checks, ownership, staff permissions, idempotency, CSV safety and webhook signatures.
 */
type SessionUser = { id: number; email: string; role: string; name: string; mfa_enabled_at: string | null } | null;
let current: SessionUser = null;
let rateOk = true;

vi.mock("../portal/session", async (orig) => ({
  ...(await orig<typeof import("../portal/session")>()),
  getSession: async () => (current ? { id: "test-session", user: current, data: {} } : null),
}));
vi.mock("./rate-limit", () => ({ allow: async () => rateOk }));

const ORIGIN = "https://growqr.test";
const ctx = <T extends Record<string, string>>(p: T): { params: Promise<T> } => ({ params: Promise.resolve(p) });
const req = (path: string, init: { method?: string; body?: unknown; headers?: Record<string, string>; origin?: string | null } = {}): Request => {
  const headers: Record<string, string> = { "content-type": "application/json", ...(init.headers ?? {}) };
  if (init.origin !== null) headers.origin = init.origin ?? ORIGIN;
  return new Request(`${ORIGIN}${path}`, { method: init.method ?? "GET", headers, body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body) });
};
const nreq = (path: string, init: Parameters<typeof req>[1] = {}): NextRequest => new NextRequest(req(path, init));
const json = async (r: Response) => (await r.json()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe.skipIf(!DB)("payment HTTP API on a real database", () => {
  let B: Boot;
  let rzp: InstanceType<typeof import("./test-support").FakeRazorpay>;
  let alice = 0, bob = 0, admin = 0, finance = 0, support = 0;
  let sku = "";
  let guestSku = "";
  const as = (id: number, role: string, label: string, mfa = true): void => { current = { id, role, email: emailOf(label), name: label, mfa_enabled_at: mfa ? new Date().toISOString() : null }; };
  const asAlice = () => as(alice, "student", "alice");
  const orderBody = (s: string, email = emailOf("alice"), over: Record<string, unknown> = {}) => ({ items: [{ sku: s, qty: 1 }], country: "IN", billing: { name: "Alice Test", email }, ...over });

  let ORD: typeof import("../../app/api/v1/orders/route");
  let ORD_ID: typeof import("../../app/api/v1/orders/[id]/route");
  let CONFIRM: typeof import("../../app/api/v1/orders/[id]/confirm/route");
  let CANCEL: typeof import("../../app/api/v1/orders/[id]/cancel/route");
  let RECEIPT: typeof import("../../app/api/v1/orders/[id]/receipt/route");
  let QUOTE: typeof import("../../app/api/v1/orders/quote/route");
  let HOOK: typeof import("../../app/api/v1/webhooks/[provider]/route");
  let A_LIST: typeof import("../../app/api/v1/admin/payments/route");
  let A_ONE: typeof import("../../app/api/v1/admin/payments/[id]/route");
  let A_REFUND: typeof import("../../app/api/v1/admin/refunds/route");
  let A_EXPORT: typeof import("../../app/api/v1/admin/export/route");
  let A_STAFF: typeof import("../../app/api/v1/admin/staff/route");
  let A_CAT: typeof import("../../app/api/v1/admin/catalogue/route");
  let A_AUDIT: typeof import("../../app/api/v1/admin/audit/route");
  let CRON: typeof import("../../app/api/cron/payments/route");
  let CFG: typeof import("../../app/api/v1/payments/config/route");

  /** Create an order over HTTP as the current viewer and return the parsed reply. */
  async function place(s = sku, o: { key?: string; email?: string; over?: Record<string, unknown> } = {}) {
    const r = await ORD.POST(req("/api/v1/orders", { method: "POST", body: orderBody(s, o.email, o.over), headers: { "idempotency-key": o.key ?? `k-${tag}-${Math.random().toString(36).slice(2)}` } }));
    return { r, j: await json(r) };
  }
  /** Play the customer paying a Razorpay order, then let the confirm endpoint verify it with the provider. */
  async function payAndConfirm(orderPublicId: string, rzpOrderId: string, token?: string) {
    rzp.pay(rzpOrderId);
    const r = await CONFIRM.POST(req(`/api/v1/orders/${orderPublicId}/confirm${token ? `?k=${token}` : ""}`, { method: "POST", body: {} }), ctx({ id: orderPublicId }));
    return json(r);
  }

  beforeAll(async () => {
    B = await boot();
    rzp = new B.T.FakeRazorpay();
    alice = await mkUser(B.db, "student", "alice");
    bob = await mkUser(B.db, "student", "bob");
    admin = await mkUser(B.db, "admin", "admin");
    finance = await mkUser(B.db, "student", "finance");
    support = await mkUser(B.db, "student", "support");
    await B.db.run("INSERT INTO pay_staff (user_id, role) VALUES ($1,'finance'), ($2,'support')", [finance, support]);
    sku = `t-api-${tag}`;
    guestSku = `t-api-guest-${tag}`;
    await mkProduct(B.db, sku, "plan", "pro", 39900, null, { days: 30 });
    await mkProduct(B.db, guestSku, "plan", "pro", 10000, null, { days: 30, guest: true });
    ORD = await import("../../app/api/v1/orders/route");
    ORD_ID = await import("../../app/api/v1/orders/[id]/route");
    CONFIRM = await import("../../app/api/v1/orders/[id]/confirm/route");
    CANCEL = await import("../../app/api/v1/orders/[id]/cancel/route");
    RECEIPT = await import("../../app/api/v1/orders/[id]/receipt/route");
    QUOTE = await import("../../app/api/v1/orders/quote/route");
    HOOK = await import("../../app/api/v1/webhooks/[provider]/route");
    A_LIST = await import("../../app/api/v1/admin/payments/route");
    A_ONE = await import("../../app/api/v1/admin/payments/[id]/route");
    A_REFUND = await import("../../app/api/v1/admin/refunds/route");
    A_EXPORT = await import("../../app/api/v1/admin/export/route");
    A_STAFF = await import("../../app/api/v1/admin/staff/route");
    A_CAT = await import("../../app/api/v1/admin/catalogue/route");
    A_AUDIT = await import("../../app/api/v1/admin/audit/route");
    CRON = await import("../../app/api/cron/payments/route");
    CFG = await import("../../app/api/v1/payments/config/route");
  });
  beforeEach(() => { B.T.setTestEnv(); rzp.install(); rateOk = true; current = null; });
  afterAll(async () => { rzp.uninstall(); await B.db.closePool(); });

  describe("customer endpoints", () => {
    it("creates an order for a signed-in customer, prices it on the server and hands back a checkout descriptor without secrets", async () => {
      asAlice();
      const { r, j } = await place();
      expect(r.status).toBe(201);
      expect(j.data.order).toMatchObject({ currency: "INR", totalMinor: 39900, status: "pending" });
      expect(j.data.checkout.kind).toBe("razorpay");
      expect(j.data.accessToken).toBeUndefined(); // only guests get a token
      expect(JSON.stringify(j)).not.toContain("rzp_test_secret");
      expect(JSON.stringify(j)).not.toContain("whsec_");
    });

    it("ignores client-supplied prices and totals", async () => {
      asAlice();
      const { j } = await place(sku, { over: { total: 1, price: 1, amount: 1, unitMinor: 1 } });
      expect(j.data.order.totalMinor).toBe(39900);
    });

    it("rejects state-changing requests from another site (CSRF)", async () => {
      asAlice();
      const cross = await ORD.POST(req("/api/v1/orders", { method: "POST", body: orderBody(sku), origin: "https://evil.example", headers: { "idempotency-key": `k-${tag}-csrf1` } }));
      expect(cross.status).toBe(403);
      expect((await json(cross)).error.code).toBe("bad_origin");
      const noOrigin = await ORD.POST(req("/api/v1/orders", { method: "POST", body: orderBody(sku), origin: null, headers: { "sec-fetch-site": "cross-site", "idempotency-key": `k-${tag}-csrf2` } }));
      expect(noOrigin.status).toBe(403);
    });

    it("returns the same order for a repeated Idempotency-Key and refuses the key with a different body", async () => {
      asAlice();
      const key = `k-${tag}-idem`;
      const a = await place(sku, { key });
      const b = await place(sku, { key });
      expect(b.j.data.order.id).toBe(a.j.data.order.id);
      expect(b.j.replayed).toBe(true);
      const c = await ORD.POST(req("/api/v1/orders", { method: "POST", body: orderBody(sku, emailOf("alice"), { coupon: "OTHER" }), headers: { "idempotency-key": key } }));
      expect(c.status).toBe(409);
    });

    it("gives guests a one-time access token and requires it to read the order", async () => {
      current = null;
      const { r, j } = await place(guestSku, { email: `guest-${tag}@pay-test.invalid` });
      expect(r.status).toBe(201);
      const token = j.data.accessToken as string;
      expect(token).toBeTruthy();
      const id = j.data.order.id as string;
      const none = await ORD_ID.GET(req(`/api/v1/orders/${id}`), ctx({ id }));
      expect(none.status).toBe(404);
      const wrong = await ORD_ID.GET(req(`/api/v1/orders/${id}?k=nottherighttoken`), ctx({ id }));
      expect(wrong.status).toBe(404);
      const good = await ORD_ID.GET(req(`/api/v1/orders/${id}?k=${token}`), ctx({ id }));
      expect(good.status).toBe(200);
      // the replayed answer must not leak the token again
      const again = await place(guestSku, { email: `guest-${tag}@pay-test.invalid`, key: "k-" + tag + "-guest-replay" });
      const replay = await place(guestSku, { email: `guest-${tag}@pay-test.invalid`, key: "k-" + tag + "-guest-replay" });
      expect(again.j.data.accessToken).toBeTruthy();
      expect(replay.j.data.accessToken).toBeUndefined();
    });

    it("does not let a signed-in customer buy something that needs an account as a guest", async () => {
      current = null;
      const { r, j } = await place(sku);
      expect(r.status).toBe(401);
      expect(j.error.code).toBe("login_required");
    });

    it("shows an order only to its owner; others get 404 so ids cannot be probed", async () => {
      asAlice();
      const { j } = await place();
      const id = j.data.order.id as string;
      as(bob, "student", "bob");
      for (const call of [
        () => ORD_ID.GET(req(`/api/v1/orders/${id}`), ctx({ id })),
        () => RECEIPT.GET(req(`/api/v1/orders/${id}/receipt`), ctx({ id })),
        () => CANCEL.POST(req(`/api/v1/orders/${id}/cancel`, { method: "POST", body: {} }), ctx({ id })),
        () => CONFIRM.POST(req(`/api/v1/orders/${id}/confirm`, { method: "POST", body: {} }), ctx({ id })),
      ]) expect((await call()).status).toBe(404);
      asAlice();
      expect((await ORD_ID.GET(req(`/api/v1/orders/${id}`), ctx({ id }))).status).toBe(200);
    });

    it("grants access only after the server has verified the payment with the provider", async () => {
      asAlice();
      const { j } = await place();
      const id = j.data.order.id as string;
      // the customer says they paid, but nothing was paid: confirm must not mark it paid
      const early = await json(await CONFIRM.POST(req(`/api/v1/orders/${id}/confirm`, { method: "POST", body: { razorpay_payment_id: "pay_fake", razorpay_signature: "bad" } }), ctx({ id })));
      expect(early.data.order.status).toBe("pending");
      const done = await payAndConfirm(id, j.data.checkout.orderId);
      expect(["paid", "fulfilled"]).toContain(done.data.order.status);
      const doc = await RECEIPT.GET(req(`/api/v1/orders/${id}/receipt`), ctx({ id }));
      expect(doc.status).toBe(200);
      const html = await doc.text();
      expect(html).toContain("Receipt");
      expect(html).toContain("It is not a tax invoice"); // never claimed unless the seller's tax details are configured
      expect(html).not.toContain("<h1>Tax invoice");
      expect(doc.headers.get("content-security-policy")).toBeTruthy();
    });

    it("rate limits order creation", async () => {
      asAlice();
      rateOk = false;
      const { r, j } = await place();
      expect(r.status).toBe(429);
      expect(j.error.code).toBe("rate_limited");
    });

    it("validates input and never echoes internals", async () => {
      asAlice();
      const bad = await ORD.POST(req("/api/v1/orders", { method: "POST", body: { items: [], country: "ZZZ" }, headers: { "idempotency-key": `k-${tag}-bad` } }));
      expect(bad.status).toBe(422);
      const unknown = await place("no-such-sku");
      expect(unknown.r.status).toBe(404);
      const blocked = await ORD.POST(req("/api/v1/orders", { method: "POST", body: orderBody(sku, emailOf("alice"), { country: "KP" }), headers: { "idempotency-key": `k-${tag}-kp` } }));
      expect(blocked.status).toBe(403);
      const broken = await ORD.POST(req("/api/v1/orders", { method: "POST", body: "{not json", headers: { "idempotency-key": `k-${tag}-json` } }));
      expect(broken.status).toBe(422);
      expect(JSON.stringify(await json(bad))).not.toMatch(/SELECT|stack|mysql/i);
    });

    it("quotes a price without creating anything", async () => {
      asAlice();
      const before = Number((await B.db.one<{ n: number }>("SELECT COUNT(*) AS n FROM pay_orders"))?.n);
      const r = await QUOTE.POST(req("/api/v1/orders/quote", { method: "POST", body: { items: [{ sku, qty: 1 }], country: "IN" } }));
      expect(r.status).toBe(200);
      expect((await json(r)).data.totalMinor).toBe(39900);
      expect(Number((await B.db.one<{ n: number }>("SELECT COUNT(*) AS n FROM pay_orders"))?.n)).toBe(before);
    });

    it("tells the checkout page whether payments are on, without revealing keys", async () => {
      const r = await CFG.GET(req("/api/v1/payments/config?country=IN", { origin: null }));
      const j = await json(r);
      expect(j.data.enabled).toBe(true);
      expect(JSON.stringify(j)).not.toMatch(/secret|key_/i);
    });
  });

  describe("webhook endpoint", () => {
    it("rejects a bad signature without changing anything, and accepts a valid one once", async () => {
      asAlice();
      const { j } = await place();
      const id = j.data.order.id as string;
      const p = rzp.pay(j.data.checkout.orderId);
      const good = rzp.paymentEvent("payment.captured", p.id, `evt_${tag}_http1`);
      const forged = await HOOK.POST(new Request(`${ORIGIN}/api/v1/webhooks/razorpay`, { method: "POST", body: good.raw, headers: { "x-razorpay-signature": "0".repeat(64), "x-razorpay-event-id": `evt_${tag}_http1` } }), ctx({ provider: "razorpay" }));
      expect(forged.status).toBeGreaterThanOrEqual(400);
      expect(forged.status).toBeLessThan(500);
      expect((await B.db.one<{ status: string }>("SELECT status FROM pay_orders WHERE public_id = $1", [id]))?.status).toBe("pending");
      const ok1 = await HOOK.POST(new Request(`${ORIGIN}/api/v1/webhooks/razorpay`, { method: "POST", body: good.raw, headers: good.headers }), ctx({ provider: "razorpay" }));
      expect(ok1.status).toBe(200);
      expect(["paid", "fulfilled"]).toContain((await B.db.one<{ status: string }>("SELECT status FROM pay_orders WHERE public_id = $1", [id]))?.status);
      const dup = await HOOK.POST(new Request(`${ORIGIN}/api/v1/webhooks/razorpay`, { method: "POST", body: good.raw, headers: good.headers }), ctx({ provider: "razorpay" }));
      expect(dup.status).toBe(200);
      expect((await json(dup)).duplicate).toBe(true);
      expect(Number((await B.db.one<{ n: number }>("SELECT COUNT(*) AS n FROM pay_entitlements e JOIN pay_orders o ON o.id = e.order_id WHERE o.public_id = $1", [id]))?.n)).toBe(1);
    });

    it("answers unknown providers without side effects", async () => {
      const r = await HOOK.POST(new Request(`${ORIGIN}/api/v1/webhooks/paypal`, { method: "POST", body: "{}" }), ctx({ provider: "paypal" }));
      expect(r.status).toBeGreaterThanOrEqual(400);
      expect(r.status).toBeLessThan(500);
    });
  });

  describe("admin endpoints", () => {
    let paidOrder = "";
    beforeAll(async () => {
      asAlice();
      const { j } = await place();
      paidOrder = j.data.order.id;
      await payAndConfirm(paidOrder, j.data.checkout.orderId);
      await B.db.run("UPDATE pay_orders SET billing_name = $1 WHERE public_id = $2", ["=HYPERLINK(\"http://evil\")", paidOrder]);
    });

    it("requires sign-in, then a payment role", async () => {
      current = null;
      expect((await A_LIST.GET(req("/api/v1/admin/payments", { origin: null }), ctx({}))).status).toBe(401);
      asAlice();
      expect((await A_LIST.GET(req("/api/v1/admin/payments", { origin: null }), ctx({}))).status).toBe(403);
      as(support, "student", "support");
      expect((await A_LIST.GET(req("/api/v1/admin/payments", { origin: null }), ctx({}))).status).toBe(200);
    });

    it("shows the webhook events that belong to an order (provider ids contain underscores)", async () => {
      as(support, "student", "support");
      const row = await B.db.one<{ provider_session_ref: string }>("SELECT p.provider_session_ref FROM pay_payments p JOIN pay_orders o ON o.id = p.order_id WHERE o.public_id = $1", [paidOrder]);
      const sessionRef = row?.provider_session_ref ?? "";
      expect(sessionRef).toContain("_");
      const ev = rzp.webhook("payment.captured", { payment: { entity: { id: "pay_x", order_id: sessionRef, status: "captured" } } }, `evt_${tag}_lookup`);
      await B.db.run("INSERT INTO pay_webhook_events (provider, event_id, type, status, payload, received_at) VALUES ('razorpay', $1, 'payment.captured', 'processed', $2, UTC_TIMESTAMP())", [`evt_${tag}_lookup`, JSON.stringify({ sessionRef })]);
      void ev;
      const d = await json(await A_ONE.GET(req(`/api/v1/admin/payments/${paidOrder}`, { origin: null }), ctx({ id: paidOrder })));
      expect(JSON.stringify(d.data.webhooks)).toContain(`evt_${tag}_lookup`);
    });

    it("lets support view but not refund, export or change prices", async () => {
      as(support, "student", "support");
      expect((await A_ONE.GET(req(`/api/v1/admin/payments/${paidOrder}`, { origin: null }), ctx({ id: paidOrder }))).status).toBe(200);
      const refund = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body: { orderId: paidOrder, reason: "test", confirm: true }, headers: { "idempotency-key": `rf-${tag}-sup` } }), ctx({}));
      expect(refund.status).toBe(403);
      expect((await A_EXPORT.GET(req("/api/v1/admin/export", { origin: null }), ctx({}))).status).toBe(403);
      as(finance, "student", "finance");
      const price = await A_CAT.POST(req("/api/v1/admin/catalogue", { method: "POST", body: { action: "set_price", sku, currency: "INR", amountMinor: 1 } }), ctx({}));
      expect(price.status).toBe(403);
      expect((await A_STAFF.GET(req("/api/v1/admin/staff", { origin: null }), ctx({}))).status).toBe(403);
    });

    it("blocks staff without two-step login", async () => {
      as(admin, "admin", "admin", false);
      const prev = process.env.PORTAL_MFA_REQUIRE_STAFF;
      delete process.env.PORTAL_MFA_REQUIRE_STAFF;
      try {
        const r = await A_LIST.GET(req("/api/v1/admin/payments", { origin: null }), ctx({}));
        expect(r.status).toBe(403);
        expect((await json(r)).error.code).toBe("mfa_required");
      } finally { if (prev !== undefined) process.env.PORTAL_MFA_REQUIRE_STAFF = prev; }
    });

    it("requires explicit confirmation and an Idempotency-Key for refunds, and a same-origin request", async () => {
      as(finance, "student", "finance");
      const noKey = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body: { orderId: paidOrder, reason: "test refund", confirm: true } }), ctx({}));
      expect(noKey.status).toBe(400);
      const noConfirm = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body: { orderId: paidOrder, reason: "test refund" }, headers: { "idempotency-key": `rf-${tag}-nc` } }), ctx({}));
      expect(noConfirm.status).toBe(422);
      const cross = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body: { orderId: paidOrder, reason: "test refund", confirm: true }, origin: "https://evil.example", headers: { "idempotency-key": `rf-${tag}-x` } }), ctx({}));
      expect(cross.status).toBe(403);
    });

    it("refunds once even when the request is repeated, and writes it to the audit log", async () => {
      as(finance, "student", "finance");
      const key = `rf-${tag}-full-1`;
      const body = { orderId: paidOrder, reason: "customer asked", confirm: true, amountMinor: 10000 };
      const a = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body, headers: { "idempotency-key": key } }), ctx({}));
      const b = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body, headers: { "idempotency-key": key } }), ctx({}));
      expect([200, 202]).toContain(a.status);
      expect((await json(a)).data.id).toBe((await json(b)).data.id);
      expect(Number((await B.db.one<{ n: number }>("SELECT COUNT(*) AS n FROM pay_refunds r JOIN pay_orders o ON o.id = r.order_id WHERE o.public_id = $1", [paidOrder]))?.n)).toBe(1);
      const tooMuch = await A_REFUND.POST(req("/api/v1/admin/refunds", { method: "POST", body: { ...body, amountMinor: 39900 }, headers: { "idempotency-key": `rf-${tag}-over` } }), ctx({}));
      expect(tooMuch.status).toBeGreaterThanOrEqual(400);
      const audit = await json(await A_AUDIT.GET(req("/api/v1/admin/audit?entity=refund", { origin: null }), ctx({})));
      expect(JSON.stringify(audit)).toMatch(/refund.(requested|succeeded|pending)/);
    });

    it("neutralises spreadsheet formulas in the CSV export and logs the export", async () => {
      as(finance, "student", "finance");
      const r = await A_EXPORT.GET(req("/api/v1/admin/export?q=" + encodeURIComponent(paidOrder), { origin: null }), ctx({}));
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toContain("text/csv");
      const csv = await r.text();
      expect(csv).toContain(paidOrder);
      expect(csv).not.toMatch(/(^|,)"?=HYPERLINK/);
      expect(csv).toContain("'=HYPERLINK");
    });

    it("does not let anyone change their own payment role, and only admins change roles", async () => {
      as(admin, "admin", "admin");
      const self = await A_STAFF.POST(req("/api/v1/admin/staff", { method: "POST", body: { userId: admin, role: "support" } }), ctx({}));
      expect(self.status).toBe(403);
      const ok1 = await A_STAFF.POST(req("/api/v1/admin/staff", { method: "POST", body: { userId: bob, role: "support" } }), ctx({}));
      expect(ok1.status).toBe(200);
      const list = await json(await A_STAFF.GET(req("/api/v1/admin/staff", { origin: null }), ctx({})));
      expect(JSON.stringify(list)).toContain(emailOf("bob"));
      await A_STAFF.POST(req("/api/v1/admin/staff", { method: "POST", body: { userId: bob, role: null } }), ctx({}));
    });

    it("keeps the audit chain valid after all of the above", async () => {
      as(admin, "admin", "admin");
      const j = await json(await A_AUDIT.GET(req("/api/v1/admin/audit?verify=1", { origin: null }), ctx({})));
      expect(JSON.stringify(j)).toContain("\"brokenAt\":null");
    });
  });

  describe("cron endpoint", () => {
    it("refuses callers without the secret and runs for the right one", async () => {
      process.env.CRON_SECRET = "cron-secret-for-tests";
      const none = await CRON.GET(nreq("/api/cron/payments", { origin: null }));
      expect(none.status).toBe(401);
      const wrong = await CRON.GET(nreq("/api/cron/payments", { origin: null, headers: { authorization: "Bearer nope" } }));
      expect(wrong.status).toBe(401);
      const good = await CRON.GET(nreq("/api/cron/payments", { origin: null, headers: { authorization: "Bearer cron-secret-for-tests" } }));
      expect(good.status).toBe(200);
    });
  });
});
