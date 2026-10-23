import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────
// The scheduler is the only piece with real timing rules; its collaborators
// (the database, Resend, the static expert list) are stubbed so the tests assert
// decisions rather than I/O.

const claimReminderStage = vi.fn(async () => true);
const releaseReminderStage = vi.fn(async () => {});
const saveReminderEmailIds = vi.fn(async () => {});
const sendSessionReminder = vi.fn(async () => ({ ok: true, emailIds: ["e1", "e2"] }));
const getExpertBySlug = vi.fn(() => ({ name: "Ruchi Sharma", email: "ruchi@growqr.ai" }));

vi.mock("@/features/experts/services/bookings.service", () => ({
  claimReminderStage: (...a: unknown[]) => claimReminderStage(...(a as [])),
  releaseReminderStage: (...a: unknown[]) => releaseReminderStage(...(a as [])),
  saveReminderEmailIds: (...a: unknown[]) => saveReminderEmailIds(...(a as [])),
}));

vi.mock("@/features/experts/data/experts-data", () => ({
  getExpertBySlug: (...a: unknown[]) => getExpertBySlug(...(a as [])),
}));

vi.mock("@/features/experts/emails/sessionReminder", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/experts/emails/sessionReminder")
  >("@/features/experts/emails/sessionReminder");
  return {
    ...actual,
    sendSessionReminder: (...a: unknown[]) => sendSessionReminder(...(a as [])),
  };
});

const {
  planReminderStage,
  scheduleRemindersForBooking,
  MAX_SCHEDULE_AHEAD_MS,
} = await import("@/features/experts/services/reminder-schedule");

const NOW = new Date("2026-08-17T06:00:00.000Z");

/** A session `hours` from NOW. */
const startIn = (hours: number) =>
  new Date(NOW.getTime() + hours * 3_600_000).toISOString();

const booking = (overrides: Record<string, unknown> = {}) => ({
  id: "bk-1",
  expert_slug: "ruchi-sharma",
  user_name: "Jane Sharma",
  user_email: "jane@acme.com",
  start_time: startIn(48),
  google_meet_link: "https://meet.google.com/abc-defg-hij",
  reminder_24h_sent: false,
  reminder_1h_sent: false,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  claimReminderStage.mockResolvedValue(true);
  sendSessionReminder.mockResolvedValue({ ok: true, emailIds: ["e1", "e2"] });
});

describe("planReminderStage", () => {
  it("schedules the 24h reminder exactly 24 hours before the session", () => {
    const plan = planReminderStage({ startTime: startIn(48), stage: "24h", now: NOW });
    expect(plan.action).toBe("schedule");
    if (plan.action !== "schedule") return;
    expect(plan.sendAt.toISOString()).toBe("2026-08-18T06:00:00.000Z");
  });

  it("schedules the 1h reminder exactly 1 hour before the session", () => {
    const plan = planReminderStage({ startTime: startIn(48), stage: "1h", now: NOW });
    expect(plan.action).toBe("schedule");
    if (plan.action !== "schedule") return;
    expect(plan.sendAt.toISOString()).toBe("2026-08-19T05:00:00.000Z");
  });

  it("sends immediately when the mark just passed", () => {
    // Session in 55 minutes: the 1h mark passed 5 minutes ago, inside the grace.
    expect(planReminderStage({ startTime: startIn(55 / 60), stage: "1h", now: NOW }).action)
      .toBe("send-now");
  });

  it("skips a mark that passed long ago rather than sending wrong copy", () => {
    // Booked 3 hours out — a "your session is tomorrow" email would be a lie.
    const plan = planReminderStage({ startTime: startIn(3), stage: "24h", now: NOW });
    expect(plan.action).toBe("skip");
  });

  it("skips a stage whose session has already started", () => {
    expect(planReminderStage({ startTime: startIn(-0.1), stage: "1h", now: NOW }).action)
      .toBe("skip");
  });

  it("defers a mark beyond Resend's scheduling horizon", () => {
    // 24h mark lands 40 days out, past what Resend will hold.
    const plan = planReminderStage({ startTime: startIn(41 * 24), stage: "24h", now: NOW });
    expect(plan.action).toBe("defer");
  });

  it("schedules right up to the horizon boundary", () => {
    const at = new Date(NOW.getTime() + MAX_SCHEDULE_AHEAD_MS);
    // Session 1h after the last schedulable instant → 1h mark sits on the edge.
    const plan = planReminderStage({
      startTime: new Date(at.getTime() + 3_600_000).toISOString(),
      stage: "1h",
      now: NOW,
    });
    expect(plan.action).toBe("schedule");
  });
});

