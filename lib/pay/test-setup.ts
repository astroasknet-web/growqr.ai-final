import { vi } from "vitest";

/**
 * Shared set-up for the payment database tests: a real MySQL database, the fake providers, a few users and products.
 * Run with PORTAL_TEST_DATABASE_URL=mysql://root@127.0.0.1:3307/growqr_test (see migration/DATABASE-SETUP.md).
 */
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: async () => new Headers({ "x-forwarded-for": "198.51.100.77", "x-forwarded-host": "growqr.test", "x-forwarded-proto": "https" }),
}));
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

export const DB = process.env.PORTAL_TEST_DATABASE_URL;
export const tag = Math.random().toString(16).slice(2, 8);

export async function boot() {
  process.env.DATABASE_URL = DB;
  process.env.PORTAL_APP_URL = "https://growqr.test";
  const { runPortalMigrations } = await import("../portal/migrate");
  await runPortalMigrations(DB as string);
  const T = await import("./test-support");
  T.setTestEnv();
  const db = await import("../portal/db");
  return { db, T };
}

export type Boot = Awaited<ReturnType<typeof boot>>;

export async function mkUser(db: typeof import("../portal/db"), role: string, label: string): Promise<number> {
  return Number(await db.val<number>("INSERT INTO users (role, email, password_hash, name, email_verified_at, created_at) VALUES ($1,$2,'x',$3,NOW(),NOW()) RETURNING id", [role, `pay-${label}-${tag}@pay-test.invalid`, `Pay ${label} ${tag}`]));
}
export const emailOf = (label: string): string => `pay-${label}-${tag}@pay-test.invalid`;

/** A product with an INR price and, optionally, a USD price. */
export async function mkProduct(db: typeof import("../portal/db"), sku: string, kind: string, ref: string, inr: number, usd: number | null = null, extra: { days?: number | null; guest?: boolean } = {}): Promise<number> {
  const id = Number(await db.val<number>("INSERT INTO pay_products (sku, kind, title, description, fulfil_ref, access_days, active, allow_guest, max_qty) VALUES ($1,$2,$3,'',$4,$5,1,$6,3) RETURNING id", [sku, kind, `Test ${sku}`, ref, extra.days === undefined ? 30 : extra.days, extra.guest ? 1 : 0]));
  await db.run("INSERT INTO pay_prices (product_id, currency, amount_minor, tax_inclusive, active) VALUES ($1,'INR',$2,1,1)", [id, inr]);
  if (usd !== null) await db.run("INSERT INTO pay_prices (product_id, currency, amount_minor, tax_inclusive, active) VALUES ($1,'USD',$2,1,1)", [id, usd]);
  return id;
}

/** Buy a product the real way (order, checkout, provider payment, verification) with the fake Razorpay; returns the public order id. */
export async function buy(rzp: InstanceType<typeof import("./test-support").FakeRazorpay>, userId: number, email: string, sku: string): Promise<string> {
  rzp.install();
  const P = await import("./orders");
  const C = await import("./checkout");
  const { order, accessToken } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku, qty: 1 }], country: "IN", billing: { name: "Buyer Test", email } }), { userId });
  const started = await C.startCheckout(order.id, { userId, token: accessToken }, { origin: "https://growqr.test", provider: null });
  rzp.pay((started.checkout as { orderId: string }).orderId);
  await C.confirmPayment(order.id, { userId }, {});
  return order.id;
}
