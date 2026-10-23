import { beforeEach, describe, expect, it, vi } from "vitest";
import { alertOnStuckRows, buildDigestEmail, type StuckRow } from "@/lib/crm/health";
import type { CrmSourceDefinition } from "@/lib/crm/sources";

const sendMock = vi.hoisted(() => vi.fn());
const createAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/resend", () => ({
  getResend: () => ({ emails: { send: sendMock } }),
}));

vi.mock("@/lib/data/server", () => ({
  createAdminClient: createAdminClientMock,
}));

const source = (overrides: Partial<CrmSourceDefinition> = {}): CrmSourceDefinition =>
  ({
    table: "b2b_leads",
    enabled: true,
    buildPayload: vi.fn(),
    ...overrides,
  }) as CrmSourceDefinition;

/** Scripted select chains: each awaited query pops the next result. */
function stubAdmin(results: Array<{ data?: unknown; error?: unknown }>) {
  const queue = [...results];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "gte", "lt"]) {
    builder[method] = () => builder;
  }
  builder.then = (resolve: (v: unknown) => void) =>
    resolve(queue.shift() ?? { data: [], error: null });
  createAdminClientMock.mockReturnValue({ from: () => builder });
}

const dbRow = (id: number, status_bits: Partial<Record<string, unknown>> = {}) => ({
  id,
  email: "a@b.co",
  crm_sync_attempts: 5,
  crm_sync_error: "Zoho rejected the record: invalid",
  created_at: "2026-07-20T00:00:00Z",
  ...status_bits,
});

beforeEach(() => {
  vi.clearAllMocks();
  sendMock.mockResolvedValue({ id: "email-1" });
});

describe("alertOnStuckRows", () => {
  it("sends nothing when no rows need attention", async () => {
    stubAdmin([{ data: [] }, { data: [] }]);

    const outcome = await alertOnStuckRows([source()]);

    expect(outcome).toEqual({ alerted: false, stuckRows: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends one digest covering gave-up and stuck-syncing rows", async () => {
    stubAdmin([
      { data: [dbRow(1)] }, // gave_up
      { data: [dbRow(2)] }, // stuck_syncing
    ]);

    const outcome = await alertOnStuckRows([source()]);

    expect(outcome).toEqual({ alerted: true, stuckRows: 2 });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const email = sendMock.mock.calls[0][0];
    expect(email.to).toBe("support@growqr.ai");
    expect(email.subject).toBe("[CRM sync] 2 row(s) need attention");
    expect(email.html).toContain("gave_up");
    expect(email.html).toContain("stuck_syncing");
  });

  it("skips disabled sources", async () => {
    stubAdmin([]);
    const outcome = await alertOnStuckRows([source({ enabled: false })]);

    expect(outcome).toEqual({ alerted: false, stuckRows: 0 });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("never throws when sending fails — the cron must survive", async () => {
    stubAdmin([{ data: [dbRow(1)] }, { data: [] }]);
    sendMock.mockRejectedValue(new Error("resend down"));

    const outcome = await alertOnStuckRows([source()]);

    expect(outcome.alerted).toBe(false);
    expect(outcome.error).toBe("resend down");
  });
});

describe("buildDigestEmail", () => {
  const row: StuckRow = {
    table: "b2b_leads",
    reason: "gave_up",
    id: 7,
    email: "x@y.co",
    attempts: 5,
    error: 'Zoho rejected: <script>alert("x")</script>',
    createdAt: "2026-07-20T00:00:00Z",
  };

  it("includes every row field and escapes HTML in error text", () => {
    const { subject, html } = buildDigestEmail([row]);
    expect(subject).toBe("[CRM sync] 1 row(s) need attention");
    expect(html).toContain("b2b_leads");
    expect(html).toContain("x@y.co");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
