/**
 * Client for the GrowQR interview-assignment service (api.growqr.ai).
 *
 * This is the live counterpart to lib/internship/interviews.ts, which only
 * holds vocabulary. Everything that actually talks to the service lives here,
 * behind a discriminated-union result so a caller inside a server action never
 * has to wrap a call in try/catch: a network failure and a 403 both come back
 * as { ok: false }, and the interview card falls back to the manual path.
 *
 * The single most important rule of this integration, and the one that fails
 * silently if you get it wrong:
 *
 *   Assignments are matched on the candidate's ACCOUNT email, which is NOT the
 *   `public_email` on the public profile endpoint. Assigning against the wrong
 *   address returns success with a real assignment_id, and the candidate never
 *   sees the interview. Always resolve the account email through
 *   resolveAccountEmail() first, starting from the profile UUID we store in
 *   internship_applications.growqr_user_id.
 *
 * Auth is a per-integration bearer service key, issued by GrowQR alongside the
 * organization_id. Backend only; it must never reach a browser.
 */

import { isRoundType, type RoundType } from "@/lib/internship/interviews";

const API_BASE = (process.env.GROWQR_API_URL || "https://api.growqr.ai").replace(/\/+$/, "");
const SERVICE_KEY = process.env.GROWQR_INTERVIEW_API_KEY || "";
const ORG_ID = process.env.GROWQR_INTERVIEW_ORG_ID || "";
const TIMEOUT_MS = 12_000;

