import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, buy, DB, emailOf, mkProduct, mkUser, tag, type Boot } from "./test-setup";

/** What a paid plan gives: its course picks, and how access follows the plan. Uses the real purchase flow with a fake provider. */
describe.skipIf(!DB)("plans: included courses and access", () => {
  let B: Boot;
  let PL: typeof import("./plans");
  let ACC: typeof import("./course-access");
  let STUDIO: typeof import("../studio/access");
  let rzp: InstanceType<typeof import("./test-support").FakeRazorpay>;
  const slugs = [1, 2, 3, 4, 5].map((n) => `t-plan-course-${n}-${tag}`);
  const ids: number[] = [];
  const proSku = `t-plan-pro-${tag}`;
  const silverSku = `t-plan-silver-${tag}`;
  const goldSku = `t-plan-gold-${tag}`;
  const user = async (label: string) => ({ id: await mkUser(B.db, "student", label), email: emailOf(label) });
  const pick = (u: number, i: number) => PL.pickCourse(u, { id: ids[i], slug: slugs[i] });

  beforeAll(async () => {
    B = await boot();
    PL = await import("./plans");
    ACC = await import("./course-access");
    STUDIO = await import("../studio/access");
    rzp = new B.T.FakeRazorpay();
    await mkProduct(B.db, proSku, "plan", "pro", 39900, null, { days: 30 });
    await mkProduct(B.db, silverSku, "plan", "silver", 69900, null, { days: 30 });
    await mkProduct(B.db, goldSku, "plan", "gold", 99900, null, { days: 365 });
    for (const s of slugs) {
      await B.db.run("INSERT IGNORE INTO courses (slug, title, category) VALUES ($1,$2,'digital')", [s, `Plan test course ${s}`]);
      ids.push(Number(await B.db.val<number>("SELECT id FROM courses WHERE slug = $1", [s])));
      await mkProduct(B.db, `course-${s}`, "course", s, 49900, null, { days: null });
    }
  });
  beforeEach(() => B.T.setTestEnv());
  afterAll(async () => { rzp.uninstall(); await B.db.closePool(); });

  it("a free student has no picks and cannot study a paid course", async () => {
    const u = await user("free1");
    expect(await PL.planInfo(u.id)).toBeNull();
    await expect(pick(u.id, 0)).rejects.toMatchObject({ code: "no_plan" });
    expect(await ACC.canStudy(u.id, ids[0], slugs[0])).toBe(false);
    expect(await ACC.canStudy(null, ids[0], slugs[0])).toBe(false);
    expect(await STUDIO.isPro(u.id)).toBe(false);
  });

  it("Pro includes one course; using the pick opens that course, adds it to My courses, and a second pick is refused", async () => {
    const u = await user("pro1");
    await buy(rzp, u.id, u.email, proSku);
    const info = await PL.planInfo(u.id);
    expect(info).toMatchObject({ key: "pro", courseQuota: 1 });
    expect(await STUDIO.isPro(u.id)).toBe(true); // Studio Pro features come with the plan
    expect(await ACC.accessFor(u.id, slugs[0])).toBeNull();
    expect(await pick(u.id, 0)).toBe("picked");
    expect(await ACC.accessFor(u.id, slugs[0])).toBe("plan");
    expect(await B.db.one("SELECT 1 AS x FROM course_enrolments WHERE user_id = $1 AND course_id = $2", [u.id, ids[0]])).not.toBeNull();
    await expect(pick(u.id, 1)).rejects.toMatchObject({ code: "no_picks_left" });
    expect(await ACC.accessFor(u.id, slugs[1])).toBeNull();
    expect(await pick(u.id, 0)).toBe("already"); // repeating is harmless
  });

  it("Silver includes two and Gold four; picks are never more than the plan gives, even when clicked together", async () => {
    const s = await user("silver1");
    await buy(rzp, s.id, s.email, silverSku);
    expect(await Promise.allSettled([pick(s.id, 0), pick(s.id, 1), pick(s.id, 2)]).then((r) => r.filter((x) => x.status === "fulfilled").length)).toBe(2);
    expect((await PL.planCourses(s.id)).picked.length).toBe(2);
    const g = await user("gold1");
    await buy(rzp, g.id, g.email, goldSku);
    for (let i = 0; i < 4; i++) await pick(g.id, i);
    await expect(pick(g.id, 4)).rejects.toMatchObject({ code: "no_picks_left" });
    expect((await PL.openPickSlugs(g.id)).length).toBe(4);
  });

  it("when the plan ends the picked courses lock again but the choice and the progress are kept, and renewing opens them", async () => {
    const u = await user("lapse1");
    await buy(rzp, u.id, u.email, proSku);
    await pick(u.id, 0);
    expect(await ACC.canStudy(u.id, ids[0], slugs[0])).toBe(true);
    await B.db.run("UPDATE pay_entitlements SET expires_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY) WHERE user_id = $1 AND kind = 'plan'", [u.id]);
    expect(await ACC.canStudy(u.id, ids[0], slugs[0])).toBe(false);
    expect(await STUDIO.isPro(u.id)).toBe(false);
    expect(await B.db.one("SELECT 1 AS x FROM course_enrolments WHERE user_id = $1 AND course_id = $2", [u.id, ids[0]])).not.toBeNull();
    await buy(rzp, u.id, u.email, proSku); // renew
    expect(await ACC.canStudy(u.id, ids[0], slugs[0])).toBe(true);
  });

  it("a lower plan keeps only the earliest picks open", async () => {
    const u = await user("down1");
    await buy(rzp, u.id, u.email, goldSku);
    await pick(u.id, 0); await pick(u.id, 1); await pick(u.id, 2);
    await B.db.run("UPDATE pay_entitlements SET expires_at = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 DAY) WHERE user_id = $1 AND kind = 'plan'", [u.id]);
    await buy(rzp, u.id, u.email, proSku);
    expect(await PL.openPickSlugs(u.id)).toEqual([slugs[0]]);
    expect(await ACC.canStudy(u.id, ids[1], slugs[1])).toBe(false);
  });

  it("a course that was bought stays open without the plan, and needs no pick", async () => {
    const u = await user("buyer1");
    await buy(rzp, u.id, u.email, `course-${slugs[3]}`);
    expect(await ACC.accessFor(u.id, slugs[3])).toBe("purchase");
    await buy(rzp, u.id, u.email, proSku);
    expect(await pick(u.id, 3)).toBe("already");
    expect((await PL.planCourses(u.id)).left).toBe(1);
  });

  it("only the highest plan counts when several are held", async () => {
    const u = await user("both1");
    await buy(rzp, u.id, u.email, proSku);
    await buy(rzp, u.id, u.email, goldSku);
    expect((await PL.planInfo(u.id))?.key).toBe("gold");
  });
});
