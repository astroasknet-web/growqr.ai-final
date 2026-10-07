import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Job } from "./jobs";

/**
 * The marketplace on a real database: listing, saving, applying once, the status pipeline with its rule that every rejection
 * needs a reason, and the emails each step queues.
 *
 *   PORTAL_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npx vitest run lib/market/market-db.test.ts
 */
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: async () => new Headers({ "x-forwarded-host": "growqr.test", "x-forwarded-proto": "https" }),
}));
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const DB = process.env.PORTAL_TEST_DATABASE_URL;

describe("listing rules", () => {
  const mk = (o: Partial<Job>): Job => ({
    id: 1, slug: "s", title: "Intern", company: "Co", ini: "C", color: "#000", loc: "Remote", mode: "Remote", cat: "Data & AI", stipend: 10000, weeks: 8, badge: "PPO possible",
    skills: ["SQL"], posted: 2, openings: 1, applicants: 0, deadline: "2099-01-01", resp: null, about: "", do: [], req: [], perks: [], q: "", status: "live", sample: false,
    owner: null, verified: false, days_left: 30, match: null, ...o,
  });
  it("filters, sorts and pages", async () => {
    const L = await import("./listing");
    const jobs = [mk({ id: 1, stipend: 5000, posted: 9, weeks: 16, match: 40 }), mk({ id: 2, stipend: 20000, posted: 1, weeks: 8, badge: "Verified stipend", match: 90 }), mk({ id: 3, stipend: 12000, posted: 3, loc: "Pune", mode: "On-site", weeks: 12, match: 70, days_left: 2 })];
    const run = (qs: Record<string, string | string[]>, st = { isStudent: false, hasProfile: false, savedIds: [] as number[] }) => L.run(jobs, L.parseFilters(qs), st);
    expect(run({}).items.map((j) => j.id)).toEqual([2, 3, 1]); // newest first without a profile
    expect(run({}, { isStudent: true, hasProfile: true, savedIds: [] }).items.map((j) => j.id)).toEqual([2, 3, 1]); // by match
    expect(run({ sort: "stipend" }).items.map((j) => j.id)).toEqual([2, 3, 1]);
    expect(run({ sort: "deadline" }).items[0].id).toBe(3);
    expect(run({ min: "10000" }).items.map((j) => j.id)).toEqual([2, 3]);
    expect(run({ min: "123" }).total).toBe(3); // an unknown value is ignored
    expect(run({ weeks: "12" }).items.map((j) => j.id)).toEqual([2, 3]);
    expect(run({ loc: ["Pune"] }).items.map((j) => j.id)).toEqual([3]);
    expect(run({ mode: "On-site" }).items.map((j) => j.id)).toEqual([3]);
    expect(run({ verified: "1" }).items.map((j) => j.id)).toEqual([2]);
    expect(run({ new: "1" }).items.map((j) => j.id)).toEqual([2, 3]);
    expect(run({ short: "1" }).items.map((j) => j.id)).toEqual([2]);
    expect(run({ saved: "1" }, { isStudent: true, hasProfile: false, savedIds: [3] }).items.map((j) => j.id)).toEqual([3]);
    expect(run({ saved: "1" }).total).toBe(3); // "saved only" means nothing to a visitor
    expect(run({ cat: "Nope" }).total).toBe(3);
    const many = Array.from({ length: 30 }, (_, i) => mk({ id: i + 1, posted: i }));
    const p3 = L.run(many, L.parseFilters({ page: "3" }), { isStudent: false, hasProfile: false, savedIds: [] });
    expect(p3.pages).toBe(3);
    expect(p3.items).toHaveLength(6);
    expect(L.run(many, L.parseFilters({ page: "99" }), { isStudent: false, hasProfile: false, savedIds: [] }).page).toBe(3);
    const f = L.parseFilters({ q: "sql", loc: ["Pune", "Mars"], min: "5000" });
    expect(f.loc).toEqual(["Pune"]);
    expect(L.url(f, "new", { set: { q: "" } })).toBe("/internships?loc=Pune&min=5000");
    expect(L.url(f, "new", { arrayVal: ["loc", "Pune"] })).toBe("/internships?q=sql&min=5000");
  });
});

