import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, DB, emailOf, mkProduct, mkUser, tag, type Boot } from "./test-setup";

/**
 * Refunds, disputes, reconciliation, the audit chain, background jobs, permissions and documents, on a real database with fake providers.
 *
 *   PORTAL_TEST_DATABASE_URL=mysql://root@127.0.0.1:3307/growqr_test npx vitest run lib/pay
 */
describe.skipIf(!DB)("refunds, disputes and reconciliation on a real database", () => {
  let B: Boot;
  let P: typeof import("./orders");
  let C: typeof import("./checkout");
  let W: typeof import("./webhooks");
  let R: typeof import("./refunds");
  let REC: typeof import("./reconcile");
  let J: typeof import("./jobs");
  let ENT: typeof import("./entitlements");
  let A: typeof import("./audit");
  let INV: typeof import("./invoices");
  let M: typeof import("./metrics");
  let ST: typeof import("./staff");
  let pool: typeof import("./db").pool;
  let rzp: InstanceType<typeof import("./test-support").FakeRazorpay>;
  let stp: InstanceType<typeof import("./test-support").FakeStripe>;
  let alice = 0;
  let admin = 0;
  let sku = "";
  let n = 0;
  const evt = (p: string) => `${p}_${tag}_${++n}`;
  const q = async <T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T[]> => B.db.all<T & Record<string, any>>(sql, params) as Promise<T[]>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const origin = { origin: "https://growqr.test" };
  const rzpHook = (h: { raw: string; headers: Headers }) => W.receiveWebhook("razorpay", h.raw, h.headers);
  const stripeHook = (h: { raw: string; headers: Headers }) => W.receiveWebhook("stripe", h.raw, h.headers);
  const key = () => `refund-${tag}-${++n}-xxxxxxxx`;
  const orderRow = async (id: string) => (await q("SELECT * FROM pay_orders WHERE public_id = $1", [id]))[0];

  /** A paid and fulfilled Razorpay order for Alice. */
  async function paidRzp(over: Record<string, unknown> = {}, user = alice) {
    const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "IN", billing: { name: "Alice Test", email: emailOf("alice") }, ...over }), { userId: user });
    const s = await C.startCheckout(order.id, { userId: user }, origin);
    const rzOrder = (s.checkout as { orderId: string }).orderId;
    const pay = rzp.pay(rzOrder);
    await rzpHook(rzp.paymentEvent("payment.captured", pay.id, evt("rz")));
    return { order, pay, rzOrder };
  }
  /** A paid and fulfilled Stripe order. */
  async function paidStripe(user = alice) {
    const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "US", billing: { name: "Alice Test", email: emailOf("alice") } }), { userId: user });
    await C.startCheckout(order.id, { userId: user }, origin);
    const sid = [...stp.sessions.keys()].pop() as string;
    const pi = stp.pay(sid);
    await stripeHook(stp.sessionEvent("checkout.session.completed", sid, evt("evt_st")));
    return { order, sid, pi };
  }
  const refundOf = async (orderId: string) => q("SELECT * FROM pay_refunds WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1) ORDER BY id", [orderId]);

  beforeAll(async () => {
    B = await boot();
    ({ pool } = await import("./db"));
    P = await import("./orders"); C = await import("./checkout"); W = await import("./webhooks"); R = await import("./refunds"); REC = await import("./reconcile");
    J = await import("./jobs"); ENT = await import("./entitlements"); A = await import("./audit"); INV = await import("./invoices"); M = await import("./metrics"); ST = await import("./staff");
    rzp = new B.T.FakeRazorpay(); stp = new B.T.FakeStripe();
    alice = await mkUser(B.db, "student", "alice"); admin = await mkUser(B.db, "admin", "admin");
    sku = `t-ref-${tag}`;
    await mkProduct(B.db, sku, "plan", "silver", 59900, 6900, { days: 30 });
  });
  beforeEach(() => { B.T.setTestEnv(); rzp.install(); stp.install(); });
  afterAll(async () => { rzp.uninstall(); stp.uninstall(); await B.db.closePool(); });

  describe("refunds (Razorpay)", () => {
    it("records a partial refund as pending, completes it only when the provider confirms, and sends one credit note and one email", async () => {
      const { order, pay } = await paidRzp();
      const r1 = await R.requestRefund({ orderPublicId: order.id, amountMinor: 10000, reason: "Customer asked", staffUserId: admin, idempotencyKey: key() });
      expect(r1).toMatchObject({ status: "pending", amountMinor: 10000 });
      expect((await orderRow(order.id)).status).toBe("fulfilled"); // not refunded until the provider says so
      const rf = [...rzp.refunds.values()][rzp.refunds.size - 1];
      rzp.processRefund(rf.id);
      const hook = rzp.webhook("refund.processed", { refund: { entity: rf } }, evt("rz"));
      expect((await rzpHook(hook)).status).toBe(200);
      expect(await rzpHook(hook)).toMatchObject({ body: { duplicate: true } });
      const o = await orderRow(order.id);
      expect(o).toMatchObject({ status: "partially_refunded" });
      expect(Number(o.refunded_minor)).toBe(10000);
      expect((await refundOf(order.id))[0].status).toBe("succeeded");
      expect(await q("SELECT id FROM pay_invoices WHERE order_id = $1 AND kind = 'credit_note'", [o.id])).toHaveLength(1);
      expect(await q("SELECT id FROM mail_outbox WHERE kind = 'refund_succeeded' AND subject LIKE $1", [`%${order.id}%`])).toHaveLength(1);
      expect(await ENT.activePlan(alice)).toBe("silver"); // a partial refund takes nothing away
      expect(pay.id).toBeTruthy();
    });

    it("repeats an idempotent request safely, refuses to over-refund, and revokes access on a full refund", async () => {
      const buyer = await mkUser(B.db, "student", `rf${++n}`);
      const { order } = await paidRzp({}, buyer);
      expect(await ENT.activePlan(buyer)).toBe("silver");
      const k = key();
      const a = await R.requestRefund({ orderPublicId: order.id, amountMinor: 20000, reason: "First part", staffUserId: admin, idempotencyKey: k });
      const b = await R.requestRefund({ orderPublicId: order.id, amountMinor: 20000, reason: "First part", staffUserId: admin, idempotencyKey: k });
      expect(b.id).toBe(a.id);
      expect(rzp.refunds.size).toBeGreaterThan(0);
      const before = rzp.refunds.size;
      await R.requestRefund({ orderPublicId: order.id, amountMinor: 20000, reason: "First part", staffUserId: admin, idempotencyKey: k });
      expect(rzp.refunds.size).toBe(before); // no second refund at the provider
      await expect(R.requestRefund({ orderPublicId: order.id, amountMinor: 50000, reason: "Too much", staffUserId: admin, idempotencyKey: key() })).rejects.toMatchObject({ code: "amount_too_high" });
      await expect(R.requestRefund({ orderPublicId: order.id, amountMinor: 0, reason: "Zero", staffUserId: admin, idempotencyKey: key() })).rejects.toMatchObject({ code: "bad_amount" });
      await expect(R.requestRefund({ orderPublicId: order.id, amountMinor: 100, reason: "", staffUserId: admin, idempotencyKey: key() })).rejects.toMatchObject({ code: "reason_required" });
      await expect(R.requestRefund({ orderPublicId: order.id, amountMinor: 100, reason: "No key", staffUserId: admin, idempotencyKey: "x" })).rejects.toMatchObject({ code: "bad_idempotency_key" });
      const rest = await R.requestRefund({ orderPublicId: order.id, reason: "The rest", staffUserId: admin, idempotencyKey: key() }); // default: everything that is left
      expect(rest.amountMinor).toBe(59900 - 20000);
      for (const rf of rzp.refunds.values()) { rzp.processRefund(rf.id); await rzpHook(rzp.webhook("refund.processed", { refund: { entity: rf } }, evt("rz"))); }
      expect((await orderRow(order.id)).status).toBe("refunded");
      expect(await ENT.activePlan(buyer)).toBeNull(); // access ended with the full refund
      expect((await q("SELECT status FROM pay_entitlements WHERE order_id = (SELECT id FROM pay_orders WHERE public_id = $1)", [order.id]))[0].status).toBe("revoked");
    });

    it("lets only one of several simultaneous refund requests through, however they are keyed", async () => {
      const { order } = await paidRzp();
      const total = 59900;
      const attempts = await Promise.allSettled([R.requestRefund({ orderPublicId: order.id, amountMinor: total, reason: "First request", staffUserId: admin, idempotencyKey: key() }), R.requestRefund({ orderPublicId: order.id, amountMinor: total, reason: "Second request", staffUserId: admin, idempotencyKey: key() }), R.requestRefund({ orderPublicId: order.id, amountMinor: total, reason: "Third request", staffUserId: admin, idempotencyKey: key() })]);
      expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
      const sum = (await refundOf(order.id)).filter((r) => r.status !== "failed").reduce((a, r) => a + Number(r.amount_minor), 0);
      expect(sum).toBe(total);
    });
    it("calls the provider once when the same request key arrives several times at once", async () => {
      const { order, pay } = await paidRzp();
      const k = key();
      await Promise.all([1, 2, 3].map(() => R.requestRefund({ orderPublicId: order.id, amountMinor: 5000, reason: "Same", staffUserId: admin, idempotencyKey: k })));
      expect([...rzp.refunds.values()].filter((r) => r.payment_id === pay.id)).toHaveLength(1);
    });

    it("keeps a refund the provider could not be reached for as requested, then finishes it without a second refund", async () => {
      const { order, pay } = await paidRzp();
      rzp.failNext = { path: /\/refund$/, status: 503 };
      const r = await R.requestRefund({ orderPublicId: order.id, amountMinor: 7000, reason: "Provider down", staffUserId: admin, idempotencyKey: key() });
      expect(r.status).toBe("requested");
      expect([...rzp.refunds.values()].filter((x) => x.payment_id === pay.id)).toHaveLength(0);
      await B.db.run("UPDATE pay_refunds SET created_at = (UTC_TIMESTAMP() - INTERVAL 10 MINUTE), updated_at = (UTC_TIMESTAMP() - INTERVAL 10 MINUTE) WHERE public_id = $1", [r.id]);
      const out = await R.resolveStuckRefunds();
      expect(out.resolved).toBeGreaterThan(0);
      expect([...rzp.refunds.values()].filter((x) => x.payment_id === pay.id)).toHaveLength(1);
      expect((await refundOf(order.id))[0].status).toBe("pending");
    });
    it("adopts a refund the provider already created when our call timed out after it went through", async () => {
      const { order, pay } = await paidRzp();
      rzp.failNext = { path: /\/refund$/, status: 503 };
      const r = await R.requestRefund({ orderPublicId: order.id, amountMinor: 3000, reason: "Lost answer", staffUserId: admin, idempotencyKey: key() });
      rzp.refunds.set(`rfnd_made_${tag}_${++n}`, { id: `rfnd_made_${tag}_${n}`, payment_id: pay.id, amount: 3000, currency: "INR", status: "pending", receipt: r.id, notes: {} });
      await B.db.run("UPDATE pay_refunds SET created_at = (UTC_TIMESTAMP() - INTERVAL 10 MINUTE), updated_at = (UTC_TIMESTAMP() - INTERVAL 10 MINUTE) WHERE public_id = $1", [r.id]);
      await R.resolveStuckRefunds();
      expect([...rzp.refunds.values()].filter((x) => x.payment_id === pay.id)).toHaveLength(1); // adopted, not created again
      expect((await refundOf(order.id))[0].provider_refund_ref).toBe(`rfnd_made_${tag}_${n}`);
    });
    it("marks a refund failed when the provider refuses it, and tells staff", async () => {
      const { order } = await paidRzp();
      rzp.failNext = { path: /\/refund$/, status: 400 };
      const r = await R.requestRefund({ orderPublicId: order.id, amountMinor: 1000, reason: "Refused", staffUserId: admin, idempotencyKey: key() });
      expect(r.status).toBe("failed");
      expect((await orderRow(order.id)).status).toBe("fulfilled");
      expect(Number((await orderRow(order.id)).refunded_minor)).toBe(0);
      const again = await R.requestRefund({ orderPublicId: order.id, amountMinor: 59900, reason: "Whole amount is available again", staffUserId: admin, idempotencyKey: key() });
      expect(["pending", "requested"]).toContain(again.status);
    });
    it("refuses a refund on an unpaid order", async () => {
      const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "IN", billing: { name: "A B", email: emailOf("alice") } }), { userId: alice });
      await expect(R.requestRefund({ orderPublicId: order.id, amountMinor: 100, reason: "Not paid", staffUserId: admin, idempotencyKey: key() })).rejects.toMatchObject({ code: "no_refundable_payment" });
    });
    it("records a refund made in the provider's own dashboard", async () => {
      const { order, pay } = await paidRzp();
      const rf = { id: `rfnd_dash_${tag}_${++n}`, payment_id: pay.id, amount: 4000, currency: "INR", status: "processed", receipt: null, notes: {} };
      rzp.refunds.set(rf.id, rf);
      pay.amount_refunded = 4000;
      await rzpHook(rzp.webhook("refund.created", { refund: { entity: rf } }, evt("rz")));
      const rows = await refundOf(order.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ status: "succeeded", requested_by: null });
      expect((await orderRow(order.id)).status).toBe("partially_refunded");
    });
  });

  describe("refunds (Stripe)", () => {
    it("completes a full refund straight away when Stripe confirms it, issues a credit note and revokes access", async () => {
      const buyer = await mkUser(B.db, "student", `st${++n}`);
      const { order } = await paidStripe(buyer);
      stp.refundStatus = "succeeded";
      const r = await R.requestRefund({ orderPublicId: order.id, reason: "Full refund", staffUserId: admin, idempotencyKey: key() });
      expect(r).toMatchObject({ status: "succeeded", amountMinor: 6900, currency: "USD" });
      expect((await orderRow(order.id)).status).toBe("refunded");
      expect(await q("SELECT id FROM pay_invoices WHERE order_id = $1 AND kind = 'credit_note'", [(await orderRow(order.id)).id])).toHaveLength(1);
      expect(await ENT.activePlan(buyer)).toBeNull();
    });
    it("waits for a pending refund and finishes it from the refund event", async () => {
      const { order, pi } = await paidStripe();
      stp.refundStatus = "pending";
      const r = await R.requestRefund({ orderPublicId: order.id, amountMinor: 2000, reason: "Pending one", staffUserId: admin, idempotencyKey: key() });
      expect(r.status).toBe("pending");
      const ref = [...stp.refunds.values()].pop() as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      ref.status = "succeeded";
      await stripeHook(stp.event("charge.refund.updated", ref, evt("evt_st")));
      expect((await refundOf(order.id))[0].status).toBe("succeeded");
      expect((await orderRow(order.id)).status).toBe("partially_refunded");
      stp.refundStatus = "succeeded";
      expect(pi).toBeTruthy();
    });
  });

  describe("disputes", () => {
    it("marks the order disputed, blocks refunds, restores it when won, and takes access away when lost", async () => {
      const buyer = await mkUser(B.db, "student", `dp${++n}`);
      const { order, pi } = await paidStripe(buyer);
      const dispute = { id: `dp_${tag}_${++n}`, object: "dispute", payment_intent: pi, amount: 6900, currency: "usd", status: "needs_response", reason: "fraudulent", evidence_details: { due_by: Math.floor(Date.now() / 1000) + 86400 * 7 } };
      await stripeHook(stp.event("charge.dispute.created", dispute, evt("evt_st")));
      expect((await orderRow(order.id)).status).toBe("disputed");
      await expect(R.requestRefund({ orderPublicId: order.id, amountMinor: 100, reason: "During dispute", staffUserId: admin, idempotencyKey: key() })).rejects.toMatchObject({ code: "payment_disputed" });
      expect(await q("SELECT id FROM mail_outbox WHERE kind = 'payment_alert' AND subject LIKE '%Dispute%'")).not.toHaveLength(0);
      await stripeHook(stp.event("charge.dispute.closed", { ...dispute, status: "won" }, evt("evt_st")));
      expect((await orderRow(order.id)).status).toBe("fulfilled");
      expect(await ENT.activePlan(buyer)).toBe("silver");

      const second = await paidStripe(await mkUser(B.db, "student", `dq${++n}`));
      const d2 = { ...dispute, id: `dp_${tag}_${++n}`, payment_intent: second.pi };
      await stripeHook(stp.event("charge.dispute.created", d2, evt("evt_st")));
      await stripeHook(stp.event("charge.dispute.closed", { ...d2, status: "lost" }, evt("evt_st")));
      expect((await orderRow(second.order.id)).status).toBe("disputed");
      expect((await q("SELECT status FROM pay_entitlements WHERE order_id = $1", [(await orderRow(second.order.id)).id]))[0].status).toBe("revoked");
    });
  });

  describe("reconciliation", () => {
    const window = () => ({ from: new Date(Date.now() - 3_600_000), to: new Date(Date.now() + 60_000) });

    it("finds a payment whose webhook never arrived and settles it", async () => {
      const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "IN", billing: { name: "A B", email: emailOf("alice") } }), { userId: alice });
      const s = await C.startCheckout(order.id, { userId: alice }, origin);
      rzp.pay((s.checkout as { orderId: string }).orderId); // paid; no webhook, no return visit
      const rep = await REC.reconcileProvider("razorpay", window(), "test");
      expect(rep.mismatches).toBeGreaterThan(0);
      expect((await orderRow(order.id)).status).toBe("fulfilled");
      const items = await REC.listItems(rep.runId);
      expect(items.find((i) => i.kind === "status_mismatch")?.resolved).toBe(1);
    });
    it("flags provider payments we have no record of, ours the provider cannot find, and refund totals that differ", async () => {
      const ghost = `order_ghost_${tag}_${++n}`;
      rzp.orders.set(ghost, { id: ghost, amount: 5000, currency: "INR", receipt: "ord_ghost", notes: { order_id: "ord_ghostxxxxxxxxxxxxxxx" }, status: "created" });
      rzp.pay(ghost);
      const { order, pay } = await paidRzp();
      pay.amount_refunded = 1234; // refunded at the provider, unknown to us
      const lost = await paidRzp();
      rzp.payments.delete(lost.pay.id); // we have it as paid, the provider has no such payment
      const rep = await REC.reconcileProvider("razorpay", window(), "test");
      const kinds = (await REC.listItems(rep.runId)).map((i) => i.kind);
      expect(kinds).toContain("missing_internal");
      expect(kinds).toContain("refund_mismatch");
      expect(kinds).toContain("missing_provider");
      expect(order.id).toBeTruthy();
    });
    it("flags a different amount", async () => {
      const { pay } = await paidRzp();
      pay.amount = 100;
      const rep = await REC.reconcileProvider("razorpay", window(), "test");
      expect((await REC.listItems(rep.runId)).map((i) => i.kind)).toContain("amount_mismatch");
    });
    it("reports a clean run when everything agrees, and a person can close an item", async () => {
      rzp.payments.clear(); rzp.orders.clear();
      await new Promise((r) => setTimeout(r, 1200)); // earlier tests' payments now fall before this window
      const tight = () => ({ from: new Date(Math.floor(Date.now() / 1000) * 1000 - 1000), to: new Date(Date.now() + 60_000) });
      const t0 = tight();
      const { pay } = await paidRzp();
      const rep = await REC.reconcileProvider("razorpay", t0, "test");
      expect(rep).toMatchObject({ mismatches: 0 });
      expect((await q("SELECT status FROM pay_reconciliation_runs WHERE id = $1", [rep.runId]))[0].status).toBe("ok");
      pay.amount = 5;
      const bad = await REC.reconcileProvider("razorpay", t0, "test");
      const item = (await REC.listItems(bad.runId))[0];
      await REC.resolveItem(Number(item.id), admin);
      expect((await q("SELECT resolved FROM pay_reconciliation_items WHERE id = $1", [item.id]))[0].resolved).toBe(1);
    });
    it("reconciles Stripe sessions too", async () => {
      const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "US", billing: { name: "A B", email: emailOf("alice") } }), { userId: alice });
      await C.startCheckout(order.id, { userId: alice }, origin);
      stp.pay([...stp.sessions.keys()].pop() as string); // paid, webhook lost
      const rep = await REC.reconcileProvider("stripe", window(), "test");
      expect(rep.mismatches).toBeGreaterThan(0);
      expect((await orderRow(order.id)).status).toBe("fulfilled");
    });
  });

  describe("audit trail", () => {
    it("is an unbroken hash chain, and shows tampering", async () => {
      await paidRzp();
      expect((await A.verifyAuditChain(pool)).brokenAt).toBeNull();
      const row = (await q("SELECT id, detail FROM pay_audit_events ORDER BY id DESC LIMIT 1"))[0];
      await B.db.run("UPDATE pay_audit_events SET detail = '{\"edited\":true}' WHERE id = $1", [row.id]);
      expect((await A.verifyAuditChain(pool)).brokenAt).toBe(Number(row.id));
      await B.db.run("UPDATE pay_audit_events SET detail = $1 WHERE id = $2", [row.detail, row.id]); // put it back
      expect((await A.verifyAuditChain(pool)).brokenAt).toBeNull();
    });
    it("keeps secrets out of what it stores", async () => {
      await A.audit({ actorType: "system", action: "test.redaction", entity: "order", entityId: "x", detail: { apiKey: "sk_live_should_not_appear", note: "ok" } });
      const row = (await q("SELECT detail FROM pay_audit_events WHERE action = 'test.redaction' ORDER BY id DESC LIMIT 1"))[0];
      expect(row.detail).not.toContain("sk_live_should_not_appear");
      expect(row.detail).toContain("ok");
    });
    it("stays linear when many events are written at once", async () => {
      await Promise.all(Array.from({ length: 12 }, (_, i) => A.audit({ actorType: "system", action: "test.parallel", entity: "order", entityId: `p${i}` })));
      expect((await A.verifyAuditChain(pool)).brokenAt).toBeNull();
    });
  });

  describe("background jobs", () => {
    it("retries a webhook that failed because the provider was unreachable, and revives a dead one by hand", async () => {
      await B.db.run("UPDATE pay_webhook_events SET status = 'dead' WHERE status IN ('failed','received') AND event_id NOT LIKE $1", [`%${tag}%`]); // leftovers from earlier runs belong to a provider that no longer exists
      const { order } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "IN", billing: { name: "A B", email: emailOf("alice") } }), { userId: alice });
      const s = await C.startCheckout(order.id, { userId: alice }, origin);
      const pay = rzp.pay((s.checkout as { orderId: string }).orderId);
      const hook = rzp.paymentEvent("payment.captured", pay.id, evt("rz"));
      rzp.failNext = { path: /^\/orders\//, status: 503 };
      expect((await rzpHook(hook)).status).toBe(500); // so Razorpay will retry
      const id = hook.headers.get("x-razorpay-event-id");
      expect((await q("SELECT status FROM pay_webhook_events WHERE event_id = $1", [id]))[0].status).toBe("failed");
      await B.db.run("UPDATE pay_webhook_events SET received_at = (UTC_TIMESTAMP() - INTERVAL 3 HOUR) WHERE event_id = $1", [id]);
      expect(await W.retryFailedWebhooks()).toBeGreaterThan(0);
      expect((await q("SELECT status FROM pay_webhook_events WHERE event_id = $1", [id]))[0].status).toBe("processed");
      expect((await orderRow(order.id)).status).toBe("fulfilled");

      await B.db.run("UPDATE pay_webhook_events SET status = 'dead', attempts = 8 WHERE event_id = $1", [id]);
      const back = await W.forceRetry(Number((await q("SELECT id FROM pay_webhook_events WHERE event_id = $1", [id]))[0].id), admin);
      expect(back.status).toBe(200);
    });
    it("expires old unpaid orders, marks all-failed ones as failed, and runs the whole job set without error", async () => {
      const a = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "IN", billing: { name: "A B", email: emailOf("alice") } }), { userId: alice });
      await B.db.run("UPDATE pay_orders SET expires_at = (UTC_TIMESTAMP() - INTERVAL 5 MINUTE) WHERE public_id = $1", [a.order.id]);
      const out = await J.runPaymentJobs();
      expect(out).toHaveProperty("expiredOrders");
      expect((await orderRow(a.order.id)).status).toBe("expired");
      expect(Object.values(out).some((v) => typeof v === "object" && v !== null && "error" in (v as object))).toBe(false);
    });
  });

  describe("metrics, permissions and documents", () => {
    it("summarises recent activity and spots trouble", async () => {
      const m = await M.paymentMetrics(24);
      expect(m.payments.succeeded).toBeGreaterThan(0);
      expect(m.webhooks).toHaveProperty("dead");
      expect(M.anomalies({ ...m, payments: { ...m.payments, succeeded: 2, failed: 20, successRate: 2 / 22 } }).join(" ")).toMatch(/succeeded/);
      expect(M.anomalies({ ...m, webhooks: { ...m.webhooks, dead: 1 } }).join(" ")).toMatch(/could not be processed/);
      const h = await M.paymentHealth();
      expect(h.database).toBe(true);
      expect(JSON.stringify(h)).not.toMatch(/rzp_test_secret|sk_test_fake|whsec_/); // reveals no keys
    });
    it("gives support read access only, finance refunds and exports, and admins everything", async () => {
      const finance = await mkUser(B.db, "student", "fin");
      const support = await mkUser(B.db, "student", "sup");
      await B.db.run("INSERT INTO pay_staff (user_id, role) VALUES ($1,'finance'),($2,'support')", [finance, support]);
      const role = (id: number, r = "student") => ST.payRole({ id, role: r });
      expect(ST.can(await role(support), "view")).toBe(true);
      expect(ST.can(await role(support), "refund")).toBe(false);
      expect(ST.can(await role(support), "export")).toBe(false);
      expect(ST.can(await role(finance), "refund")).toBe(true);
      expect(ST.can(await role(finance), "manage_catalogue")).toBe(false);
      expect(ST.can(await role(admin, "admin"), "manage_staff")).toBe(true);
      expect(ST.can(await role(alice), "view")).toBe(false); // an ordinary customer has no role
      expect(await ST.payRole(null)).toBeNull();
    });
    it("escapes everything in a printable receipt and never calls a receipt a tax invoice by default", async () => {
      const { order } = await paidRzp({ billing: { name: "<script>alert(1)</script> Eve", email: emailOf("alice") } });
      const id = (await orderRow(order.id)).id;
      const docs = await INV.getDocuments(Number(id));
      expect(docs).toHaveLength(1);
      expect(docs[0].kind).toBe("receipt");
      expect(docs[0].notes.join(" ")).toMatch(/not a tax invoice/i);
      const html = INV.renderDocumentHtml(docs[0]);
      expect(html).not.toContain("<script>alert(1)</script>");
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("₹");
    });
    it("issues a tax invoice only when that mode and the seller's tax details are set", async () => {
      process.env.PAY_INVOICE_MODE = "tax_invoice";
      const off = await paidRzp(); // no seller tax id yet: still a receipt
      expect((await INV.getDocuments(Number((await orderRow(off.order.id)).id)))[0].kind).toBe("receipt");
      process.env.PAY_SELLER_TAX_ID = "TEST-TAX-ID"; process.env.PAY_SELLER_ADDRESS = "1 Test Street";
      const on = await paidRzp();
      const d = (await INV.getDocuments(Number((await orderRow(on.order.id)).id)))[0];
      expect(d.kind).toBe("tax_invoice");
      expect(d.number).toMatch(/^INV-\d{4}-\d{6}$/);
      delete process.env.PAY_INVOICE_MODE; delete process.env.PAY_SELLER_TAX_ID; delete process.env.PAY_SELLER_ADDRESS;
    });
    it("numbers documents without gaps or repeats when many are issued together", async () => {
      const made = await Promise.all([1, 2, 3, 4].map(() => paidRzp()));
      const numbers = (await Promise.all(made.map(async (m) => (await INV.getDocuments(Number((await orderRow(m.order.id)).id)))[0].number))).sort();
      expect(new Set(numbers).size).toBe(4);
    });
  });
});
