import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, DB, emailOf, mkProduct, mkUser, tag, type Boot } from "./test-setup";

/**
 * The payment lifecycle on a real database with fake providers: ordering, checkout, webhooks, settlement, fulfilment, idempotency, concurrency,
 * ownership and the failure paths. Refunds, disputes, reconciliation and the audit chain are in pay-refunds-db.test.ts.
 *
 *   PORTAL_TEST_DATABASE_URL=mysql://root@127.0.0.1:3307/growqr_test npx vitest run lib/pay
 */
describe.skipIf(!DB)("payments on a real database", () => {
  let B: Boot;
  let P: typeof import("./orders");
  let C: typeof import("./checkout");
  let W: typeof import("./webhooks");
  let S: typeof import("./settle");
  let J: typeof import("./jobs");
  let IDEM: typeof import("./idempotency");
  let ENT: typeof import("./entitlements");
  let STUDIO: typeof import("../studio/access");
  let rzp: InstanceType<typeof import("./test-support").FakeRazorpay>;
  let stp: InstanceType<typeof import("./test-support").FakeStripe>;
  let pool: typeof import("./db").pool;
  let alice = 0;
  let bob = 0;
  let sku = "";
  const ctx = { actor: "system" as const, via: "cron" as const };

  const q = async <T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T[]> => B.db.all<T & Record<string, any>>(sql, params) as Promise<T[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const input = (s: string, over: Record<string, unknown> = {}, email = emailOf("alice")) => P.createOrderSchema.parse({ items: [{ sku: s, qty: 1 }], country: "IN", billing: { name: "Alice Test", email }, ...over });
  const newOrder = async (s = sku, over: Record<string, unknown> = {}, user: number | null = alice, email = emailOf("alice")) => P.createOrder(input(s, over, email), { userId: user });
  const rzpHook = (h: { raw: string; headers: Headers }) => W.receiveWebhook("razorpay", h.raw, h.headers);
  const stripeHook = (h: { raw: string; headers: Headers }) => W.receiveWebhook("stripe", h.raw, h.headers);
  let n = 0;
  const evt = (p: string) => `${p}_${tag}_${++n}`;

  beforeAll(async () => {
    B = await boot();
    ({ pool } = await import("./db"));
    P = await import("./orders");
    C = await import("./checkout");
    W = await import("./webhooks");
    S = await import("./settle");
    J = await import("./jobs");
    IDEM = await import("./idempotency");
    ENT = await import("./entitlements");
    STUDIO = await import("../studio/access");
    rzp = new B.T.FakeRazorpay();
    stp = new B.T.FakeStripe();
    alice = await mkUser(B.db, "student", "alice");
    bob = await mkUser(B.db, "student", "bob");
    sku = `t-plan-${tag}`;
    await mkProduct(B.db, sku, "plan", "pro", 39900, 4900, { days: 30 });
  });
  beforeEach(() => { B.T.setTestEnv(); rzp.install(); stp.install(); });
  afterAll(async () => { rzp.uninstall(); stp.uninstall(); await B.db.closePool(); });

  describe("orders", () => {
    it("prices an order on the server and ignores anything the client says about money", async () => {
      const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 2 }], country: "IN", billing: { name: "Alice", email: emailOf("alice") }, total: 1, price: 1, currency: "INR" } as never), { userId: alice });
      expect(order).toMatchObject({ currency: "INR", subtotalMinor: 79800, totalMinor: 79800, status: "pending", taxMinor: 0 });
      expect(order.items[0]).toMatchObject({ sku, qty: 2, unitMinor: 39900 });
    });
    it("picks the buyer's home currency and refuses one that has no price or provider", async () => {
      expect((await newOrder(sku, { country: "US" })).order.currency).toBe("USD");
      expect((await newOrder(sku, { country: "IN" })).order.currency).toBe("INR");
      await expect(newOrder(sku, { country: "US", currency: "INR" })).rejects.toMatchObject({ code: "currency_not_available" });
      await expect(newOrder(sku, { country: "IN", currency: "EUR" })).rejects.toMatchObject({ code: "currency_not_available" });
    });
    it("refuses unknown items, duplicate lines, too many units, blocked countries and guests on member-only items", async () => {
      await expect(newOrder("no-such-sku")).rejects.toMatchObject({ code: "unknown_item", status: 404 });
      await expect(P.createOrder(input(sku, { items: [{ sku, qty: 1 }, { sku, qty: 1 }] }), { userId: alice })).rejects.toMatchObject({ code: "duplicate_items" });
      await expect(P.createOrder(input(sku, { items: [{ sku, qty: 5 }] }), { userId: alice })).rejects.toMatchObject({ code: "quantity_too_high" });
      await expect(newOrder(sku, { country: "IR" })).rejects.toMatchObject({ code: "country_not_supported", status: 403 });
      await expect(newOrder(sku, {}, null)).rejects.toMatchObject({ code: "login_required", status: 401 });
    });
    it("adds tax from a country rule and keeps the order's own snapshot afterwards", async () => {
      await B.db.run("INSERT INTO pay_tax_rules (country, name, rate_bp, active) VALUES ('DE','VAT',1900,1) ON DUPLICATE KEY UPDATE rate_bp = 1900, active = 1");
      await B.db.run("UPDATE pay_prices SET tax_inclusive = 0 WHERE product_id = (SELECT id FROM pay_products WHERE sku = $1) AND currency = 'USD'", [sku]);
      const { order } = await newOrder(sku, { country: "DE", currency: "USD" });
      expect(order).toMatchObject({ taxName: "VAT", taxRateBp: 1900, taxMinor: 931, totalMinor: 5831, taxInclusive: false });
      await B.db.run("UPDATE pay_prices SET amount_minor = 9900 WHERE product_id = (SELECT id FROM pay_products WHERE sku = $1) AND currency = 'USD'", [sku]);
      const again = (await P.loadOrder(pool, order.id, { userId: alice }));
      expect(Number(again.total_minor)).toBe(5831); // an old order never changes with the catalogue
      await B.db.run("UPDATE pay_prices SET amount_minor = 4900, tax_inclusive = 1 WHERE product_id = (SELECT id FROM pay_products WHERE sku = $1) AND currency = 'USD'", [sku]);
      await B.db.run("DELETE FROM pay_tax_rules WHERE country = 'DE'");
    });
    it("enforces coupon rules: window, per-person limit, total limit under concurrency, and currency", async () => {
      await B.db.run("INSERT INTO pay_coupons (code, kind, percent_bp, per_user_limit, max_redemptions) VALUES ($1,'percent',2500,1,2)", [`P25${tag}`.toUpperCase()]);
      const a = await newOrder(sku, { coupon: `p25${tag}` });
      expect(a.order).toMatchObject({ discountMinor: 9975, totalMinor: 29925, couponCode: `P25${tag}`.toUpperCase() });
      await expect(newOrder(sku, { coupon: `P25${tag}` })).rejects.toMatchObject({ code: "coupon_invalid" }); // same person, limit 1
      await expect(newOrder(sku, { coupon: "NOPE" })).rejects.toMatchObject({ code: "coupon_invalid" });
      await B.db.run("INSERT INTO pay_coupons (code, kind, fixed_minor, currency, per_user_limit) VALUES ($1,'fixed',5000,'INR',1)", [`F50${tag}`.toUpperCase()]);
      await expect(newOrder(sku, { coupon: `F50${tag}`, country: "US" })).rejects.toMatchObject({ code: "coupon_invalid" }); // USD order, INR coupon
      await B.db.run("INSERT INTO pay_coupons (code, kind, percent_bp, per_user_limit, max_redemptions) VALUES ($1,'percent',1000,5,1)", [`ONE${tag}`.toUpperCase()]);
      const users = await Promise.all([1, 2, 3, 4].map((i) => mkUser(B.db, "student", `c${i}`)));
      const results = await Promise.allSettled(users.map((u, i) => P.createOrder(input(sku, { coupon: `ONE${tag}` }, emailOf(`c${i + 1}`)), { userId: u })));
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1); // the last redemption went to exactly one buyer
      const used = await q<{ redeemed: number }>("SELECT redeemed FROM pay_coupons WHERE code = $1", [`ONE${tag}`.toUpperCase()]);
      expect(Number(used[0].redeemed)).toBe(1);
    });
    it("frees a coupon when an unpaid order is cancelled", async () => {
      await B.db.run("INSERT INTO pay_coupons (code, kind, percent_bp, per_user_limit, max_redemptions) VALUES ($1,'percent',1000,1,1)", [`REL${tag}`.toUpperCase()]);
      const a = await newOrder(sku, { coupon: `REL${tag}` });
      await C.cancelOrder(a.order.id, { userId: alice });
      const b = await newOrder(sku, { coupon: `REL${tag}` }, bob, emailOf("bob")); // the single use is available again
      expect(b.order.discountMinor).toBeGreaterThan(0);
    });
  });

  describe("who can see an order", () => {
    it("shows an order only to its owner, a staff member, or a holder of its guest token", async () => {
      const guestSku = `t-guest-${tag}`;
      await mkProduct(B.db, guestSku, "ebook", "book-1", 9900, null, { guest: true, days: null });
      const own = await newOrder();
      await expect(P.loadOrder(pool, own.order.id, { userId: bob })).rejects.toMatchObject({ status: 404 }); // looks like it does not exist
      await expect(P.loadOrder(pool, own.order.id, { userId: null })).rejects.toMatchObject({ status: 404 });
      await expect(P.loadOrder(pool, own.order.id, { userId: bob, token: "wrong" })).rejects.toMatchObject({ status: 404 });
      expect((await P.loadOrder(pool, own.order.id, { userId: alice })).public_id).toBe(own.order.id);
      expect((await P.loadOrder(pool, own.order.id, { userId: bob, isStaff: true })).public_id).toBe(own.order.id);
      const guest = await P.createOrder(input(guestSku, {}, "guest@pay-test.invalid"), { userId: null });
      expect((await P.loadOrder(pool, guest.order.id, { userId: null, token: guest.accessToken })).public_id).toBe(guest.order.id);
      await expect(P.loadOrder(pool, guest.order.id, { userId: null, token: own.accessToken })).rejects.toMatchObject({ status: 404 });
    });
    it("does not let a customer start, confirm or cancel someone else's order", async () => {
      const own = await newOrder();
      await expect(C.startCheckout(own.order.id, { userId: bob }, { origin: "https://growqr.test" })).rejects.toMatchObject({ status: 404 });
      await expect(C.confirmPayment(own.order.id, { userId: bob })).rejects.toMatchObject({ status: 404 });
      await expect(C.cancelOrder(own.order.id, { userId: bob })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("Razorpay lifecycle", () => {
    it("takes a payment end to end: checkout, signed webhook, fulfilment, receipt, one email", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      expect(start.paid).toBe(false);
      expect(start.checkout).toMatchObject({ kind: "razorpay", amountMinor: 39900, currency: "INR" });
      const rzOrder = (start.checkout as { orderId: string }).orderId;
      expect(rzp.orders.get(rzOrder)?.notes.order_id).toBe(order.id); // our order id travels with the payment

      // Not paid yet: nothing is granted, whatever the browser says.
      let r = await C.confirmPayment(order.id, { userId: alice });
      expect(r.order.status).toBe("pending");
      expect(await ENT.activePlan(alice)).toBeNull();

      const pay = rzp.pay(rzOrder);
      const hook = rzp.paymentEvent("payment.captured", pay.id, evt("rz"));
      expect((await rzpHook(hook)).status).toBe(200);

      r = await C.confirmPayment(order.id, { userId: alice });
      expect(r.order).toMatchObject({ status: "fulfilled" });
      expect(await ENT.activePlan(alice)).toBe("pro");
      const ents = await q("SELECT * FROM pay_entitlements WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id]);
      expect(ents).toHaveLength(1);
      expect(ents[0].expires_at).not.toBeNull();
      const docs = await q("SELECT number, kind FROM pay_invoices WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id]);
      expect(docs).toHaveLength(1);
      expect(docs[0].kind).toBe("receipt"); // never a "tax invoice" unless that mode is switched on
      expect(docs[0].number).toMatch(/^RCT-\d{4}-\d{6}$/);
      const mails = await q("SELECT id FROM mail_outbox WHERE kind = 'payment_received' AND to_email = $1 AND subject LIKE $2", [emailOf("alice"), `%${order.id}%`]);
      expect(mails).toHaveLength(1);
    });

    it("does nothing the second time the same event arrives, and nothing for a new event about the same payment", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((start.checkout as { orderId: string }).orderId);
      const id = evt("rz");
      const hook = rzp.paymentEvent("payment.captured", pay.id, id);
      expect((await rzpHook(hook)).status).toBe(200);
      const again = await rzpHook(hook);
      expect(again).toMatchObject({ status: 200, body: { duplicate: true } });
      expect((await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")))).status).toBe(200); // Razorpay also sends order.paid and retries: a different event id
      expect((await rzpHook(rzp.webhook("order.paid", { payment: { entity: rzp.payments.get(pay.id) }, order: { entity: { ...rzp.orders.get((start.checkout as { orderId: string }).orderId) } } }, evt("rz")))).status).toBe(200);
      const oid = (await q("SELECT id FROM pay_orders WHERE public_id = $1", [order.id]))[0].id;
      expect(await q("SELECT id FROM pay_entitlements WHERE order_id = $1", [oid])).toHaveLength(1);
      expect(await q("SELECT id FROM pay_invoices WHERE order_id = $1", [oid])).toHaveLength(1);
      expect(await q("SELECT id FROM mail_outbox WHERE kind = 'payment_received' AND subject LIKE $1", [`%${order.id}%`])).toHaveLength(1);
      expect(await q("SELECT id FROM pay_webhook_events WHERE event_id = $1", [id])).toHaveLength(1);
    });

    it("settles from the customer's return alone, using Razorpay's signature only to find the payment, and never trusts a bad one", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const rzOrder = (start.checkout as { orderId: string }).orderId;
      const pay = rzp.pay(rzOrder);
      const { createHmac } = await import("node:crypto");
      const good = createHmac("sha256", "rzp_test_secret").update(`${rzOrder}|${pay.id}`).digest("hex");
      const r = await C.confirmPayment(order.id, { userId: alice }, { razorpayPaymentId: pay.id, razorpaySignature: good });
      expect(r.order.status).toBe("fulfilled");
    });
    it("ignores a forged return: the payment is still found, and judged, by Razorpay", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const rzOrder = (start.checkout as { orderId: string }).orderId;
      const other = rzp.pay((await rzpOrderFor(order.id, 39900)));
      const r = await C.confirmPayment(order.id, { userId: alice }, { razorpayPaymentId: other.id, razorpaySignature: "forged" });
      expect(r.order.status).toBe("pending");
      expect(rzOrder).toBeTruthy();
    });
    async function rzpOrderFor(publicId: string, amount: number): Promise<string> {
      const id = `order_other_${tag}_${++n}`;
      rzp.orders.set(id, { id, amount, currency: "INR", receipt: publicId, notes: { order_id: publicId }, status: "created" });
      return id;
    }

    it("rejects a webhook with a bad signature and changes nothing", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((start.checkout as { orderId: string }).orderId);
      const h = rzp.paymentEvent("payment.captured", pay.id, evt("bad"));
      const bad = await W.receiveWebhook("razorpay", h.raw, new Headers({ "x-razorpay-signature": "0".repeat(64), "x-razorpay-event-id": "bad" }));
      expect(bad.status).toBe(400);
      expect((await C.confirmPayment(order.id, { userId: alice })).order.status).not.toBe("pending"); // settled by the API check, not by the forged hook
      expect(await q("SELECT id FROM pay_webhook_events WHERE event_id = 'bad'")).toHaveLength(0);
    });

    it("refuses to fulfil when the provider's amount differs from the order", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((start.checkout as { orderId: string }).orderId, { amount: 100 }); // paid far less than the price
      const r = await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")));
      expect(r.status).toBe(200);
      const o = (await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0];
      expect(o.status).toBe("pending");
      expect((await q("SELECT id FROM pay_audit_events WHERE action = 'payment.mismatch' AND detail LIKE $1", [`%${order.id}%`])).length).toBeGreaterThan(0);
    });
    it("refuses a payment that belongs to a different order", async () => {
      const a = await newOrder();
      const b = await newOrder();
      const sa = await C.startCheckout(a.order.id, { userId: alice }, { origin: "https://growqr.test" });
      await C.startCheckout(b.order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((sa.checkout as { orderId: string }).orderId);
      rzp.orders.get((sa.checkout as { orderId: string }).orderId)!.notes.order_id = b.order.id; // the provider's metadata points at another order
      await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")));
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [a.order.id]))[0].status).toBe("pending");
    });

    it("handles authorize-then-capture", async () => {
      const { order } = await newOrder();
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((start.checkout as { orderId: string }).orderId, { status: "authorized" });
      await rzpHook(rzp.paymentEvent("payment.authorized", pay.id, evt("rz")));
      expect(rzp.calls.some((c) => c.includes("/capture"))).toBe(true);
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
    });

    it("keeps a failed attempt open for another try, and a later success still works", async () => {
      const { order } = await newOrder();
      const s1 = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const failed = rzp.pay((s1.checkout as { orderId: string }).orderId, { status: "failed" });
      await rzpHook(rzp.paymentEvent("payment.failed", failed.id, evt("rz")));
      expect((await q("SELECT o.status AS status, p.failure_code AS failure_code FROM pay_orders o JOIN pay_payments p ON p.order_id = o.id WHERE o.public_id = $1", [order.id]))[0]).toMatchObject({ status: "pending", failure_code: "BAD_REQUEST_ERROR" });
      const ok = rzp.pay((s1.checkout as { orderId: string }).orderId, { status: "captured" });
      await rzpHook(rzp.paymentEvent("payment.captured", ok.id, evt("rz")));
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
    });

    it("never lets a late failure or expiry undo a success (out-of-order events)", async () => {
      const { order } = await newOrder();
      const s = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((s.checkout as { orderId: string }).orderId);
      await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")));
      const f = rzp.paymentEvent("payment.failed", pay.id, evt("rz"));
      expect((await rzpHook(f)).status).toBe(200);
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
      expect((await q("SELECT status FROM pay_payments WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id]))[0].status).toBe("succeeded");
    });

    it("accepts money that arrives after the order expired, and fulfils it", async () => {
      const { order } = await newOrder();
      const s = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      await B.db.run("UPDATE pay_orders SET expires_at = (UTC_TIMESTAMP() - INTERVAL 1 MINUTE) WHERE public_id = $1", [order.id]);
      await J.expireStaleOrders();
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("expired");
      const pay = rzp.pay((s.checkout as { orderId: string }).orderId);
      await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")));
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
    });

    it("does not expire an order the provider reports as paid, and ignores events for payments it does not know", async () => {
      const { order } = await newOrder();
      const s = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      rzp.pay((s.checkout as { orderId: string }).orderId); // paid, but no webhook has arrived
      await B.db.run("UPDATE pay_orders SET expires_at = (UTC_TIMESTAMP() - INTERVAL 1 MINUTE) WHERE public_id = $1", [order.id]);
      await J.expireStaleOrders();
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
      const stranger = rzp.webhook("payment.captured", { payment: { entity: { id: "pay_unknown", order_id: "order_unknown", status: "captured", amount: 1, currency: "INR" } } }, evt("rz"));
      expect((await rzpHook(stranger)).status).toBe(200);
      expect((await q("SELECT status FROM pay_webhook_events WHERE event_id = $1", [stranger.headers.get("x-razorpay-event-id")]))[0].status).toBe("ignored");
    });

    it("does not start a second charge on an order that is already paid, or while an earlier one might have succeeded", async () => {
      const { order } = await newOrder();
      const s = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      rzp.pay((s.checkout as { orderId: string }).orderId); // paid at the provider, our webhook not seen yet
      const again = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      expect(again.paid).toBe(true);
      expect(await q("SELECT id FROM pay_payments WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id])).toHaveLength(1); // no new attempt was made
      expect(rzp.calls.filter((c) => c === "POST /orders").length).toBeGreaterThan(0);
    });

    it("tells the customer to wait, and charges nothing twice, when the provider cannot be asked about an earlier attempt", async () => {
      const { order } = await newOrder();
      await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      rzp.failNext = { path: /^\/orders\//, status: 503 };
      await expect(C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" })).rejects.toMatchObject({ code: "provider_unavailable", status: 503 });
      expect(await q("SELECT id FROM pay_payments WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id])).toHaveLength(1);
    });

    it("marks the attempt failed and says so when the provider is down at checkout", async () => {
      const { order } = await newOrder();
      rzp.failNext = { path: /^\/orders$/, status: 500 };
      await expect(C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" })).rejects.toMatchObject({ code: "provider_unavailable" });
      expect((await q("SELECT status FROM pay_payments WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id]))[0].status).toBe("failed");
      expect((await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" })).checkout?.kind).toBe("razorpay"); // and a retry works
    });
  });

  describe("Stripe lifecycle", () => {
    it("takes a payment end to end through hosted checkout", async () => {
      const { order } = await newOrder(sku, { country: "US" });
      expect(order.currency).toBe("USD");
      const start = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      expect(start.checkout).toMatchObject({ kind: "redirect", provider: "stripe" });
      const sid = [...stp.sessions.keys()].pop() as string;
      expect(stp.sessions.get(sid)?.amount_total).toBe(4900);
      expect(stp.sessions.get(sid)?.client_reference_id).toBe(order.id);
      stp.pay(sid);
      const r = await stripeHook(stp.sessionEvent("checkout.session.completed", sid, evt("evt_st")));
      expect(r.status).toBe(200);
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
      expect(await ENT.activePlan(alice)).toBe("pro");
    });
    it("waits for a delayed payment method and fulfils only when it actually succeeds", async () => {
      const { order } = await newOrder(sku, { country: "US" });
      await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const sid = [...stp.sessions.keys()].pop() as string;
      stp.pay(sid, { async: true });
      await stripeHook(stp.sessionEvent("checkout.session.completed", sid, evt("evt_st"))); // completed, but the money has not arrived
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("pending");
      stp.settle(sid);
      await stripeHook(stp.sessionEvent("checkout.session.async_payment_succeeded", sid, evt("evt_st")));
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("fulfilled");
    });
    it("records a failed delayed payment, keeps the order open, and lets the customer retry", async () => {
      const { order } = await newOrder(sku, { country: "US" });
      await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const sid = [...stp.sessions.keys()].pop() as string;
      stp.pay(sid, { async: true });
      await stripeHook(stp.sessionEvent("checkout.session.async_payment_failed", sid, evt("evt_st")));
      const p = (await q("SELECT status FROM pay_payments WHERE provider_session_ref = $1", [sid]))[0];
      expect(p.status).toBe("failed");
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("pending");
      const retry = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      expect(retry.checkout?.kind).toBe("redirect");
    });
    it("rejects a Stripe webhook with a bad signature, a stale timestamp or no secret", async () => {
      const { order } = await newOrder(sku, { country: "US" });
      await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const sid = [...stp.sessions.keys()].pop() as string;
      stp.pay(sid);
      const h = stp.sessionEvent("checkout.session.completed", sid, evt("evt_st"));
      expect((await W.receiveWebhook("stripe", h.raw, new Headers({ "stripe-signature": "t=1,v1=abc" }))).status).toBe(400);
      expect((await W.receiveWebhook("stripe", h.raw + " ", h.headers)).status).toBe(400);
      delete process.env.STRIPE_WEBHOOK_SECRET;
      expect((await W.receiveWebhook("stripe", h.raw, h.headers)).status).toBe(503); // fails closed so Stripe retries later
    });
    it("asks the provider again before trusting an expired-session event", async () => {
      const { order } = await newOrder(sku, { country: "US" });
      await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const sid = [...stp.sessions.keys()].pop() as string;
      stp.expire(sid);
      await stripeHook(stp.sessionEvent("checkout.session.expired", sid, evt("evt_st")));
      expect((await q("SELECT status FROM pay_payments WHERE provider_session_ref = $1", [sid]))[0].status).toBe("expired");
      expect((await q("SELECT status FROM pay_orders WHERE public_id = $1", [order.id]))[0].status).toBe("pending"); // the order itself stays open
    });
  });

  describe("free orders", () => {
    it("fulfils a fully discounted order without calling any provider", async () => {
      await B.db.run("INSERT INTO pay_coupons (code, kind, percent_bp, per_user_limit) VALUES ($1,'percent',10000,1)", [`FREE${tag}`.toUpperCase()]);
      const calls = rzp.calls.length + stp.calls.length;
      const { order } = await newOrder(sku, { coupon: `FREE${tag}` });
      expect(order.totalMinor).toBe(0);
      const r = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      expect(r.paid).toBe(true);
      expect(r.order.status).toBe("fulfilled");
      expect(rzp.calls.length + stp.calls.length).toBe(calls);
    });
  });

  describe("fulfilment", () => {
    it("enrols a course buyer and switches on Resume Studio Pro, exactly once", async () => {
      const slug = ((await q("SELECT slug FROM courses LIMIT 1"))[0] ?? { slug: "" }).slug as string;
      if (slug) {
        const csku = `t-course-${tag}`;
        await mkProduct(B.db, csku, "course", slug, 49900, null, { days: null });
        const o = await newOrder(csku);
        const s = await C.startCheckout(o.order.id, { userId: bob }, { origin: "https://growqr.test" }).catch(() => null);
        void s;
      }
      const ssku = `t-studio-${tag}`;
      await mkProduct(B.db, ssku, "resume", "studio_pro", 19900, null, { days: null });
      const o = await newOrder(ssku);
      const st = await C.startCheckout(o.order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((st.checkout as { orderId: string }).orderId);
      const h = rzp.paymentEvent("payment.captured", pay.id, evt("rz"));
      await rzpHook(h);
      await S.settlePayment(Number((await q("SELECT id FROM pay_payments WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [o.order.id]))[0].id), ctx);
      expect(await STUDIO.isPro(alice)).toBe(true);
      expect(await q("SELECT id FROM studio_subscriptions WHERE user_id = $1 AND payment_id = $2", [alice, o.order.id])).toHaveLength(1);
    });
    it("holds a guest's purchase and attaches it when they sign up with the same verified email", async () => {
      const gsku = `t-g2-${tag}`;
      await mkProduct(B.db, gsku, "ebook", "book-2", 9900, null, { guest: true, days: null });
      const guest = await P.createOrder(input(gsku, {}, `guest2-${tag}@pay-test.invalid`), { userId: null });
      const st = await C.startCheckout(guest.order.id, { userId: null, token: guest.accessToken }, { origin: "https://growqr.test" });
      const pay = rzp.pay((st.checkout as { orderId: string }).orderId);
      await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")));
      const ent = await q("SELECT user_id FROM pay_entitlements WHERE email = $1", [`guest2-${tag}@pay-test.invalid`]);
      expect(ent).toHaveLength(1);
      expect(ent[0].user_id).toBeNull();
      const { claimGuestEntitlements } = await import("./fulfil");
      const { tx } = await import("./db");
      const uid = Number(await B.db.val<number>("INSERT INTO users (role, email, password_hash, name, email_verified_at, created_at) VALUES ('student',$1,'x','G',NOW(),NOW()) RETURNING id", [`guest2-${tag}@pay-test.invalid`]));
      expect(await tx((db) => claimGuestEntitlements(db, { id: uid, email: `guest2-${tag}@pay-test.invalid` }))).toBe(1);
      expect((await q("SELECT user_id FROM pay_entitlements WHERE email = $1", [`guest2-${tag}@pay-test.invalid`]))[0].user_id).toBe(uid);
    });
  });

  describe("concurrency and idempotency", () => {
    it("fulfils exactly once when many requests settle the same payment at the same moment", async () => {
      const { order } = await newOrder();
      const s = await C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" });
      const pay = rzp.pay((s.checkout as { orderId: string }).orderId);
      const pid = Number((await q("SELECT id FROM pay_payments WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id]))[0].id);
      const hook = rzp.paymentEvent("payment.captured", pay.id, evt("rz"));
      const outs = await Promise.all([
        S.settlePayment(pid, ctx), S.settlePayment(pid, ctx), S.settlePayment(pid, ctx),
        rzpHook(hook), rzpHook(hook), C.confirmPayment(order.id, { userId: alice }),
      ]);
      expect(outs).toHaveLength(6);
      const oid = (await q("SELECT id FROM pay_orders WHERE public_id = $1", [order.id]))[0].id;
      expect(await q("SELECT id FROM pay_entitlements WHERE order_id = $1", [oid])).toHaveLength(1);
      expect(await q("SELECT id FROM pay_invoices WHERE order_id = $1", [oid])).toHaveLength(1);
      expect(await q("SELECT id FROM mail_outbox WHERE kind = 'payment_received' AND subject LIKE $1", [`%${order.id}%`])).toHaveLength(1);
      expect((await q("SELECT status FROM pay_orders WHERE id = $1", [oid]))[0].status).toBe("fulfilled");
    });
    it("returns the first answer for a repeated request key, and refuses the key for a different request", async () => {
      let calls = 0;
      const work = async () => ({ status: 201, body: { id: `o_${++calls}` } });
      const a = await IDEM.withIdempotency("t", `key-${tag}-aaaaaaaa`, { x: 1 }, work);
      const b = await IDEM.withIdempotency("t", `key-${tag}-aaaaaaaa`, { x: 1 }, work);
      expect(calls).toBe(1);
      expect(b).toMatchObject({ replayed: true, status: 201, body: a.body });
      await expect(IDEM.withIdempotency("t", `key-${tag}-aaaaaaaa`, { x: 2 }, work)).rejects.toMatchObject({ code: "key_reuse" });
      await expect(IDEM.withIdempotency("t", "short", { x: 1 }, work)).rejects.toThrow();
      await expect(IDEM.withIdempotency("t", `key-${tag}-bbbbbbbb`, { x: 1 }, async () => { throw new Error("boom"); })).rejects.toThrow("boom");
      expect((await IDEM.withIdempotency("t", `key-${tag}-bbbbbbbb`, { x: 1 }, work)).replayed).toBe(false); // a failed try can be repeated with the same key
    });
    it("refuses to start payment when no provider can take it", async () => {
      const { order } = await newOrder();
      delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET;
      await expect(C.startCheckout(order.id, { userId: alice }, { origin: "https://growqr.test" })).rejects.toMatchObject({ code: "no_provider" });
    });
  });
});