describe("posting rules", () => {
  it("validates a new role on the server", async () => {
    const R = await import("./post-role");
    const ok = { ...R.EMPTY, title: "Growth Marketing Intern", cat: "Marketing", stipend: "12000", weeks: "8", about: "x".repeat(80), skills: "SEO, Excel, SEO" };
    expect(R.validate(ok)).toEqual({});
    expect(Object.keys(R.validate(R.EMPTY)).sort()).toEqual(["about", "cat", "skills", "stipend", "title", "weeks"]);
    expect(R.validate({ ...ok, stipend: "999" }).stipend).toMatch(/₹1,000.*remote/);
    expect(R.validate({ ...ok, mode: "Hybrid", loc: "", stipend: "1500" })).toMatchObject({ loc: expect.any(String), stipend: expect.stringMatching(/₹2,000/) });
    expect(R.validate({ ...ok, mode: "Hybrid", loc: "Pune", stipend: "2000" })).toEqual({});
    expect(R.validate({ ...ok, weeks: "1" }).weeks).toBeDefined();
    expect(R.validate({ ...ok, weeks: "27" }).weeks).toBeDefined();
    expect(R.validate({ ...ok, openings: "21" }).openings).toBeDefined();
    expect(R.validate({ ...ok, about: "short" }).about).toBeDefined();
    expect(R.validate({ ...ok, skills: " , ," }).skills).toBeDefined();
    expect(R.validate({ ...ok, cat: "Astrology" }).cat).toBeDefined();
    expect(R.validate({ ...ok, mode: "Teleport" }).mode).toBeDefined();
    expect(R.skillList("SEO, Excel, SEO")).toEqual(["SEO", "Excel"]);
    const f = R.readFields((k) => (k === "about" ? "a".repeat(5000) : "  " + k + "  "));
    expect(f.title).toBe("title");
    expect(Array.from(f.about)).toHaveLength(2000);
    expect(R.toNewJob(ok, "Co")).toMatchObject({ stipend: 12000, weeks: 8, openings: 1, skills: ["SEO", "Excel"], company: "Co" });
  });
});

