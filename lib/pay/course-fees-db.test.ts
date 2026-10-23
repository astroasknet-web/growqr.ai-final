import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import catalogue from "../market/data/courses.json";
import { boot, DB, emailOf, mkUser, tag, type Boot } from "./test-setup";
import { COURSE_FEE_RUPEES, EXAM_PRODUCTS } from "./course-fees";

/** The owner's course fees: seeding, which courses are on sale, and who may study a priced course. */
const cats = (catalogue as unknown as { categories: Record<string, { name: string }> }).categories;
const list = (catalogue as unknown as { courses: Array<{ slug: string; cat: string }> }).courses;

describe("course fee table", () => {
  it("has a fee for every category in the catalogue", () => {
    for (const c of list) expect(COURSE_FEE_RUPEES[cats[c.cat].name], c.slug).toBeGreaterThan(0);
  });
  it("matches the fees the owner gave", () => {
    expect(COURSE_FEE_RUPEES["Blockchain & Web3"]).toBe(799);
    expect(COURSE_FEE_RUPEES["Digital Safety & Life Skills"]).toBe(299);
    expect(EXAM_PRODUCTS.map((e) => [e.sku, e.rupees])).toEqual([["imo-all-classes", 499], ["exam-jee", 699], ["exam-neet", 699], ["ielts-prep", 799], ["writing-studio", 499]]);
  });
});

describe.skipIf(!DB)("course fees on a real database", () => {
  let B: Boot;
  let CAT: typeof import("./catalogue");
  let ACC: typeof import("./course-access");
  let P: typeof import("./orders");
  let C: typeof import("./checkout");
  let rzp: InstanceType<typeof import("./test-support").FakeRazorpay>;
  let alice = 0, bob = 0, courseId = 0;
  const slug = "digital-literacy-master"; // a course with lessons on GrowQR

  beforeAll(async () => {
    B = await boot();
    CAT = await import("./catalogue");
    ACC = await import("./course-access");
    P = await import("./orders");
    C = await import("./checkout");
    rzp = new B.T.FakeRazorpay();
    alice = await mkUser(B.db, "student", "alice");
    bob = await mkUser(B.db, "student", "bob");
    await B.db.run("INSERT IGNORE INTO courses (slug, title, category) VALUES ($1,'Digital Literacy Master','digital')", [slug]);
    courseId = Number(await B.db.val<number>("SELECT id FROM courses WHERE slug = $1", [slug]));
    await CAT.seedCatalogue();
  });
  beforeEach(() => { B.T.setTestEnv(); rzp.install(); });
  afterAll(async () => { rzp.uninstall(); await B.db.closePool(); });

  it("creates one product per course at its category fee, and only courses with lessons are on sale", async () => {
    const rows = await B.db.all<{ sku: string; active: number; amount_minor: number }>("SELECT p.sku, p.active, pr.amount_minor FROM pay_products p JOIN pay_prices pr ON pr.product_id = p.id AND pr.currency = 'INR' WHERE p.sku LIKE 'course-%' AND p.kind = 'course' AND p.sku NOT LIKE 'course-t-%'");
    const mine = rows.filter((r) => list.some((c) => `course-${c.slug}` === r.sku));
    expect(mine.length).toBe(list.length);
    const first = list[0];
    expect(mine.find((r) => r.sku === `course-${first.slug}`)?.amount_minor).toBe(COURSE_FEE_RUPEES[cats[first.cat].name] * 100);
    const { nativeSlugs } = await import("../market/lessons");
    for (const r of mine) expect(Boolean(r.active), r.sku).toBe(nativeSlugs().includes(r.sku.slice(7)));
    const exams = await B.db.all<{ sku: string; active: number }>("SELECT sku, active FROM pay_products WHERE sku IN ('imo-all-classes','exam-jee','exam-neet','ielts-prep','writing-studio')");
    expect(exams).toHaveLength(5);
    expect(exams.every((e) => !e.active)).toBe(true);
  });

  it("does not overwrite a price that was changed in the console when seeding runs again", async () => {
    await B.db.run("UPDATE pay_prices SET amount_minor = 12300 WHERE product_id = (SELECT id FROM pay_products WHERE sku = $1) AND currency = 'INR'", [`course-${slug}`]);
    await CAT.seedCatalogue();
    expect((await ACC.courseFee(slug))?.amountMinor).toBe(12300);
    await B.db.run("UPDATE pay_prices SET amount_minor = 39900 WHERE product_id = (SELECT id FROM pay_products WHERE sku = $1) AND currency = 'INR'", [`course-${slug}`]);
  });

  it("locks a priced course until it is paid for, then opens it, and a full refund closes it again", async () => {
    expect(await ACC.canStudy(null, courseId, slug)).toBe(false);
    expect(await ACC.canStudy(alice, courseId, slug)).toBe(false);
    const { order, accessToken } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku: `course-${slug}`, qty: 1 }], country: "IN", billing: { name: "Alice", email: emailOf("alice") } }), { userId: alice });
    expect(order.totalMinor).toBe(39900);
    const started = await C.startCheckout(order.id, { userId: alice, token: accessToken }, { origin: "https://growqr.test", provider: null });
    const rz = (started.checkout as { orderId: string }).orderId;
    rzp.pay(rz);
    await C.confirmPayment(order.id, { userId: alice }, {});
    expect(await ACC.canStudy(alice, courseId, slug)).toBe(true);
    expect(await B.db.one("SELECT 1 AS x FROM course_enrolments WHERE user_id = $1 AND course_id = $2", [alice, courseId])).not.toBeNull();
    expect(await ACC.canStudy(bob, courseId, slug)).toBe(false); // someone else's payment opens nothing for them
    const { requestRefund } = await import("./refunds");
    const staff = await mkUser(B.db, "admin", "fin");
    await requestRefund({ orderPublicId: order.id, reason: "test refund", staffUserId: staff, idempotencyKey: `rf-${tag}-course` });
    const W = await import("./webhooks");
    for (const rf of rzp.refunds.values()) { rzp.processRefund(rf.id); const h = rzp.webhook("refund.processed", { refund: { entity: rf } }, `evt_${tag}_cf`); await W.receiveWebhook("razorpay", h.raw, h.headers); }
    expect(await ACC.canStudy(alice, courseId, slug)).toBe(false);
  });

  it("keeps access for people who were already enrolled before the course had a fee", async () => {
    await B.db.run("INSERT IGNORE INTO course_enrolments (user_id, course_id, status, done_json, progress, started_at, updated_at) VALUES ($1,$2,'enrolled','[]',0,NOW(),NOW())", [bob, courseId]);
    expect(await ACC.canStudy(bob, courseId, slug)).toBe(true);
  });

  it("leaves a course with no fee free", async () => {
    expect(await ACC.canStudy(null, 1, "a-course-nobody-priced")).toBe(true);
  });
});
