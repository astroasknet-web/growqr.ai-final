import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The client reads its key and org id from the environment at module load, so
 * each test stubs the env, resets the module registry, and imports a fresh copy.
 */
async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("./growqr-interview-api");
}

const CONFIGURED = {
  GROWQR_INTERVIEW_API_KEY: "test-key",
  GROWQR_INTERVIEW_ORG_ID: "growqr",
  GROWQR_API_URL: "https://api.example.test",
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("interviewApiConfigured", () => {
  it("is false when the key or org id is missing", async () => {
    const a = await load({ GROWQR_INTERVIEW_API_KEY: "", GROWQR_INTERVIEW_ORG_ID: "growqr" });
    expect(a.interviewApiConfigured()).toBe(false);
    const b = await load({ GROWQR_INTERVIEW_API_KEY: "k", GROWQR_INTERVIEW_ORG_ID: "" });
    expect(b.interviewApiConfigured()).toBe(false);
  });

  it("is true when both are set", async () => {
    const m = await load(CONFIGURED);
    expect(m.interviewApiConfigured()).toBe(true);
  });
});

describe("resolveAccountEmail", () => {
  it("walks profile id -> clerk id -> account email, lowercased", async () => {
    const m = await load(CONFIGURED);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ user_id: "u1", clerk_id: "user_abc" }))
      .mockResolvedValueOnce(jsonResponse({ id: "u1", clerk_id: "user_abc", email: "Real@Example.com" }));

    const res = await m.resolveAccountEmail("u1");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toBe("real@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/users/api/v1/users/by-id/u1/clerk-id");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/users/api/v1/users/by-clerk-id/user_abc");
    const authHeader = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(authHeader.authorization).toBe("Bearer test-key");
  });

  it("surfaces a 404 as a failure and does not make the second call", async () => {
    const m = await load(CONFIGURED);
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "not found" }, false, 404));
    const res = await m.resolveAccountEmail("missing");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns not-configured without calling fetch when the key is absent", async () => {
    const m = await load({ ...CONFIGURED, GROWQR_INTERVIEW_API_KEY: "" });
    const res = await m.resolveAccountEmail("u1");
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("assignInterview", () => {
  it("posts org, role, round and deduped lowercased emails", async () => {
    const m = await load(CONFIGURED);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        batch_id: "b1",
        role: "Technology",
        round: "technical",
        assignments: [{ email: "a@x.com", assignment_id: "as1", status: "assigned", assigned_at: "t" }],
      }),
    );

    const res = await m.assignInterview({
      role: "Technology",
      round: "technical",
      emails: ["A@X.com", "a@x.com", " b@x.com "],
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.assignments[0].assignment_id).toBe("as1");

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({
      organization_id: "growqr",
      role: "Technology",
      round: "technical",
      assignee_emails: ["a@x.com", "b@x.com"],
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain("/interview/api/v1/interviews/assignments");
  });

  it("rejects an invalid round before calling the service", async () => {
    const m = await load(CONFIGURED);
    const res = await m.assignInterview({ role: "X", round: "senior" as never, emails: ["a@x.com"] });
    expect(res.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fetchResults", () => {
  it("posts deduped ids and returns the results payload", async () => {
    const m = await load(CONFIGURED);
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        result_count: 1,
        results: [{ email: "a@x.com", assignment_id: "as1", completion_status: "completed", score: 78 }],
      }),
    );

    const res = await m.fetchResults(["as1", "as1", "as2"]);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.result_count).toBe(1);

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.assignment_ids).toEqual(["as1", "as2"]);
    expect(body.organization_id).toBe("growqr");
  });
});

describe("verifyPendingAssignment", () => {
  it("is true when the candidate has a pending assignment, false when empty", async () => {
    const m = await load(CONFIGURED);
    fetchMock.mockResolvedValueOnce(jsonResponse({ assignments: [{ assignment_id: "as1" }] }));
    const hit = await m.verifyPendingAssignment("a@x.com");
    expect(hit.ok && hit.data).toBe(true);

    fetchMock.mockResolvedValueOnce(jsonResponse({ assignments: [] }));
    const miss = await m.verifyPendingAssignment("a@x.com");
    expect(miss.ok && miss.data).toBe(false);
  });
});