describe.skipIf(!DB)("marketplace on a real database", () => {
  const tag = Math.random().toString(16).slice(2, 8);
  const sEmail = `mk-s-${tag}@portal-test.invalid`;
  const oEmail = `mk-o-${tag}@portal-test.invalid`;
  let sid = 0;
  let oid = 0;
  let db: typeof import("../portal/db");
  let jobs: typeof import("./jobs");
  let apps: typeof import("./applications");
  let saved: typeof import("./saved");
  let jobId = 0;
  let slug = "";

  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.PORTAL_APP_URL = "https://growqr.test";
    delete process.env.RESEND_API_KEY;
    db = await import("../portal/db");
    jobs = await import("./jobs");
    apps = await import("./applications");
    saved = await import("./saved");
    const auth = await import("../portal/auth");
    const s = await auth.register({ role: "student", name: "Market Student", email: sEmail, password: "blue-kettle-orbit-nine", college: "Test College" }, "198.51.100.91");
    const o = await auth.register({ role: "employer", name: "Market Employer", email: oEmail, password: "blue-kettle-orbit-nine", company: "Tag Labs" } as never, "198.51.100.92");
    if (!s.ok) throw new Error(s.error);
    if (!o.ok) throw new Error(o.error);
    sid = s.userId;
    oid = o.userId;
  });

  afterAll(async () => {
    if (!db) return;
    await db.run("DELETE FROM internships WHERE slug LIKE $1", [`%${tag}%`]);
    await db.run("DELETE FROM users WHERE email LIKE $1", [`%${tag}@portal-test.invalid`]);
    await db.run("DELETE FROM mail_outbox WHERE to_email LIKE $1", [`%${tag}@portal-test.invalid`]);
    await db.run("DELETE FROM auth_throttle WHERE bucket IN ('reg:198.51.100.91','reg:198.51.100.92')");
    await db.closePool();
  });

  it("gives the employer a company and creates a pending role, with a unique slug", async () => {
    let co = await jobs.companyOf(oid);
    if (!co) {
      await db.run("INSERT INTO companies (owner_user_id, name, domain, verified, color, is_sample, created_at) VALUES ($1,$2,'',0,'#4338ca',0,NOW())", [oid, `Tag Labs ${tag}`]);
      co = await jobs.companyOf(oid);
    }
    expect(co).not.toBeNull();
    const d = { title: `Data Intern ${tag}`, company: `Tag Labs ${tag}`, cat: "Data & AI", mode: "Remote", loc: "Remote", stipend: 12000, weeks: 8, openings: 2, about: "Work on dashboards.", skills: ["SQL", "Excel"], question: "Why data?" };
    const a = await jobs.create(co!.id, d);
    const b = await jobs.create(co!.id, d);
    jobId = a.id;
    slug = a.slug;
    expect(a.slug).toMatch(new RegExp(tag));
    expect(b.slug).not.toBe(a.slug);
    expect(await jobs.bySlug(a.slug)).toBeNull(); // pending: hidden from the public
    expect((await jobs.bySlug(a.slug, { id: oid, role: "employer" }))?.status).toBe("pending"); // visible to its owner
    expect((await jobs.bySlug(a.slug, { id: sid, role: "student" }))).toBeNull();
    expect((await jobs.pending()).some((j) => j.id === jobId)).toBe(true);
    expect((await jobs.live()).some((j) => j.id === jobId)).toBe(false);
  });

  it("goes live only through setStatus and verifies the company", async () => {
    await jobs.setStatus(jobId, "bogus");
    expect((await jobs.byId(jobId))?.status).toBe("pending");
    await jobs.setStatus(jobId, "live");
    const j = await jobs.byId(jobId);
    expect(j?.status).toBe("live");
    expect(j?.verified).toBe(true);
    expect(j?.skills).toEqual(["SQL", "Excel"]);
    expect(j?.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(j?.days_left).toBeGreaterThan(40);
    expect((await jobs.live()).some((x) => x.id === jobId)).toBe(true);
    await jobs.setBadge(jobId, "Verified stipend");
    await jobs.setBadge(jobId, "Made up");
    expect((await jobs.byId(jobId))?.badge).toBe("Verified stipend");
  });

  it("saves and unsaves, only live roles", async () => {
    expect(await saved.toggle(sid, jobId)).toBe(true);
    expect(await saved.ids(sid)).toContain(jobId);
    expect(await saved.toggle(sid, jobId)).toBe(false);
    expect(await saved.ids(sid)).not.toContain(jobId);
    expect(await saved.toggle(sid, 2147483000)).toBe(false); // no such role
  });

  it("accepts one application per student and queues both emails", async () => {
    const id = await apps.apply(jobId, sid, { note: "n".repeat(60), answer: "a".repeat(30), phone: "+91 9876543210", avail: "immediate", match: 80 });
    expect(id).not.toBeNull();
    expect(await apps.apply(jobId, sid, { note: "x", answer: "y", phone: "1", avail: "immediate" })).toBeNull();
    expect((await apps.existing(jobId, sid))?.status).toBe("Applied");
    expect(await apps.appliedJobIds(sid)).toContain(jobId);
    const mail = await db.all<{ to_email: string; kind: string }>("SELECT to_email, kind FROM mail_outbox WHERE to_email IN ($1,$2)", [sEmail, oEmail]);
    expect(mail.some((m) => m.to_email === sEmail && m.kind === "application_sent")).toBe(true);
    expect(mail.some((m) => m.to_email === oEmail && m.kind === "new_applicant")).toBe(true);
    const mine = await apps.forStudent(sid);
    expect(mine[0]).toMatchObject({ status: "Applied", slug, last_note: "Application submitted" });
    expect((await apps.forJob(jobId)).map((a) => a.student_id)).toEqual([sid]);
    expect((await jobs.byId(jobId))?.applicants).toBe(1);
    expect((await apps.counts(oid)).total_apps).toBe(1);
    const owned = await apps.withOwner(id!);
    expect(owned?.owner_user_id).toBe(oid);
  });

  it("moves applications through the pipeline; a rejection needs a reason", async () => {
    const appId = (await apps.existing(jobId, sid))!.id;
    await apps.markViewed(appId, oid);
    expect((await apps.existing(jobId, sid))?.status).toBe("Viewed");
    await apps.markViewed(appId, oid); // only once
    expect(await apps.move(appId, "Rejected", "   ", oid)).toBe(false);
    expect(await apps.move(appId, "Nonsense", "x", oid)).toBe(false);
    expect((await apps.existing(jobId, sid))?.status).toBe("Viewed");
    expect(await apps.move(appId, "Shortlisted", "", oid)).toBe(true);
    expect(await apps.move(appId, "Rejected", "Looking for more experience.", oid)).toBe(true);
    const ev = await apps.events(appId);
    expect(ev.map((e) => e.status)).toEqual(["Rejected", "Shortlisted", "Viewed", "Applied"]);
    expect(ev[1].note).toBe("Moved to Shortlisted");
    const rejected = await db.one<{ html: string; text_body: string }>("SELECT html, text_body FROM mail_outbox WHERE to_email = $1 AND kind = 'status_rejected'", [sEmail]);
    expect(rejected?.text_body).toContain("Looking for more experience.");
    expect(await db.val("SELECT COUNT(*) FROM mail_outbox WHERE to_email = $1 AND kind = 'status_viewed'", [sEmail])).toBe(0); // Viewed is not emailed
  });
});
