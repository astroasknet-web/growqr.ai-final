import { createHmac } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Resume Studio on a real database: starter resume, versions, preferences, the free / Pro rules and the Razorpay flow
 * (with Razorpay itself mocked). When PHP is available it also checks that the PHP app sees the same Pro access.
 *
 *   PORTAL_TEST_DATABASE_URL=mysql://root@127.0.0.1:3307/growqr_test npx vitest run lib/studio/studio-db.test.ts
 */
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: async () => new Headers({ "x-forwarded-host": "growqr.test", "x-forwarded-proto": "https" }),
}));
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const DB = process.env.PORTAL_TEST_DATABASE_URL;
const PHP_ROOT = path.resolve(__dirname, "../../../qrscore");
/** Cross-checking against the PHP app is opt-in (PHP_CROSSCHECK=1, with the PHP app pointed at this same database); the PHP source is not part of this repository. */
const phpOk = (() => {
  if (process.env.PHP_CROSSCHECK !== "1") return false;
  try {
    return existsSync(path.join(PHP_ROOT, "autoload.php")) && execFileSync("php", ["-r", "echo extension_loaded('pdo_pgsql') ? 'y' : 'n';"], { encoding: "utf8" }) === "y";
  } catch {
    return false;
  }
})();
const php = (code: string): string =>
  execFileSync(
    "php",
    ["-r", `require '${PHP_ROOT.replace(/\\/g, "/")}/autoload.php'; QrScore\\Portal\\Db::init((array) require '${PHP_ROOT.replace(/\\/g, "/")}/config.php', '${PHP_ROOT.replace(/\\/g, "/")}'); ${code}`],
    { encoding: "utf8" },
  ).trim();

/** Ask the PHP app whether it sees this student as Pro. The local test database serves one connection at a time, so retry, and skip the cross-check when PHP cannot get in. */
const phpPro = async (uid: number): Promise<string | null> => {
  for (let i = 0; i < 4; i++) {
    try {
      return php(`echo QrScore\\Studio\\Access::isPro(${uid}) ? 'y' : 'n';`);
    } catch {
      await new Promise((r) => setTimeout(r, 700));
    }
  }
  return null;
};

const KEY_SECRET = "test-key-secret";
const WEBHOOK_SECRET = "test-webhook-secret";
const sign = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");