/** True only when both the bearer key and the org id are present. */
export function interviewApiConfigured(): boolean {
  return Boolean(SERVICE_KEY && ORG_ID);
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

function notConfigured<T>(): ApiResult<T> {
  return { ok: false, error: "Interview API is not configured (missing key or org id)." };
}

/**
 * One JSON call to the service. Returns the parsed body on 2xx, and a typed
 * failure otherwise. Never throws: an aborted fetch or a non-JSON body both
 * degrade to { ok: false } so the caller can fall back rather than 500.
 */
async function call<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  if (!SERVICE_KEY) return notConfigured<T>();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${SERVICE_KEY}`,
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: "Could not reach the interview service." };
  }

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // Some error responses have no body. Fall through with parsed = null.
  }

  if (!res.ok) {
    const detail =
      parsed && typeof parsed === "object" && "detail" in parsed
        ? String((parsed as { detail: unknown }).detail)
        : `Request failed (${res.status}).`;
    return { ok: false, error: detail, status: res.status };
  }

  return { ok: true, data: parsed as T };
}

// ---------------------------------------------------------------------------
// 1. Account-email resolution (profile UUID -> clerk id -> account email)
// ---------------------------------------------------------------------------

type ClerkIdResponse = { user_id: string; clerk_id: string };
type AccountResponse = {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
};

/**
 * Resolve the account email for a profile UUID (growqr_user_id). Two hops:
 * by-id -> clerk_id, then by-clerk-id -> the account record with its email.
 *
 * Returns the lowercased account email. This is the ONLY address safe to
 * assign against.
 */
export async function resolveAccountEmail(userId: string): Promise<ApiResult<string>> {
  if (!interviewApiConfigured()) return notConfigured<string>();
  if (!userId) return { ok: false, error: "No GrowQR profile id on this application." };

  const clerk = await call<ClerkIdResponse>(
    "GET",
    `/users/api/v1/users/by-id/${encodeURIComponent(userId)}/clerk-id`,
  );
  if (!clerk.ok) return clerk;
  if (!clerk.data?.clerk_id) {
    return { ok: false, error: "No Clerk id for this profile." };
  }

  const account = await call<AccountResponse>(
    "GET",
    `/users/api/v1/users/by-clerk-id/${encodeURIComponent(clerk.data.clerk_id)}`,
  );
  if (!account.ok) return account;

  const email = typeof account.data?.email === "string" ? account.data.email.trim().toLowerCase() : "";
  if (!email) return { ok: false, error: "Account record has no email." };
  return { ok: true, data: email };
}

// ---------------------------------------------------------------------------
// 2. Assign an interview
// ---------------------------------------------------------------------------

export type Assignment = {
  email: string;
  assignment_id: string;
  status: string;
  assigned_at: string;
};
export type AssignResponse = {
  success: boolean;
  batch_id: string;
  role: string;
  round: RoundType;
  assignments: Assignment[];
};

/**
 * Assign one round to one or more account emails that share the same role and
 * round. The service batches up to 500; we send whatever the caller passes.
 *
 * NOT idempotent on the service side: a retry creates a second interview. The
 * caller must guard retries (we lean on the unique (application_id, round)
 * constraint for the single-candidate case).
 */
export async function assignInterview(params: {
  role: string;
  round: RoundType;
  emails: string[];
}): Promise<ApiResult<AssignResponse>> {
  if (!interviewApiConfigured()) return notConfigured<AssignResponse>();

  const role = params.role.trim().slice(0, 200);
  if (!role) return { ok: false, error: "Role is required." };
  if (!isRoundType(params.round)) return { ok: false, error: "Invalid round type." };

  const emails = Array.from(
    new Set(params.emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  );
  if (!emails.length) return { ok: false, error: "No assignee emails." };
  if (emails.length > 500) return { ok: false, error: "At most 500 emails per call." };

  return call<AssignResponse>("POST", "/interview/api/v1/interviews/assignments", {
    organization_id: ORG_ID,
    role,
    round: params.round,
    assignee_emails: emails,
  });
}

// ---------------------------------------------------------------------------
// 3. Fetch results
// ---------------------------------------------------------------------------

export type CompletionStatus = "not_started" | "in_progress" | "completed" | "unassigned";

export type ResultItem = {
  email: string;
  assignment_id: string;
  completion_status: CompletionStatus;
  score?: number | null;
  score_max?: number | null;
  rubric_scores?: Record<string, number> | null;
  summary?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  recommendations?: string[] | null;
  started_at?: string | null;
  completed_at?: string | null;
  last_activity_at?: string | null;
  // Additive richer surfaces. Present sometimes, safe to ignore.
  [key: string]: unknown;
};
export type ResultsResponse = {
  success: boolean;
  result_count: number;
  results: ResultItem[];
};

/**
 * Fetch results for up to 500 assignment_ids. A pure DB read, cheap to poll.
 *
 * The service OMITS ids it does not recognise (wrong org, stale id) rather than
 * erroring, so the caller must reconcile: if you send N and get back fewer than
 * N, the gap is a real problem, not a transient one, and retrying returns the
 * same answer.
 */
export async function fetchResults(assignmentIds: string[]): Promise<ApiResult<ResultsResponse>> {
  if (!interviewApiConfigured()) return notConfigured<ResultsResponse>();

  const ids = Array.from(new Set(assignmentIds.filter(Boolean)));
  if (!ids.length) return { ok: false, error: "No assignment ids." };
  if (ids.length > 500) return { ok: false, error: "At most 500 ids per call." };

  return call<ResultsResponse>("POST", "/interview/api/v1/interviews/results:bulk", {
    organization_id: ORG_ID,
    assignment_ids: ids,
  });
}

// ---------------------------------------------------------------------------
// 4. Verify delivery, and revoke
// ---------------------------------------------------------------------------

type AssignmentListResponse = { assignments?: { assignment_id: string }[] } | { [k: string]: unknown };

/**
 * After assigning, confirm the candidate actually has a pending assignment.
 * Empty for someone you just assigned means the email was wrong (the account
 * vs public_email trap). Best-effort: a failure here does not undo the assign.
 */
export async function verifyPendingAssignment(email: string): Promise<ApiResult<boolean>> {
  if (!interviewApiConfigured()) return notConfigured<boolean>();
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "No email to verify." };

  const res = await call<AssignmentListResponse>(
    "GET",
    `/interview/api/v1/interviews/assignments?email=${encodeURIComponent(clean)}&status=pending`,
  );
  if (!res.ok) return res;

  const list = (res.data as { assignments?: unknown }).assignments;
  const count = Array.isArray(list) ? list.length : 0;
  return { ok: true, data: count > 0 };
}

export type UnassignResponse = {
  unassignments?: { email: string }[];
  failed_unassignments?: { email: string; reason: string }[];
};

/** Flip every active assignment for these emails to `unassigned`. */
export async function unassign(emails: string[]): Promise<ApiResult<UnassignResponse>> {
  if (!interviewApiConfigured()) return notConfigured<UnassignResponse>();
  const clean = Array.from(new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)));
  if (!clean.length) return { ok: false, error: "No emails to unassign." };

  return call<UnassignResponse>("POST", "/interview/api/v1/interviews/assignments/unassign", {
    organization_id: ORG_ID,
    emails: clean,
  });
}
