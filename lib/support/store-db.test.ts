import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { boot, DB, emailOf, mkUser, type Boot } from "../pay/test-setup";

/**
 * Support tickets on a real database: a ticket always belongs to one signed-in member and nobody else can read or touch it,
 * internal notes never reach the member, limits and duplicate handling hold, staff can work the queue, and quiet tickets close.
 * Run with PORTAL_TEST_DATABASE_URL=mysql://root@127.0.0.1:3307/growqr_test DATABASE_SSL=disable.
 */
describe.skipIf(!DB)("support tickets on a real database", () => {
  let B: Boot;
  let S: typeof import("./store");
  let M: typeof import("./model");
  let alice = 0, bob = 0, admin = 0;
  const actor = (id: number, label: string) => ({ id, name: label, email: emailOf(label) });
  const input = (subject: string) => M.newTicketSchema.parse({ category: "technical", subject, related_ref: "", body: "Something is not working for me, please help." });

  beforeAll(async () => {
    B = await boot();
    S = await import("./store");
    M = await import("./model");
    alice = await mkUser(B.db, "student", "supalice");
    bob = await mkUser(B.db, "student", "supbob");
    admin = await mkUser(B.db, "admin", "supadmin");
  });
  afterAll(async () => { await B.db.closePool(); });

  it("creates a numbered ticket owned by the member, and lists it only for them", async () => {
    const r = await S.createTicket(actor(alice, "supalice"), input("Cannot open my course"));
    expect(r.ok && r.no).toMatch(/^SUP-\d{4}-\d{6}$/);
    if (!r.ok) throw new Error(r.error);
    expect((await S.listForUser(alice)).map((t) => t.no)).toContain(r.no);
    expect((await S.listForUser(bob)).map((t) => t.no)).not.toContain(r.no);
  });

  it("refuses a member reading or replying to someone else's ticket", async () => {
    const r = await S.createTicket(actor(alice, "supalice"), input("Private problem one"));
    if (!r.ok) throw new Error(r.error);
    expect(await S.getForUser(bob, r.no)).toBeNull();
    const rep = await S.replyAsUser(actor(bob, "supbob"), r.no, "I should not be able to do this");
    expect(rep.ok).toBe(false);
    expect((await S.rate(actor(bob, "supbob"), r.no, 5, "")).ok).toBe(false);
    expect(await S.getForUser(bob, "not-a-ticket-number")).toBeNull();
  });

  it("treats the same subject within a day as a retry, not a new ticket", async () => {
    const a = await S.createTicket(actor(bob, "supbob"), input("Double click subject"));
    const b = await S.createTicket(actor(bob, "supbob"), input("double click SUBJECT"));
    expect(a.ok && b.ok && a.no === b.no && b.duplicate).toBe(true);
  });

  it("limits tickets per hour", async () => {
    const carl = await mkUser(B.db, "student", "supcarl");
    let refused = 0;
    for (let i = 0; i < M.LIMITS.perHour + 2; i++) if (!(await S.createTicket(actor(carl, "supcarl"), input(`Distinct issue number ${i}`))).ok) refused++;
    expect(refused).toBe(2);
  });

  it("hides internal notes from the member and shows staff replies, with unread counts", async () => {
    const r = await S.createTicket(actor(alice, "supalice"), input("Needs a staff answer"));
    if (!r.ok) throw new Error(r.error);
    const st = actor(admin, "supadmin");
    expect((await S.staffReply(st, r.no, "Checking the logs, customer is on the old plan", true)).ok).toBe(true);
    const before = await S.unreadFor(alice);
    expect((await S.staffReply(st, r.no, "We have fixed this, please try again", false)).ok).toBe(true);
    expect(await S.unreadFor(alice)).toBe(before + 1);
    const view = await S.getForUser(alice, r.no);
    expect(view!.messages.map((m) => m.body).join("|")).not.toContain("old plan");
    expect(view!.messages.some((m) => m.isStaff && m.body.includes("fixed"))).toBe(true);
    expect(view!.ticket.status).toBe("waiting_user");
    expect(await S.unreadFor(alice)).toBe(0);
    const staffView = await S.staffGet(r.no);
    expect(staffView!.messages.some((m) => m.isInternal)).toBe(true);
  });

  it("reopens on a member reply, and resolves, rates and refuses replies once closed", async () => {
    const r = await S.createTicket(actor(alice, "supalice"), input("Full lifecycle ticket"));
    if (!r.ok) throw new Error(r.error);
    const me = actor(alice, "supalice"), st = actor(admin, "supadmin");
    await S.staffReply(st, r.no, "Try again now", false);
    expect((await S.replyAsUser(me, r.no, "Still broken, sorry")).ok).toBe(true);
    expect((await S.getForUser(alice, r.no))!.ticket.status).toBe("open");
    expect((await S.rate(me, r.no, 5, "")).ok).toBe(false);
    await S.staffSetStatus(st, r.no, "resolved");
    expect((await S.rate(me, r.no, 4, "quick")).ok).toBe(true);
    expect((await S.rate(me, r.no, 1, "")).ok).toBe(false);
    await S.staffSetStatus(st, r.no, "closed");
    expect((await S.replyAsUser(me, r.no, "one more thing")).ok).toBe(false);
  });

  it("lets staff set priority, assign only administrators, and filter the queue", async () => {
    const r = await S.createTicket(actor(bob, "supbob"), input("Queue management ticket"));
    if (!r.ok) throw new Error(r.error);
    const st = actor(admin, "supadmin");
    expect((await S.staffSetPriority(st, r.no, "critical")).ok).toBe(true);
    expect((await S.staffSetPriority(st, r.no, "urgent!!")).ok).toBe(false);
    expect((await S.staffAssign(st, r.no, admin)).ok).toBe(true);
    expect((await S.staffAssign(st, r.no, alice)).ok).toBe(false);
    const q = await S.staffList({ priority: "critical", assigned: "me", q: "Queue management" }, admin);
    expect(q.tickets.map((t) => t.no)).toContain(r.no);
    expect(q.stats.critical).toBeGreaterThan(0);
  });

  it("closes tickets that have been waiting on the member for a week, and leaves recent ones", async () => {
    const dana = await mkUser(B.db, "student", "supdana");
    const old = await S.createTicket(actor(dana, "supdana"), input("Gone quiet long ago"));
    const recent = await S.createTicket(actor(dana, "supdana"), input("Waiting only briefly"));
    if (!old.ok || !recent.ok) throw new Error("create");
    const st = actor(admin, "supadmin");
    await S.staffReply(st, old.no, "Any update from you?", false);
    await S.staffReply(st, recent.no, "Any update from you?", false);
    await B.db.run("UPDATE support_tickets SET last_activity_at = (NOW() - INTERVAL 8 DAY) WHERE ticket_no = $1", [old.no]);
    expect(await S.autoCloseIdle()).toBeGreaterThanOrEqual(1);
    expect((await S.getForUser(dana, old.no))!.ticket.status).toBe("closed");
    expect((await S.getForUser(dana, recent.no))!.ticket.status).toBe("waiting_user");
  });
});