describe.skipIf(!DB)("resume studio on a real database", () => {
  const tag = Math.random().toString(16).slice(2, 8);
  const email = `st-${tag}@portal-test.invalid`;
  let uid = 0;
  let db: typeof import("../portal/db");
  let store: typeof import("./store");
  let access: typeof import("./access");
  let pay: typeof import("./pay");
  let rd: typeof import("./resume-data");
  let sc: typeof import("./scorer");
  let tpls: typeof import("./templates");

  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.PORTAL_APP_URL = "https://growqr.test";
    process.env.RAZORPAY_KEY_ID = "rzp_test_x";
    process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
    delete process.env.RESEND_API_KEY;
    db = await import("../portal/db");
    store = await import("./store");
    access = await import("./access");
    pay = await import("./pay");
    rd = await import("./resume-data");
    sc = await import("./scorer");
    tpls = await import("./templates");
    const auth = await import("../portal/auth");
    const r = await auth.register({ role: "student", name: "Studio Tester", email, password: "blue-kettle-orbit-nine", college: "Delhi Test College" }, "198.51.100.88");
    if (!r.ok) throw new Error(r.error);
    uid = r.userId;
  });

  afterAll(async () => {
    if (!db) return;
    pay?.setHttp(null);
    await db.run("DELETE FROM users WHERE email LIKE $1", [`%${tag}@portal-test.invalid`]);
    await db.run("DELETE FROM mail_outbox WHERE to_email LIKE $1", [`%${tag}@portal-test.invalid`]);
    await db.run("DELETE FROM auth_throttle WHERE bucket = 'reg:198.51.100.88'");
    await db.closePool();
  });

  it("creates a starter resume with a scored import version, once", async () => {
    const id = await store.ensureStarter(uid, { name: "Studio Tester", email });
    expect(id).toBeGreaterThan(0);
    expect(await store.ensureStarter(uid, { name: "Studio Tester", email })).toBe(id);
    const r = await store.find(uid, id);
    expect(r?.data.personal.name).toBe("Studio Tester");
    expect(r?.template).toBe("chrono-classic");
    const vs = await store.versions(uid, id);
    expect(vs).toHaveLength(1);
    expect(vs[0].kind).toBe("import");
    expect(await store.find(uid + 999999, id)).toBeNull(); // scoped to the owner
  });

  it("saves drafts and versions and reads them back", async () => {
    const id = (await store.resumes(uid))[0].id;
    const data = rd.sample();
    const tpl = tpls.get("us-modern")!;
    await store.saveDraft(uid, id, tpl.id, data);
    const r = await store.find(uid, id);
    expect(r?.template).toBe("us-modern");
    expect(r?.data.experience).toHaveLength(2);
    const scored = sc.run(data, tpl);
    expect(scored.scored).toBe(true);
    const vid = await store.addVersion(uid, id, "save", tpl.id, data, scored);
    const v = await store.version(uid, vid);
    expect(v?.kind).toBe("save");
    expect(Number(v?.score)).toBe(scored.score);
    expect(v?.sections.length).toBeGreaterThan(0);
    expect(v?.text_body).toBe(scored.text);
    expect(await store.version(uid + 999999, vid)).toBeNull();
    const list = await store.resumes(uid);
    expect(Number(list[0].saves)).toBe(1);
  });

  it("sanitises and remembers preferences", async () => {
    const p = await store.savePrefs(uid, { region: "de", level: "mid", industry: "nope", goal: ["x"] });
    expect(p).toEqual({ region: "de", level: "mid", industry: "", goal: "" });
    expect(await store.prefs(uid)).toEqual(p);
    expect(store.guessPrefs({ career: { stage: "fresher", yearsExperience: 0 } }, { region: "other", level: "", industry: "", goal: "" }).level).toBe("student");
    expect(store.guessPrefs({ career: { stage: "experienced", yearsExperience: 9 } }, { region: "other", level: "", industry: "", goal: "" }).level).toBe("senior");
    expect(Object.values(await store.usage()).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });

  it("applies the free plan rules and lifts them for Pro", async () => {
    expect(await access.isPro(uid)).toBe(false);
    expect(await access.canUseTemplate(uid, "chrono-classic")).toBe(true);
    expect(await access.canUseTemplate(uid, "de-modern")).toBe(false);
    expect(await access.canUseTemplate(uid, "nope")).toBe(false);
    const wait = await access.secondsUntilNextSave(uid); // a 'save' version was just stored above
    expect(wait).toBeGreaterThan(23 * 3600);
    expect(wait).toBeLessThanOrEqual(24 * 3600);
    await access.grant(uid, "admin", null, 0);
    expect(await access.isPro(uid)).toBe(true);
    expect((await access.subscription(uid))?.source).toBe("admin");
    expect(await access.canUseTemplate(uid, "de-modern")).toBe(true);
    expect(await access.secondsUntilNextSave(uid)).toBe(0);
    if (phpOk) { const p = await phpPro(uid); if (p !== null) expect(p).toBe("y"); } // the PHP app sees the same grant
    await access.revoke(uid);
    expect(await access.isPro(uid)).toBe(false);
    if (phpOk) { const p = await phpPro(uid); if (p !== null) expect(p).toBe("n"); }
    expect(access.countdown(3 * 3600 + 5 * 60)).toBe("3 h 5 min");
    expect(access.countdown(30)).toBe("1 min");
  });

  it("takes payment through Razorpay once and only once", async () => {
    const calls: string[] = [];
    let paymentStatus = "captured";
    pay.setHttp(async (method, p, body) => {
      calls.push(`${method} ${p}`);
      if (method === "POST" && p === "/orders") return [200, { id: `order_${tag}` }];
      if (method === "GET" && p.startsWith("/payments/")) return [200, { order_id: `order_${tag}`, amount: access.pricePaise(), currency: "INR", status: paymentStatus }];
      if (method === "POST" && p.endsWith("/capture")) return [200, { status: "captured", body }];
      return [404, {}];
    });
    const o = await pay.createOrder(uid);
    expect(o).toMatchObject({ order_id: `order_${tag}`, amount: 19900, currency: "INR", key: "rzp_test_x" });
    expect(calls[0]).toBe("POST /orders");

    const pid = `pay_${tag}`;
    // a wrong signature is refused and grants nothing
    expect((await pay.verifyCallback(uid, o.order_id, pid, "deadbeef")).ok).toBe(false);
    expect(await access.isPro(uid)).toBe(false);
    // somebody else cannot claim this order
    expect((await pay.verifyCallback(uid + 999999, o.order_id, pid, sign(KEY_SECRET, `${o.order_id}|${pid}`))).ok).toBe(false);
    // Razorpay says the payment is not captured: refused
    paymentStatus = "failed";
    expect((await pay.verifyCallback(uid, o.order_id, pid, sign(KEY_SECRET, `${o.order_id}|${pid}`))).ok).toBe(false);
    expect(await access.isPro(uid)).toBe(false);
    // a good one
    paymentStatus = "captured";
    const good = await pay.verifyCallback(uid, o.order_id, pid, sign(KEY_SECRET, `${o.order_id}|${pid}`));
    expect(good.ok).toBe(true);
    expect(await access.isPro(uid)).toBe(true);
    expect(Number((await access.subscription(uid))?.amount_paise)).toBe(19900);
    // repeating the callback, or the webhook arriving later, grants nothing more
    expect((await pay.verifyCallback(uid, o.order_id, pid, sign(KEY_SECRET, `${o.order_id}|${pid}`))).message).toMatch(/already active/);
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: pid, order_id: o.order_id, amount: 19900, currency: "INR", status: "captured" } } } });
    expect(await pay.webhook(body, sign(WEBHOOK_SECRET, body))).toEqual({ status: 200, message: "ok" });
    expect(Number(await db.val("SELECT COUNT(*) FROM studio_subscriptions WHERE user_id = $1 AND source = 'razorpay'", [uid]))).toBe(1);
    if (phpOk) { const p = await phpPro(uid); if (p !== null) expect(p).toBe("y"); }
  });

  it("trusts the webhook only with a valid signature and a matching amount", async () => {
    const o = (await db.all<{ order_id: string }>("SELECT order_id FROM studio_payments WHERE user_id = $1", [uid]))[0];
    const ev = (over: Record<string, unknown>, event = "payment.captured") =>
      JSON.stringify({ event, payload: { payment: { entity: { id: `pay_w_${tag}`, order_id: o.order_id, amount: 19900, currency: "INR", status: "captured", ...over } } } });
    const bad = ev({});
    expect((await pay.webhook(bad, "nope")).status).toBe(400);
    expect((await pay.webhook(bad, "")).status).toBe(400);
    expect(await pay.webhook(ev({}, "payment.failed"), sign(WEBHOOK_SECRET, ev({}, "payment.failed")))).toEqual({ status: 200, message: "ignored" });
    // a fresh unpaid order: wrong amount is a mismatch, and an unknown order falls through to the registered handler
    await db.run("INSERT INTO studio_payments (user_id, order_id, amount_paise, currency, status, receipt) VALUES ($1, $2, 19900, 'INR', 'created', 'r')", [uid, `order_w_${tag}`]);
    const wrong = JSON.stringify({ event: "order.paid", payload: { payment: { entity: { id: `pay_x_${tag}`, order_id: `order_w_${tag}`, amount: 100, currency: "INR", status: "captured" } } } });
    expect(await pay.webhook(wrong, sign(WEBHOOK_SECRET, wrong))).toEqual({ status: 200, message: "mismatch" });
    const unknown = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_u", order_id: "order_unknown", amount: 100, currency: "INR", status: "captured" } } } });
    expect(await pay.webhook(unknown, sign(WEBHOOK_SECRET, unknown))).toEqual({ status: 200, message: "unknown order" });
    pay.setUnknownOrderHandler(async (orderId, paymentId) => ({ status: 200, message: `crm:${orderId}:${paymentId}` }));
    expect(await pay.webhook(unknown, sign(WEBHOOK_SECRET, unknown))).toEqual({ status: 200, message: "crm:order_unknown:pay_u" });
    pay.setUnknownOrderHandler(null);
  });

  it("limits checkout attempts per hour", async () => {
    pay.setHttp(async () => [200, { id: `order_lim_${Math.random()}` }]);
    let refused = false;
    for (let i = 0; i < 8 && !refused; i++) {
      try {
        await pay.createOrder(uid);
      } catch (e) {
        refused = e instanceof pay.PayError && /Too many/.test(e.message);
      }
    }
    expect(refused).toBe(true);
  });
});
