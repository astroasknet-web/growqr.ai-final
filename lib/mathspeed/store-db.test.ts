import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { boot, DB, emailOf, mkUser, type Boot } from "../pay/test-setup";

/**
 * The studio on a real database: enrolment, the free sample and the paywall, marking on the server, module and level unlocks, revision after a fail,
 * achievements, spaced review, the placement diagnostic, and that one student can never touch another's sessions.
 * Run with PORTAL_TEST_DATABASE_URL=mysql://root@127.0.0.1:3307/growqr_test DATABASE_SSL=disable.
 */
describe.skipIf(!DB)("math speed studio on a real database", () => {
  let B: Boot;
  let S: typeof import("./store");
  let Q: typeof import("./plan");
  let CUR: typeof import("./curriculum");
  let alice = 0, bob = 0, carol = 0, dan = 0;
  let rzp: InstanceType<typeof import("../pay/test-support").FakeRazorpay>;
  const slug = "mathematics-speed-enhancement";

  /** Answer every question of a session correctly (or wrongly), the way a student would type it. */
  const respond = async (userId: number, id: string, how: "right" | "wrong" | "half" | "blank" = "right", ms = 2000) => {
    const stored = (await S.getSession(userId, id))!;
    const qs = Q.questionsOf(stored.plan);
    return qs.map((q, i) => ({ r: how === "blank" ? "" : how === "wrong" || (how === "half" && i % 2) ? "-77777" : q.answer, ms }));
  };
  const play = async (userId: number, kind: Parameters<typeof S.startSession>[1], ref: string, how: "right" | "wrong" | "half" = "right") => {
    const s = await S.startSession(userId, kind, ref);
    if (!s.ok) throw new Error(`${kind} ${ref}: ${s.error}`);
    return (await S.submitSession(userId, s.id, await respond(userId, s.id, how)))!;
  };
  const buyCourse = async (userId: number, label: string) => {
    const P = await import("../pay/orders");
    const C = await import("../pay/checkout");
    const { order, accessToken } = await P.createOrder(P.createOrderSchema.parse({ items: [{ sku: `course-${slug}`, qty: 1 }], country: "IN", billing: { name: label, email: emailOf(label) } }), { userId });
    const started = await C.startCheckout(order.id, { userId, token: accessToken }, { origin: "https://growqr.test", provider: null });
    rzp.pay((started.checkout as { orderId: string }).orderId);
    await C.confirmPayment(order.id, { userId }, {});
    return order;
  };

  beforeAll(async () => {
    B = await boot();
    S = await import("./store");
    Q = await import("./plan");
    CUR = await import("./curriculum");
    const CAT = await import("../pay/catalogue");
    await CAT.seedCatalogue();
    rzp = new B.T.FakeRazorpay();
    alice = await mkUser(B.db, "student", "msalice");
    bob = await mkUser(B.db, "student", "msbob");
    carol = await mkUser(B.db, "student", "mscarol");
    dan = await mkUser(B.db, "student", "msdan");
  });
  beforeEach(() => { B.T.setTestEnv(); rzp.install(); });
  afterAll(async () => { rzp.uninstall(); await B.db.closePool(); });

  it("is sold as a course product with the owner's fee, on the same footing as the catalogue courses", async () => {
    const p = await B.db.one<{ kind: string; active: number; fulfil_ref: string; amount_minor: number }>("SELECT p.kind, p.active, p.fulfil_ref, pr.amount_minor FROM pay_products p JOIN pay_prices pr ON pr.product_id = p.id AND pr.currency = 'INR' WHERE p.sku = $1", [`course-${slug}`]);
    expect(p).not.toBeNull();
    expect(p!.kind).toBe("course");
    expect(p!.fulfil_ref).toBe(slug);
    expect(p!.amount_minor).toBe(59900);
    const ACC = await import("../pay/course-access");
    expect(await ACC.courseGated(slug)).toBe(true);
  });

  it("enrols with safe defaults when the form is tampered with, and re-enrolling only changes the answers", async () => {
    const e = await S.enrol(alice, { language: "klingon", country: "zz", ageBand: "300", pace: "warp" });
    expect(e).toMatchObject({ language: "en", country: "XX", ageBand: "12-15", pace: "regular", startLevel: 1, diagnosticDone: false, xp: 0 });
    const again = await S.enrol(alice, { language: "en", country: "in", ageBand: "16-18", pace: "steady" });
    expect(again).toMatchObject({ country: "IN", ageBand: "16-18", pace: "steady" });
    expect(again.createdAt).toBe(e.createdAt);
    expect(await S.getEnrolment(bob)).toBeNull();
    expect(await S.snapshot(bob)).toBeNull();
  });

  it("cannot start anything before enrolling, and the free sample is only Level A Module 1", async () => {
    const r = await S.startSession(bob, "practice", "A-01");
    expect(r).toMatchObject({ ok: false, code: "enrol" });
    await S.enrol(bob, {});
    expect((await S.startSession(bob, "practice", "A-01")).ok).toBe(true);
    expect((await S.startSession(bob, "drill", "A-01")).ok).toBe(true);
    for (const [kind, ref] of [["practice", "A-02"], ["drill", "B-01"], ["level", "1"], ["review", ""], ["progress", "1"]] as const) {
      const x = await S.startSession(bob, kind, ref);
      expect(x, `${kind} ${ref}`).toMatchObject({ ok: false, code: "pay" });
    }
  });

  it("marks a practice set on the server: only the typed answers count, never a claim of being right", async () => {
    await S.enrol(carol, {});
    const s = await S.startSession(carol, "practice", "A-01");
    if (!s.ok) throw new Error(s.error);
    const stored = (await S.getSession(carol, s.id))!;
    expect(stored.status).toBe("open");
    expect(stored.plan.items).toHaveLength(10);
    // a forged payload with extra fields and the wrong answers gets nothing
    const forged = Q.questionsOf(stored.plan).map(() => ({ r: "0", ms: 1, correct: true, passed: true } as unknown as { r: string; ms: number }));
    const res = (await S.submitSession(carol, s.id, forged))!;
    expect(res.accuracy).toBeLessThan(40);
    expect(res.passed).toBe(false);
    // the second submission of the same session changes nothing and returns the stored result
    const xp = (await S.getEnrolment(carol))!.xp;
    const again = (await S.submitSession(carol, s.id, await respond(carol, s.id, "right")))!;
    expect(again.accuracy).toBe(res.accuracy);
    expect((await S.getEnrolment(carol))!.xp).toBe(xp);
    expect((await S.getSession(carol, s.id))!.status).toBe("submitted");
  });

  it("a student can never read or submit another student's session", async () => {
    const s = await S.startSession(carol, "practice", "A-01");
    if (!s.ok) throw new Error(s.error);
    expect(await S.getSession(dan, s.id)).toBeNull();
    await S.enrol(dan, {});
    expect(await S.submitSession(dan, s.id, [])).toBeNull();
    expect(await S.getSession(carol, "not-an-id")).toBeNull();
    expect(await S.submitSession(carol, "zzzzzzzzzzzzzzzzzzzzzzzz", [])).toBeNull();
  });

  it("a module needs the lessons read as well as the practice passed, and records XP once", async () => {
    await S.enrol(alice, { country: "IN" });
    const first = await play(alice, "practice", "A-01", "right");
    expect(first.accuracy).toBe(100);
    expect(first.events.some((e) => e.type === "module")).toBe(false);
    expect(first.events.some((e) => e.type === "note")).toBe(true);
    await S.markRead(alice, "A-01");
    const second = await play(alice, "practice", "A-01", "right");
    expect(second.events.filter((e) => e.type === "module")).toHaveLength(1);
    const third = await play(alice, "practice", "A-01", "right");
    expect(third.events.some((e) => e.type === "module")).toBe(false);
    const snap = (await S.snapshot(alice))!;
    expect(snap.progress.doneModules.has("A-01")).toBe(true);
    expect(snap.modules.get("A-01")!.attempts).toBe(3);
    expect(snap.enrolment.xp).toBeGreaterThan(50);
    // the skill state moved: attempts counted, difficulty and mastery recorded
    const st = snap.states.get("place-value")!;
    expect(st.attempts).toBe(30);
    expect(st.mastery).toBeGreaterThan(0);
  });

  it("a half-right practice set does not finish the module", async () => {
    await S.enrol(bob, { country: "IN" });
    await S.markRead(bob, "A-01");
    const r = await play(bob, "practice", "A-01", "half");
    expect(r.passed).toBe(false);
    expect((await S.snapshot(bob))!.progress.doneModules.has("A-01")).toBe(false);
  });

  it("a timed drill keeps the clock: answers beyond the time allowed are not counted", async () => {
    const s = await S.startSession(carol, "drill", "A-01");
    if (!s.ok) throw new Error(s.error);
    const stored = (await S.getSession(carol, s.id))!;
    const qs = Q.questionsOf(stored.plan);
    const res = (await S.submitSession(carol, s.id, qs.map((q) => ({ r: q.answer, ms: 4000 }))))!;
    expect(res.total).toBeLessThanOrEqual(16); // 60 s plus 3 s of grace at 4 s per answer
    expect(res.accuracy).toBe(100);
  });

  describe("after buying the course", () => {
    it("opens the paid parts for the buyer only", async () => {
      await buyCourse(alice, "msalice");
      const ok = await S.startSession(alice, "practice", "A-02");
      expect(ok.ok).toBe(true);
      expect(await S.startSession(bob, "practice", "A-02")).toMatchObject({ ok: false, code: "pay" });
    });

    it("walks Level A: modules open in order, the Level Assessment unlocks Level B, and a fail asks for revision first", async () => {
      const lv = CUR.LEVELS[0];
      // a module is not open until the one before it is finished
      expect(await S.startSession(alice, "practice", "A-04")).toMatchObject({ ok: false, code: "gate" });
      for (const m of lv.modules) {
        await S.markRead(alice, m.key);
        const r = await play(alice, "practice", m.key, "right");
        if (m.key !== "A-01") expect(r.events.some((e) => e.type === "module"), m.key).toBe(true);
      }
      let snap = (await S.snapshot(alice))!;
      expect(snap.progress.doneModules.size).toBe(lv.modules.length);
      expect(await S.startSession(alice, "practice", "B-01")).toMatchObject({ ok: false, code: expect.stringMatching(/gate|coming/) }); // Level B is still locked

      // a failing Level Assessment names the weak skills and blocks a straight retake
      const failed = await play(alice, "level", "1", "half");
      expect(failed.passed).toBe(false);
      expect(failed.weak.length).toBeGreaterThan(0);
      snap = (await S.snapshot(alice))!;
      expect(snap.progress.completed.has(1)).toBe(false);
      expect(snap.levels.get(1)!.revisionPending).toBe(true);
      expect(await S.startSession(alice, "level", "1")).toMatchObject({ ok: false, code: "gate" });

      // targeted revision on those skills, not a repeat of the whole level
      const rev = await S.startSession(alice, "revision", "1");
      if (!rev.ok) throw new Error(rev.error);
      const revPlan = (await S.getSession(alice, rev.id))!.plan;
      expect(new Set(revPlan.items.map(([id]) => id))).toEqual(new Set(failed.weak));
      const revDone = (await S.submitSession(alice, rev.id, await respond(alice, rev.id, "right")))!;
      expect(revDone.events.some((e) => e.type === "revision-done")).toBe(true);

      // the retake emphasises the weak skills and, passed, completes the level
      const retake = await S.startSession(alice, "level", "1");
      if (!retake.ok) throw new Error(retake.error);
      const retakePlan = (await S.getSession(alice, retake.id))!.plan;
      for (const w of failed.weak) expect(retakePlan.items.filter(([id]) => id === w).length).toBeGreaterThanOrEqual(3);
      const done = (await S.submitSession(alice, retake.id, await respond(alice, retake.id, "right")))!;
      expect(done.passed).toBe(true);
      expect(done.events.map((e) => e.type)).toEqual(expect.arrayContaining(["level", "achievement"]));
      expect(done.events.find((e) => e.type === "achievement" && e.code === "level-completed")).toBeTruthy();
      snap = (await S.snapshot(alice))!;
      expect(snap.progress.completed.has(1)).toBe(true);
      expect(snap.levels.get(1)!.revisionPending).toBe(false);
      const { frontier, levelStatus } = await import("./rules");
      expect(frontier(snap.progress)).toBe(2);
      expect(levelStatus(2, snap.progress)).toBe("in_progress");
      // the level completed achievement is recorded once
      expect((await S.achievementsOf(alice)).filter((a) => a.code === "level-completed")).toHaveLength(1);
    });

    it("a drill of 20 or more correct answers earns Accuracy Master, once", async () => {
      const s = await S.startSession(alice, "drill", "A-03");
      if (!s.ok) throw new Error(s.error);
      const res = (await S.submitSession(alice, s.id, await respond(alice, s.id, "right", 1500)))!;
      expect(res.total).toBeGreaterThanOrEqual(20);
      const s2 = await S.startSession(alice, "drill", "A-03");
      if (!s2.ok) throw new Error(s2.error);
      const res2 = (await S.submitSession(alice, s2.id, await respond(alice, s2.id, "right", 1500)))!;
      expect(res2.events.some((e) => e.type === "achievement" && e.code === "accuracy-master")).toBe(false);
      // earned once for the level, however many times it is repeated
      expect((await S.achievementsOf(alice)).filter((a) => a.code === "accuracy-master")).toHaveLength(1);
      expect(res.accuracy).toBe(100);
    });

    it("spaced review: nothing is due until a skill is scheduled, then a review moves it to a longer interval", async () => {
      expect(await S.startSession(alice, "review", "daily")).toMatchObject({ ok: false, code: "gate" });
      const states = await S.loadStates(alice);
      const sv = states.get("place-value")!;
      const past = new Date(Date.now() - 2 * 86_400_000).toISOString();
      for (const id of ["place-value", "count-on"]) await S.putStates(alice, new Map([[id, { ...states.get(id)!, masteredAt: past, nextReviewAt: past }]]));
      const r = await S.startSession(alice, "review", "daily");
      if (!r.ok) throw new Error(r.error);
      const plan = (await S.getSession(alice, r.id))!.plan;
      expect(new Set(plan.items.map(([id]) => id))).toEqual(new Set(["place-value", "count-on"]));
      const res = (await S.submitSession(alice, r.id, await respond(alice, r.id, "right")))!;
      expect(res.accuracy).toBe(100);
      const after = (await S.loadStates(alice)).get("place-value")!;
      expect(new Date(after.nextReviewAt!).getTime()).toBeGreaterThan(Date.now());
      expect(after.step).toBeGreaterThanOrEqual(sv.step);
      expect(await S.startSession(alice, "review", "daily")).toMatchObject({ ok: false, code: "gate" });
    });

    it("tracks the days practised for the streak", async () => {
      const days = await S.practiceDays(alice);
      expect(days.length).toBeGreaterThanOrEqual(1);
      expect(days[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("a level that is not written yet cannot be started, and placement never lands on it", async () => {
      const unwritten = CUR.LEVELS.find((l) => !l.authored);
      if (unwritten) {
        const r = await S.startSession(alice, "practice", unwritten.modules[0].key);
        expect(r.ok).toBe(false);
      }
      expect(S.playableLevels()).toBeGreaterThanOrEqual(1);
    });
  });

  describe("the placement diagnostic", () => {
    it("is free, searches within the playable levels, and sets the start level without closing earlier levels", async () => {
      await S.enrol(dan, { country: "IN" });
      const playable = S.playableLevels();
      let guard = 0;
      let last = null as Awaited<ReturnType<typeof S.submitSession>>;
      for (;;) {
        const s = await S.startSession(dan, "diagnostic", "");
        if (!s.ok) throw new Error(s.error);
        last = (await S.submitSession(dan, s.id, await respond(dan, s.id, "right")))!;
        if (last.events.some((e) => e.type === "placement")) break;
        if (++guard > 6) throw new Error("diagnostic did not finish");
      }
      const en = (await S.getEnrolment(dan))!;
      expect(en.diagnosticDone).toBe(true);
      expect(en.startLevel).toBe(Math.max(1, playable));
      const snap = (await S.snapshot(dan))!;
      const { isPlaced, levelStatus } = await import("./rules");
      for (let n = 1; n < en.startLevel; n++) { expect(isPlaced(n, snap.progress)).toBe(true); expect(levelStatus(n, snap.progress)).toBe("completed"); }
      // the placement run left evidence in the skill states
      expect([...snap.states.values()].some((s) => s.attempts > 0)).toBe(true);
      // the check cannot be run a second time by accident
      expect(await S.startSession(dan, "diagnostic", "")).toMatchObject({ ok: false });
      // a student may begin earlier than advised, never later
      expect(await S.chooseStart(dan, 1)).toBe(true);
      expect((await S.getEnrolment(dan))!.startLevel).toBe(1);
      expect(await S.chooseStart(dan, 99)).toBe(true);
      expect((await S.getEnrolment(dan))!.startLevel).toBe(Math.max(1, playable));
    });

    it("a student who fails the first probe is placed at Level A", async () => {
      const eve = await mkUser(B.db, "student", "mseve");
      await S.enrol(eve, {});
      let guard = 0;
      for (;;) {
        const s = await S.startSession(eve, "diagnostic", "");
        if (!s.ok) throw new Error(s.error);
        const res = (await S.submitSession(eve, s.id, await respond(eve, s.id, "wrong")))!;
        if (res.events.some((e) => e.type === "placement")) { expect(res.events.find((e) => e.type === "placement")).toMatchObject({ level: 1 }); break; }
        if (++guard > 6) throw new Error("diagnostic did not finish");
      }
      expect((await S.getEnrolment(eve))!.startLevel).toBe(1);
    });
  });

  it("a student can complete all 15 levels in order, with the Mastery Assessments and the benchmark, and finishes with nothing in progress", async () => {
    const zoe = await mkUser(B.db, "student", "mszoe");
    await buyCourse(zoe, "mszoe");
    await S.enrol(zoe, { country: "GB", ageBand: "19-plus" });
    const { frontier, levelStatus } = await import("./rules");
    for (const lv of CUR.LEVELS) {
      expect(lv.authored, "Level " + lv.letter).toBe(true);
      for (const m of lv.modules) { await S.markRead(zoe, m.key); await play(zoe, "practice", m.key, "right"); }
      const done = await play(zoe, "level", String(lv.n), "right");
      expect(done.passed, "Level " + lv.letter).toBe(true);
      if ([5, 10, 15].includes(lv.n)) expect((await play(zoe, "mastery", String(lv.n), "right")).passed).toBe(true);
    }
    const snap = (await S.snapshot(zoe))!;
    expect(frontier(snap.progress)).toBe(16);
    for (let n = 1; n <= 15; n++) expect(levelStatus(n, snap.progress)).toBe("completed");
    expect(snap.progress.doneModules.size).toBe(CUR.totalModules());
    expect((await S.achievementsOf(zoe)).filter((a) => a.code === "level-completed")).toHaveLength(15);
    const bench = await play(zoe, "benchmark", "O", "right");
    expect(bench.total).toBe(20);
    expect((await S.benchmarks(zoe)).length).toBe(1);
  }, 240_000);

  it("deleting a student removes every studio row", async () => {
    const zed = await mkUser(B.db, "student", "mszed");
    await S.enrol(zed, {});
    const s = await S.startSession(zed, "practice", "A-01");
    if (!s.ok) throw new Error(s.error);
    await S.submitSession(zed, s.id, await respond(zed, s.id, "right"));
    expect(await B.db.val<number>("SELECT COUNT(*) FROM ms_attempts a JOIN ms_sessions s ON s.id = a.session_id WHERE s.user_id = $1", [zed])).toBeGreaterThan(0);
    await B.db.run("DELETE FROM users WHERE id = $1", [zed]);
    for (const t of ["ms_enrolments", "ms_sessions", "ms_skill_state", "ms_activity_days"]) expect(await B.db.val<number>(`SELECT COUNT(*) FROM ${t} WHERE user_id = $1`, [zed]), t).toBe(0);
  });
});
