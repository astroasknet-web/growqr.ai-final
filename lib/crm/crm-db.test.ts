import { createHmac } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * The Overseas CRM on a real database: access levels, the lead pipeline and its rules, applications, the student's path, documents,
 * student-paid third-party verification, payments (desk and Razorpay, with Razorpay mocked) and the management reports.
 *
 *   PORTAL_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:54329/postgres npx vitest run lib/crm/crm-db.test.ts
 */
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
  headers: async () => new Headers({ "x-forwarded-host": "growqr.test", "x-forwarded-proto": "https" }),
}));
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const DB = process.env.PORTAL_TEST_DATABASE_URL;
const PDF = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF");
/** A phone number no other lead in the database has: ten digits derived from the run tag. */
const uniq = (tag: string, n = 0): string => "9" + String((parseInt(tag, 16) % 100000000) + n).padStart(9, "0").slice(-9);
const KEY_SECRET = "crm-key-secret";
const sign = (data: string) => createHmac("sha256", KEY_SECRET).update(data).digest("hex");

describe.skipIf(!DB)("overseas CRM on a real database", () => {
  const tag = Math.random().toString(16).slice(2, 8);
  let admin = 0;
  let mgr = 0;
  let agentA = 0;
  let agentB = 0;
  let student = 0;
  let db: typeof import("../portal/db");
  let AC: typeof import("./access");
  let LD: typeof import("./leads");
  let PT: typeof import("./path");
  let DC: typeof import("./docs");
  let VF: typeof import("./verify");
  let MN: typeof import("./money");
  let VP: typeof import("./verify-pay");
  let RP: typeof import("./reports");
  let PAY: typeof import("../studio/pay");
  let leadId = 0;
  let token = "";
  const mkUser = async (role: string, label: string) => {
    const id = await db.val<number>("INSERT INTO users (role, email, password_hash, name, email_verified_at, created_at) VALUES ($1,$2,'x',$3,NOW(),NOW()) RETURNING id", [role, `crm-${label}-${tag}@portal-test.invalid`, `Crm ${label} ${tag}`]);
    return Number(id);
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.PORTAL_APP_URL = "https://growqr.test";
    process.env.STORAGE_DIR = path.join(process.env.TEMP ?? "/tmp", `crm-test-${tag}`);
    process.env.RAZORPAY_KEY_ID = "rzp_test_crm";
    process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
    process.env.CRM_VERIFY_PER_DOC_INR = "750";
    process.env.CRM_VERIFY_BASE_INR = "250";
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    db = await import("../portal/db");
    AC = await import("./access");
    LD = await import("./leads");
    PT = await import("./path");
    DC = await import("./docs");
    VF = await import("./verify");
    MN = await import("./money");
    VP = await import("./verify-pay");
    RP = await import("./reports");
    PAY = await import("../studio/pay");
    admin = await mkUser("admin", "admin");
    mgr = await mkUser("counselor", "mgr");
    agentA = await mkUser("counselor", "agentA");
    agentB = await mkUser("counselor", "agentB");
    student = await mkUser("student", "student");
  });

  afterAll(async () => {
    if (!db) return;
    PAY?.setHttp(null);
    await db.run("DELETE FROM crm_leads WHERE name LIKE $1", [`%${tag}%`]);
    await db.run("DELETE FROM users WHERE email LIKE $1", [`%${tag}@portal-test.invalid`]);
    await db.run("DELETE FROM sa_audit WHERE detail LIKE $1 OR actor_user_id IN ($2,$3)", [`%${tag}%`, admin, mgr]);
    await db.closePool();
  });

  it("gives access by level; only staff accounts can be granted it", async () => {
    expect(await AC.levelOf(null)).toBeNull();
    expect(await AC.levelOf({ id: admin, role: "admin" })).toBe("admin");
    expect(await AC.levelOf({ id: student, role: "student" })).toBeNull();
    expect(await AC.levelOf({ id: agentA, role: "counselor" })).toBeNull(); // no row yet
    expect(await AC.grant(student, "agent", admin)).toMatch(/Only staff/);
    expect(await AC.grant(admin, "agent", admin)).toMatch(/already have full access/);
    expect(await AC.grant(2147483000, "agent", admin)).toBe("No such account.");
    expect(await AC.grant(agentA, "agent", admin)).toBeNull();
    expect(await AC.grant(agentB, "agent", admin)).toBeNull();
    expect(await AC.grant(mgr, "manager", admin)).toBeNull();
    expect(await AC.levelOf({ id: agentA, role: "counselor" })).toBe("agent");
    expect(await AC.isManager({ id: mgr, role: "counselor" })).toBe(true);
    expect(await AC.isManager({ id: agentA, role: "counselor" })).toBe(false);
    expect((await AC.staff()).some((s) => s.id === agentA)).toBe(true);
    expect((await AC.members()).length).toBeGreaterThanOrEqual(3);
  });

  it("creates staff logins with a strong password and a new email", async () => {
    expect(await AC.createStaff("", "a@b.co", "long-enough-password", "agent", admin)).toMatch(/name/);
    expect(await AC.createStaff("Zed " + tag, "bad", "long-enough-password", "agent", admin)).toMatch(/valid email/);
    expect(await AC.createStaff("Zed " + tag, `zed-${tag}@portal-test.invalid`, "short", "agent", admin)).toMatch(/12 characters/);
    expect(await AC.createStaff("Zed " + tag, `zed-${tag}@portal-test.invalid`, "long-enough-password", "manager", admin)).toBeNull();
    expect(await AC.createStaff("Zed " + tag, `zed-${tag}@portal-test.invalid`, "long-enough-password", "manager", admin)).toMatch(/already exists/);
    const u = await db.one<{ id: number; role: string; password_hash: string }>("SELECT id, role, password_hash FROM users WHERE email = $1", [`zed-${tag}@portal-test.invalid`]);
    expect(u?.role).toBe("counselor");
    expect(u?.password_hash).toMatch(/^\$2[aby]\$/);
    expect(await AC.levelOf({ id: u!.id, role: "counselor" })).toBe("manager");
  });

  it("creates leads, spots duplicates by the last 10 digits, and validates", async () => {
    const A = { id: agentA, role: "counselor" };
    expect((await LD.create({ name: "", phone: "1" }, agentA))[1]).toMatch(/name/);
    expect((await LD.create({ name: "X " + tag }, agentA))[1]).toMatch(/phone number or an email/);
    expect((await LD.create({ name: "X " + tag, email: "nope" }, agentA))[1]).toMatch(/email address/);
    const [id, err] = await LD.create({ name: "Riya " + tag, phone: "+91 " + uniq(tag).replace(/^(d{5})(d{5})$/, "$1-$2"), email: `Riya-${tag}@Portal-Test.Invalid`, source: "walk_in", pref_country: "UK", percentage: "74.5", budget_inr: "Rs 25,00,000", consent: "1" }, agentA);
    expect(err).toBeNull();
    leadId = id!;
    const l = (await LD.find(leadId))!;
    expect(l).toMatchObject({ phone: "+91" + uniq(tag), email: `riya-${tag}@portal-test.invalid`, stage: "new", counsellor_id: agentA, percentage: 74.5, budget_inr: 2500000 });
    expect(l.access_token).toMatch(/^[a-f0-9]{32}$/);
    expect(l.consent_at).not.toBeNull();
    token = l.access_token;
    const [, dupErr, dup] = await LD.create({ name: "Riya again " + tag, phone: "0" + uniq(tag) }, agentA); // same last 10 digits
    expect(dupErr).toMatch(/existing lead/);
    expect(dup?.id).toBe(leadId);
    expect((await LD.create({ name: "Riya again " + tag, email: `riya-${tag}@portal-test.invalid` }, agentA))[2]?.id).toBe(leadId);
    expect((await LD.create({ name: "Riya forced " + tag, phone: "0" + uniq(tag), force: "1" }, agentA, false))[0]).not.toBeNull();
    expect((await LD.findByToken(token))?.id).toBe(leadId);
    expect(await LD.findByToken("zz")).toBeNull();
    expect(await LD.canEdit(A, l)).toBe(true);
    expect(await LD.canEdit({ id: agentB, role: "counselor" }, l)).toBe(false);
    expect(await LD.canView({ id: agentB, role: "counselor" }, l)).toBe(false);
    expect(await LD.canView({ id: mgr, role: "counselor" }, l)).toBe(true);
  });

  it("scopes what agents see: their own leads plus the unassigned pool", async () => {
    const pool = (await LD.create({ name: "Pool " + tag, phone: uniq(tag, 1) }, agentB, false))[0]!;
    const mine = (await LD.search({ id: agentA, role: "counselor" }, { q: tag })).rows.map((r) => r.id);
    expect(mine).toContain(leadId);
    expect(mine).toContain(pool);
    const theirs = (await LD.search({ id: agentB, role: "counselor" }, { q: tag })).rows.map((r) => r.id);
    expect(theirs).not.toContain(leadId); // someone else's
    expect(theirs).toContain(pool);
    const all = (await LD.search({ id: mgr, role: "counselor" }, { q: tag })).rows.map((r) => r.id);
    expect(all).toEqual(expect.arrayContaining([leadId, pool]));
    expect((await LD.search({ id: mgr, role: "counselor" }, { q: tag, counsellor: "none" })).rows.map((r) => r.id)).toContain(pool);
    expect((await LD.search({ id: mgr, role: "counselor" }, { q: "50%_" + tag })).total).toBe(0); // wildcards are escaped
    expect((await LD.stageCounts({ id: mgr, role: "counselor" })).new).toBeGreaterThanOrEqual(2);
    expect((await LD.stageCounts({ id: agentB, role: "counselor" })).new).toBeGreaterThanOrEqual(1);
  });

  it("enforces pipeline rules and lifts the stage from applications and deposits", async () => {
    expect(await LD.move(leadId, "nonsense", agentA)).toBe("Unknown lead or stage.");
    expect(await LD.move(leadId, "lost", agentA, " ")).toBe("Choose why this lead was lost.");
    expect(await LD.move(leadId, "enrolled", agentA)).toMatch(/application with an offer/);
    expect(await LD.move(leadId, "contacted", agentA, "Called, interested")).toBeNull();
    expect(await LD.move(leadId, "contacted", agentA)).toBeNull(); // no change
    expect(await LD.addApplication(leadId, { university: "" }, agentA)).toBe("Enter the university name.");
    expect(await LD.addApplication(leadId, { university: "University of Leeds", country: "UK", program: "MSc Data Science", intake: "Sep 2027" }, agentA)).toBeNull();
    const app = (await LD.applications(leadId))[0];
    expect(await LD.setApplication(app.id, "bogus", "", agentA)).toBe("Unknown application.");
    expect(await LD.setApplication(app.id, "submitted", "", agentA)).toBeNull();
    expect((await LD.find(leadId))?.stage).toBe("app_submitted");
    expect(await LD.setApplication(app.id, "offer", "conditional", agentA)).toBeNull();
    expect((await LD.find(leadId))?.stage).toBe("offer");
    expect((await LD.applications(leadId))[0]).toMatchObject({ status: "offer", offer_type: "conditional" });
    expect(await LD.setApplication(app.id, "submitted", "", agentA)).toBeNull();
    expect((await LD.find(leadId))?.stage).toBe("offer"); // never lowered
    await LD.setApplication(app.id, "offer", "conditional", agentA);
    expect(await MN.add(leadId, "verification", 100, "due", null, "", "", "", agentA)).toMatch(/created automatically/);
    expect(await MN.add(leadId, "deposit", 0, "due", null, "", "", "", agentA)).toMatch(/amount in rupees/);
    expect(await MN.add(leadId, "deposit", 50000, "received", null, "upi", "UTR1", "", agentA)).toBeNull();
    expect((await LD.find(leadId))?.stage).toBe("deposit_paid");
    expect(await LD.move(leadId, "enrolled", agentA)).toBeNull(); // an offer exists now
    expect((await LD.find(leadId))?.enrolled_at).not.toBeNull();
    expect(await LD.move(leadId, "lost", agentA, "Budget")).toBeNull();
    expect(await LD.find(leadId)).toMatchObject({ stage: "lost", lost_reason: "Budget", enrolled_at: null });
    expect(await LD.move(leadId, "interested", agentA)).toBeNull();
    expect((await LD.find(leadId))?.lost_reason).toBe("");
  });

  it("logs activities, sets follow-ups and tasks, and lets only the right people finish a task", async () => {
    await LD.log(leadId, agentA, "call", "Spoke to the student");
    expect((await LD.find(leadId))?.last_contact_at).not.toBeNull();
    await LD.setFollowup(leadId, "2026-10-01T10:30");
    expect(String((await LD.find(leadId))?.next_followup_at).slice(0, 16)).toBe("2026-10-01 10:30");
    expect((await LD.search({ id: mgr, role: "counselor" }, { q: tag, due: "overdue" })).rows.map((r) => r.id)).toContain(leadId);
    await LD.setFollowup(leadId, null);
    expect((await LD.find(leadId))?.next_followup_at).toBeNull();
    await LD.addTask(leadId, agentA, "  Send the offer checklist  ", "2026-11-03T09:00");
    await LD.addTask(leadId, agentA, "No date given", "garbage");
    const tasks = await LD.tasks(leadId);
    expect(tasks).toHaveLength(2);
    const offer = tasks.find((x) => x.title === "Send the offer checklist")!;
    expect(offer).toBeDefined();
    expect(tasks.find((x) => x.title === "No date given")?.due_at).toBeDefined(); // a bad date falls back to tomorrow
    await LD.completeTask(offer.id, { id: agentB, role: "counselor" }); // not theirs
    expect((await LD.tasks(leadId)).find((x) => x.id === offer.id)?.done_at).toBeNull();
    await LD.completeTask(offer.id, { id: agentA, role: "counselor" });
    expect((await LD.tasks(leadId)).find((x) => x.id === offer.id)?.done_at).not.toBeNull();
    expect((await LD.activities(leadId)).map((a) => a.kind)).toContain("call");
    await LD.assign(leadId, null, mgr);
    expect((await LD.find(leadId))?.counsellor_id).toBeNull();
    await LD.assign(leadId, agentA, mgr);
    await LD.update(leadId, { name: "Riya Sharma " + tag, phone: uniq(tag).slice(0, 5) + " " + uniq(tag).slice(5), email: "bad", percentage: "150", budget_inr: "" }, agentA);
    expect(await LD.find(leadId)).toMatchObject({ name: "Riya Sharma " + tag, email: "", percentage: 100, budget_inr: null });
  });

  it("tracks the student's path and its progress", async () => {
    const ms = await PT.forLead(leadId);
    expect(Object.keys(ms)).toEqual(Object.keys(PT.KINDS));
    expect(PT.progress(ms)).toBe(0);
    expect(await PT.save(leadId, "nope", {}, agentA)).toBe("Unknown step.");
    expect(await PT.save(leadId, "ielts", { status: "certified", exam_date: "2026-09-01", score: "7.5", detail: "L8 R8 W7 S7", target_date: "garbage" }, agentA)).toBeNull();
    expect(await PT.save(leadId, "community_service", { status: "completed", detail: "Helping Hands NGO, 80 hours" }, agentA)).toBeNull();
    const after = await PT.forLead(leadId);
    expect(after.ielts).toMatchObject({ status: "certified", score: "7.5", exam_date: "2026-09-01", target_date: null });
    // 1 English slot + (internship, community_service, sop, lor, financials, passport) = 7 slots; SAT/ACT/GRE/GMAT are skipped until started
    expect(PT.progress(after)).toBe(Math.round((2 / 7) * 100));
    await PT.save(leadId, "sat", { status: "in_progress" }, agentA);
    expect(PT.progress(await PT.forLead(leadId))).toBe(Math.round((2 / 8) * 100));
    expect(PT.progress({ ielts: { status: "completed" }, toefl: { status: "completed" }, pte: null, duolingo: null, sat: null, act: null, gre: null, gmat: null, internship: null, community_service: null, sop: null, lor: null, financials: null, passport: null })).toBe(Math.round((1 / 7) * 100));
  });

  it("stores documents safely and protects those in verification", async () => {
    const f = (name: string, bytes: Uint8Array) => ({ name, size: bytes.length, bytes });
    expect(await DC.upload(leadId, "nope", f("a.pdf", PDF), null)).toBe("Choose a document type.");
    expect(await DC.upload(leadId, "passport", f("a.exe", PDF), null)).toMatch(/PDF, JPG, PNG or DOCX/);
    expect(await DC.upload(leadId, "passport", f("a.pdf", new TextEncoder().encode("MZ nope")), null)).toMatch(/PDF, JPG, PNG or DOCX/);
    expect(await DC.upload(leadId, "passport", { name: "big.pdf", size: DC.MAX_BYTES + 1, bytes: PDF }, null)).toMatch(/too large/);
    expect(await DC.upload(leadId, "passport", f("evil.pdf", new TextEncoder().encode("%PDF-1.4 /JavaScript (x)")), null)).toMatch(/security check/);
    for (const [t, n] of [["passport", "Passport.pdf"], ["transcripts", "Marksheet.pdf"], ["sop", "SOP.pdf"], ["english_test", "IELTS.pdf"]] as const) expect(typeof (await DC.upload(leadId, t, f(n, PDF), agentA))).toBe("number");
    const list = await DC.forLead(leadId);
    expect(list).toHaveLength(4);
    expect(list[0].stored_name).toMatch(/^crm-[0-9a-f]{40}\.pdf$/);
    expect((await DC.bytes(list[0]))?.length).toBe(PDF.length);
    expect(await DC.remove(list.find((d) => d.doc_type === "sop")!.id)).toBe(true);
    expect(await DC.remove(2147483000)).toBe(false);
  });

  it("runs a student-paid verification: nothing reaches the partner before payment", async () => {
    const sub = await VF.submittable(leadId);
    expect(sub.map((d) => d.doc_type).sort()).toEqual(["english_test", "passport", "transcripts"]);
    expect(VF.fee(3)).toBe(250 + 750 * 3);
    expect((await VF.request(leadId, [], "student"))[1]).toMatch(/at least one/);
    expect((await VF.request(leadId, [2147483000], "student"))[1]).toMatch(/at least one/);
    const ids = sub.map((d) => d.id);
    const [vid, err] = await VF.request(leadId, ids, "student");
    expect(err).toBeNull();
    const v = (await VF.find(vid!))!;
    expect(v).toMatchObject({ status: "awaiting_payment", fee_inr: 2500, requested_by: "student" });
    expect((await DC.find(ids[0]))?.status).toBe("in_verification");
    expect(await DC.remove(ids[0])).toBe(false); // protected while in verification
    expect((await VF.request(leadId, ids, "student"))[1]).toMatch(/at least one/); // those documents are already in a live case
    const extra = (await DC.upload(leadId, "financial", { name: "Bank.pdf", size: PDF.length, bytes: PDF }, agentA)) as number;
    expect((await VF.request(leadId, [extra], "student"))[1]).toMatch(/already a verification waiting/);
    await DC.remove(extra);
    const items = await VF.items(vid!);
    expect(await VF.recordResult(items[0].id, "verified", "", agentA)).toMatch(/has not paid yet/);
    expect(await VF.setCase(vid!, "Partner Co", "REF-1")).toBeUndefined();
    const due = (await MN.forLead(leadId)).find((p) => p.kind === "verification")!;
    expect(due).toMatchObject({ status: "due", amount_inr: 2500, verification_id: vid });
    expect(await MN.receive(due.id, "cash", "RCPT-9", agentA)).toBeNull(); // paid at the desk
    expect(await MN.receive(due.id, "cash", "", agentA)).toMatch(/not waiting/);
    expect(await VF.find(vid!)).toMatchObject({ status: "in_progress", provider: "Partner Co" });
    expect(await VF.markPaid(vid!, agentA, "again")).toBe(false); // idempotent
    expect(await VF.recordResult(items[0].id, "pending", "", agentA)).toBe("Choose a result.");
    expect(await VF.recordResult(items[0].id, "verified", "Matches issuer", agentA)).toBeNull();
    expect(await VF.recordResult(items[1].id, "mismatch", "Name differs", agentA)).toBeNull();
    expect((await VF.find(vid!))?.status).toBe("in_progress");
    expect(await VF.recordResult(items[2].id, "verified", "", agentA)).toBeNull();
    expect((await VF.find(vid!))?.status).toBe("discrepancy");
    expect(await VF.allClear(leadId)).toBe(false);
    expect(await VF.recordResult(items[0].id, "verified", "", agentA)).toBe("This case is already closed.");
    expect((await DC.find(items[1].document_id))?.status).toBe("rejected");
    expect(await VF.cancel(vid!, agentA)).toMatch(/still awaiting payment/);
  });

  it("cancels an unpaid verification and waives its fee", async () => {
    const docs = (await VF.submittable(leadId)).map((d) => d.id);
    const [vid] = await VF.request(leadId, docs, "staff", agentA);
    expect(vid).not.toBeNull();
    expect(await VF.cancel(vid!, agentA)).toBeNull();
    expect((await VF.find(vid!))?.status).toBe("cancelled");
    expect((await MN.forLead(leadId)).find((p) => p.verification_id === vid)?.status).toBe("waived");
    expect((await DC.find(docs[0]))?.status).toBe("uploaded");
  });

  it("takes the verification fee online once, with Razorpay mocked", async () => {
    const docs = (await VF.submittable(leadId)).map((d) => d.id).slice(0, 2);
    const [vid] = await VF.request(leadId, docs, "student");
    expect(vid).not.toBeNull();
    const paise = VF.fee(docs.length) * 100;
    let status = "captured";
    PAY.setHttp(async (method, p) => {
      if (method === "POST" && p === "/orders") return [200, { id: `order_crm_${tag}` }];
      if (method === "GET" && p.startsWith("/payments/")) return [200, { order_id: `order_crm_${tag}`, amount: paise, currency: "INR", status }];
      return [404, {}];
    });
    const o = await VP.createOrder(vid!);
    expect(o).toMatchObject({ order_id: `order_crm_${tag}`, amount: paise, currency: "INR", key: "rzp_test_crm" });
    const pid = `pay_crm_${tag}`;
    expect((await VP.verifyCallback(leadId, o.order_id, pid, "bad")).ok).toBe(false);
    expect((await VP.verifyCallback(leadId + 99999, o.order_id, pid, sign(`${o.order_id}|${pid}`))).ok).toBe(false); // another lead's order
    status = "failed";
    expect((await VP.verifyCallback(leadId, o.order_id, pid, sign(`${o.order_id}|${pid}`))).ok).toBe(false);
    expect((await VF.find(vid!))?.status).toBe("awaiting_payment");
    status = "captured";
    expect((await VP.verifyCallback(leadId, o.order_id, pid, sign(`${o.order_id}|${pid}`))).ok).toBe(true);
    expect((await VF.find(vid!))?.status).toBe("in_progress");
    expect((await VP.verifyCallback(leadId, o.order_id, pid, sign(`${o.order_id}|${pid}`))).message).toMatch(/already received/);
    expect((await MN.forLead(leadId)).find((p) => p.order_id === o.order_id)).toMatchObject({ status: "received", method: "razorpay", payment_id: pid });
    // a later webhook for the same order does nothing more
    expect(await VP.webhook(o.order_id, pid, { amount: paise, currency: "INR", status: "captured" })).toEqual({ status: 200, message: "ok" });
    expect(await VP.webhook("order_unknown", "pay_x", {})).toEqual({ status: 200, message: "unknown order" });
    expect(await db.val("SELECT COUNT(*) FROM crm_activities WHERE lead_id = $1 AND body LIKE '%paid online%'", [leadId])).toBe(1);
    await expect(VP.createOrder(vid!)).rejects.toThrow(/does not need a payment/);
  });

  it("reports the funnel, team numbers and a safe CSV", async () => {
    const f = await RP.funnel(30);
    expect(f.total).toBeGreaterThanOrEqual(3);
    expect(f.steps[0]).toMatchObject({ key: "new", n: f.total });
    expect(f.steps.map((s) => s.key)).not.toContain("lost");
    for (let i = 1; i < f.steps.length; i++) expect(f.steps[i].n).toBeLessThanOrEqual(f.steps[i - 1].n);
    const t = await RP.team(30);
    const a = t.find((r) => r.id === agentA)!;
    expect(a.touches).toBeGreaterThanOrEqual(1);
    expect(a.conv).toBeGreaterThanOrEqual(0);
    const td = await RP.today();
    expect(td.new_today).toBeGreaterThanOrEqual(3);
    expect(td.open_verifications).toBeGreaterThanOrEqual(1);
    expect((await RP.sources(30)).find((s) => s.source === "walk_in")?.leads).toBeGreaterThanOrEqual(1);
    expect((await RP.countries(30)).length).toBeGreaterThanOrEqual(1);
    expect((await RP.lostReasons(30)).length).toBeGreaterThanOrEqual(0);
    expect((await RP.revenueByMonth(3)).length).toBeGreaterThanOrEqual(1);
    expect((await RP.pathCompletion()).find((p) => p.kind === "ielts")?.done).toBeGreaterThanOrEqual(1);
    expect(RP.safe("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(RP.safe("Plain")).toBe("Plain");
    await db.run("UPDATE users SET name = $1 WHERE id = $2", [`=cmd|' /C calc'!A1 ${tag}`, agentB]);
    await AC.grant(agentB, "agent", admin);
    const csv = await RP.csv("team", 30);
    expect(csv.split("\n")[0]).toBe("Counsellor,Active leads,New in range,Touches,Counselled,Applied,Offers,Enrolled,Revenue INR,Overdue follow-ups,Conversion %");
    expect(csv).toContain(`'=cmd|' /C calc'!A1 ${tag}`);
    expect((await RP.csv("funnel", 30)).split("\n")[0]).toBe("Stage,Leads reaching it,% of all leads,% of previous stage");
  });

  it("revokes access and returns the person's leads to the pool; erasing a lead removes its files", async () => {
    await AC.revoke(agentA, admin);
    expect(await AC.levelOf({ id: agentA, role: "counselor" })).toBeNull();
    expect((await LD.find(leadId))?.counsellor_id).toBeNull();
    const before = (await DC.forLead(leadId)).length;
    expect(before).toBeGreaterThan(0);
    await LD.erase(leadId, admin);
    expect(await LD.find(leadId)).toBeNull();
    expect(await db.val("SELECT COUNT(*) FROM crm_documents WHERE lead_id = $1", [leadId])).toBe(0);
    expect(await db.val("SELECT COUNT(*) FROM crm_payments WHERE lead_id = $1", [leadId])).toBe(0); // cascade
  });
});
