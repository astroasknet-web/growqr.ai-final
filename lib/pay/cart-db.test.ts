import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, DB, mkProduct, mkUser, tag, type Boot } from "./test-setup";

/** The cart: what the cart page shows for a list of product codes. */
describe.skipIf(!DB)("cart on a real database", () => {
  let B: Boot;
  let CART: typeof import("./cart");
  let ROUTE: typeof import("../../app/api/v1/cart/route");
  let alice = 0;
  const a = `t-cart-a-${tag}`; // INR and USD
  const b = `t-cart-b-${tag}`; // INR and USD
  const inrOnly = `t-cart-inr-${tag}`;
  const courseSlug = `t-cart-course-${tag}`;
  const course = `course-${courseSlug}`;
  const call = (body: unknown, origin: string | null = "https://growqr.test") => ROUTE.POST(new Request("https://growqr.test/api/v1/cart", { method: "POST", headers: { "content-type": "application/json", ...(origin ? { origin } : {}) }, body: JSON.stringify(body) }));

  beforeAll(async () => {
    B = await boot();
    CART = await import("./cart");
    ROUTE = await import("../../app/api/v1/cart/route");
    alice = await mkUser(B.db, "student", "alice");
    await mkProduct(B.db, a, "plan", "pro", 10000, 1200);
    await mkProduct(B.db, b, "other", "x", 25000, 3000);
    await mkProduct(B.db, inrOnly, "other", "y", 5000);
    const id = await mkProduct(B.db, course, "course", courseSlug, 39900, null);
    await B.db.run("INSERT IGNORE INTO courses (slug, title, category) VALUES ($1,'Cart test course','digital')", [courseSlug]);
    void id;
  });
  beforeEach(() => B.T.setTestEnv());
  afterAll(async () => { await B.db.closePool(); });

  it("prices several items together, in the buyer's home currency", async () => {
    const v = await CART.viewCart({ skus: [a, b], country: "IN" }, { userId: null });
    expect(v.currency).toBe("INR");
    expect(v.lines.map((l) => [l.sku, l.status, l.unitMinor])).toEqual([[a, "ok", 10000], [b, "ok", 25000]]);
    expect(v.quote?.totalMinor).toBe(35000);
  });

  it("uses USD for a buyer outside India when the items have a dollar price", async () => {
    const v = await CART.viewCart({ skus: [a, b], country: "US" }, { userId: null });
    expect(v.currency).toBe("USD");
    expect(v.quote?.totalMinor).toBe(4200);
  });

  it("flags, never silently drops, an item that cannot be bought in the chosen currency or no longer exists", async () => {
    const v = await CART.viewCart({ skus: [a, inrOnly, "no-such-product"], country: "US" }, { userId: null });
    const by = Object.fromEntries(v.lines.map((l) => [l.sku, l]));
    expect(by[a].status).toBe("ok");
    expect(by[inrOnly].status).toBe("unavailable");
    expect(by[inrOnly].reason).toMatch(/USD/);
    expect(by["no-such-product"].status).toBe("unavailable");
    expect(v.quote?.totalMinor).toBe(1200); // only the buyable item is priced
  });

  it("marks a course the person already has, and does not charge for it", async () => {
    const before = await CART.viewCart({ skus: [course, a], country: "IN" }, { userId: alice });
    expect(before.lines[0].status).toBe("ok");
    const cid = Number(await B.db.val<number>("SELECT id FROM courses WHERE slug = $1", [courseSlug]));
    await B.db.run("INSERT IGNORE INTO course_enrolments (user_id, course_id, status, done_json, progress, started_at, updated_at) VALUES ($1,$2,'enrolled','[]',0,NOW(),NOW())", [alice, cid]);
    const after = await CART.viewCart({ skus: [course, a], country: "IN" }, { userId: alice });
    expect(after.lines[0].status).toBe("owned");
    expect(after.quote?.totalMinor).toBe(10000);
  });

  it("applies a coupon through the same pricing code, and removes duplicates", async () => {
    const v = await CART.viewCart({ skus: [a, a, b], country: "IN", coupon: "NO-SUCH-COUPON" }, { userId: null });
    expect(v.lines).toHaveLength(2);
    expect(v.quote?.couponError).toBeTruthy();
    expect(v.quote?.totalMinor).toBe(35000);
  });

  it("lets a buyer retry with the same coupon after an unpaid checkout, without letting it be used twice", async () => {
    const P = await import("./orders");
    const C = await import("./checkout");
    const code = `RETRY${tag}`.toUpperCase();
    await B.db.run("INSERT INTO pay_coupons (code, kind, percent_bp, per_user_limit, active) VALUES ($1,'percent',1000,1,1)", [code]);
    const mk = () => P.createOrder(P.createOrderSchema.parse({ items: [{ sku: a, qty: 1 }], country: "IN", coupon: code, billing: { name: "Alice", email: `pay-alice-${tag}@pay-test.invalid` } }), { userId: alice });
    const first = await mk();
    expect(first.order.discountMinor).toBe(1000);
    // the price preview does not hold the buyer's own unpaid order against them
    const v = await CART.viewCart({ skus: [a], country: "IN", coupon: code }, { userId: alice });
    expect(v.quote?.couponError).toBeNull();
    // but a second real order is refused while the first still holds the coupon ...
    await expect(mk()).rejects.toMatchObject({ code: "coupon_invalid" });
    // ... until the earlier unpaid checkout is released, which the order route does first
    await C.releaseHeldCoupon(alice, code);
    const second = await mk();
    expect(second.order.discountMinor).toBe(1000);
    const held = await B.db.val<number>("SELECT COUNT(*) FROM pay_coupon_redemptions r JOIN pay_coupons c ON c.id = r.coupon_id WHERE c.code = $1", [code]);
    expect(Number(held)).toBe(1); // exactly one order holds the coupon
    const old = await B.db.val<string>("SELECT status FROM pay_orders WHERE public_id = $1", [first.order.id]);
    expect(old).toBe("cancelled");
  });

  it("caps the cart and reports an empty basket as blocked", async () => {
    const many = Array.from({ length: 30 }, (_, i) => `t-nothing-${i}`);
    const v = await CART.viewCart({ skus: many, country: "IN" }, { userId: null });
    expect(v.lines.length).toBe(CART.MAX_CART_ITEMS);
    expect(v.blocked).toBe(true);
    expect(v.quote).toBeNull();
  });

  it("refuses blocked countries", async () => {
    await expect(CART.viewCart({ skus: [a], country: "KP" }, { userId: null })).rejects.toMatchObject({ status: 403 });
  });

  it("the route works for a visitor, rejects other sites, and rejects bad input", async () => {
    const ok = await call({ skus: [a], country: "IN" });
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { data: { quote: { totalMinor: number } } }).data.quote.totalMinor).toBe(10000);
    expect((await call({ skus: [a], country: "IN" }, "https://evil.example")).status).toBe(403);
    expect((await call({ skus: ["<script>"], country: "IN" })).status).toBe(422);
    expect((await call({ skus: [a], country: "India" })).status).toBe(422);
  });

  it("a price sent by the client is ignored", async () => {
    const r = await call({ skus: [a], country: "IN", price: 1, total: 1, unitMinor: 1 });
    expect(((await r.json()) as { data: { quote: { totalMinor: number } } }).data.quote.totalMinor).toBe(10000);
  });
});