describe("scheduleRemindersForBooking", () => {
  it("queues both stages with the right scheduledAt and recipients", async () => {
    const outcomes = await scheduleRemindersForBooking(booking(), NOW);

    expect(outcomes).toEqual([
      { stage: "24h", result: "scheduled", sendAt: "2026-08-18T06:00:00.000Z" },
      { stage: "1h", result: "scheduled", sendAt: "2026-08-19T05:00:00.000Z" },
    ]);
    expect(sendSessionReminder).toHaveBeenCalledTimes(2);

    const [first] = sendSessionReminder.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(first).toMatchObject({
      stage: "24h",
      expertEmail: "ruchi@growqr.ai",
      userEmail: "jane@acme.com",
      scheduledAt: "2026-08-18T06:00:00.000Z",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    });
  });

  it("claims each stage before sending, so a concurrent run cannot double-send", async () => {
    claimReminderStage.mockResolvedValue(false);
    const outcomes = await scheduleRemindersForBooking(booking(), NOW);

    expect(outcomes.every((o) => o.result === "already-handled")).toBe(true);
    expect(sendSessionReminder).not.toHaveBeenCalled();
  });

  it("skips a stage already marked sent without touching the database", async () => {
    const outcomes = await scheduleRemindersForBooking(
      booking({ reminder_24h_sent: true }),
      NOW,
    );

    expect(outcomes[0]).toEqual({ stage: "24h", result: "already-handled" });
    expect(outcomes[1].result).toBe("scheduled");
    expect(claimReminderStage).toHaveBeenCalledTimes(1);
  });

  it("releases the claim when Resend rejects, so the sweeper retries", async () => {
    sendSessionReminder.mockResolvedValue({ ok: false, emailIds: [] });
    const outcomes = await scheduleRemindersForBooking(booking(), NOW);

    expect(outcomes.every((o) => o.result === "failed")).toBe(true);
    expect(releaseReminderStage).toHaveBeenCalledTimes(2);
    expect(saveReminderEmailIds).not.toHaveBeenCalled();
  });

  it("releases the claim when the send throws", async () => {
    sendSessionReminder.mockRejectedValue(new Error("network down"));
    const outcomes = await scheduleRemindersForBooking(booking(), NOW);

    expect(outcomes[0]).toMatchObject({ result: "failed", reason: "network down" });
    expect(releaseReminderStage).toHaveBeenCalledWith("bk-1", "24h");
  });

  it("stores the Resend ids so a stage can be cancelled later", async () => {
    await scheduleRemindersForBooking(booking(), NOW);
    expect(saveReminderEmailIds).toHaveBeenCalledWith("bk-1", "24h", ["e1", "e2"]);
    expect(saveReminderEmailIds).toHaveBeenCalledWith("bk-1", "1h", ["e1", "e2"]);
  });

  it("retires an unreachable stage without emailing, but still queues the other", async () => {
    // Booked 3h ahead: no 24h reminder is possible, the 1h one still is.
    const outcomes = await scheduleRemindersForBooking(
      booking({ start_time: startIn(3) }),
      NOW,
    );

    expect(outcomes[0].result).toBe("skipped");
    expect(outcomes[1]).toMatchObject({ result: "scheduled", sendAt: "2026-08-17T08:00:00.000Z" });
    expect(sendSessionReminder).toHaveBeenCalledTimes(1);
    // Claimed anyway, so the sweeper does not reconsider it every day.
    expect(claimReminderStage).toHaveBeenCalledWith("bk-1", "24h");
  });

  it("leaves a far-future stage pending instead of claiming it", async () => {
    const outcomes = await scheduleRemindersForBooking(
      booking({ start_time: startIn(60 * 24) }),
      NOW,
    );

    expect(outcomes.every((o) => o.result === "deferred")).toBe(true);
    expect(claimReminderStage).not.toHaveBeenCalled();
    expect(sendSessionReminder).not.toHaveBeenCalled();
  });

  it("falls back to the shared inbox when the expert has no email", async () => {
    getExpertBySlug.mockReturnValue({ name: "Someone", email: undefined } as never);
    await scheduleRemindersForBooking(booking(), NOW);

    const [first] = sendSessionReminder.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(first.expertEmail).toBe("sahil@growqr.ai");
  });
});
