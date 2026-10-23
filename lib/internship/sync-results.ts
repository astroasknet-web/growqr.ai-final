import { createAdminClient } from "@/lib/data/server";
import {
  interviewApiConfigured,
  fetchResults,
  type CompletionStatus,
} from "./growqr-interview-api";
import { getInternshipSettings } from "./settings";
import { nextStatusOrNull } from "./status-flow";
import { buildStatusEmail } from "./status-email";
import { sendInternshipEmail } from "./send-email";
import type { Json, TablesUpdate } from "@/types/database";

/**
 * Pull AI-assessment results back from the interview service into our own
 * internship_interviews rows.
 *
 * How it stays correct:
 *   - It only looks at OUR queue: rows we assigned (external_interview_id set)
 *     that are not finished yet (completed_at is null). It never invents rows
 *     for interviews assigned outside this system.
 *   - Results are matched on assignment_id, never on position, because the
 *     service does not guarantee order and OMITS ids it does not recognise.
 *   - It reconciles: if we send N ids and get back fewer, the gap is reported
 *     (`missing`) rather than silently ignored. Retrying returns the same
 *     answer, so a gap is a real problem to look at, not a transient one.
 *   - Scoring fields are written ONLY on `completed`. A not_started/in_progress
 *     result never clobbers a row with nulls.
 *   - Idempotent: a completed row drops out of the queue (completed_at set), so
 *     re-running is safe and cheap.
 */

export interface SyncSummary {
  configured: boolean;
  /** Pending rows examined. */
  checked: number;
  /** assignment_ids sent to the service. */
  requested: number;
  /** results returned. */
  returned: number;
  /** rows updated. */
  updated: number;
  /** rows that transitioned to completed this run. */
  completed: number;
  /** ids sent with no matching result (reconcile gap; wrong org or stale id). */
  missing: number;
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// completion_status (service) -> our interview status (migration 0036 CHECK).
const STATUS_MAP: Record<CompletionStatus, string> = {
  not_started: "invited",
  in_progress: "in_progress",
  completed: "completed",
  unassigned: "cancelled",
};

const empty: SyncSummary = {
  configured: false,
  checked: 0,
  requested: 0,
  returned: 0,
  updated: 0,
  completed: 0,
  missing: 0,
};

export async function syncInterviewResults(
  opts?: { applicationId?: string },
): Promise<ApiResult<SyncSummary>> {
  // No key (local dev, or before go-live): a no-op, not an error.
  if (!interviewApiConfigured()) return { ok: true, data: { ...empty, configured: false, checked: 0 } };

  const admin = createAdminClient();

  // The poller's work queue: assigned rounds with no result yet. Matches the
  // partial index internship_interviews_pending_sync_idx (migration 0037).
  let query = admin
    .from("internship_interviews")
    .select("id, external_interview_id, application_id")
    .not("external_interview_id", "is", null)
    .is("completed_at", null)
    .limit(500);
  if (opts?.applicationId) query = query.eq("application_id", opts.applicationId);

  const { data: pending, error } = await query;
  if (error) return { ok: false, error: error.message };

  const rows = (pending ?? []).filter((r) => r.external_interview_id);
  if (!rows.length) return { ok: true, data: { ...empty, configured: true } };

  const ids = Array.from(new Set(rows.map((r) => r.external_interview_id as string)));
  const res = await fetchResults(ids);
  if (!res.ok) return res;

  const byId = new Map(res.data.results.map((r) => [r.assignment_id, r]));

  let updated = 0;
  let completed = 0;
  // Rows that transitioned to completed this run, with the score just written.
  // Fed to the auto-advance lane below. A row only appears here the one run it
  // completes (a completed row leaves the queue), so advancement fires once.
  const finished: { applicationId: string; percent: number | null }[] = [];

  for (const row of rows) {
    const r = byId.get(row.external_interview_id as string);
    if (!r) continue; // omitted by the service; reconciled via `missing` below

    const isDone = r.completion_status === "completed";
    const update: TablesUpdate<"internship_interviews"> = {
      status: STATUS_MAP[r.completion_status] ?? "invited",
      // The row was produced by the product now, not typed by a person.
      source: "app_sync",
      started_at: r.started_at ?? null,
      completed_at: isDone ? r.completed_at ?? new Date().toISOString() : null,
      // Immutable capture of exactly what the service returned.
      raw: r as unknown as Json,
    };

    // Scores exist only on a completed result; never write nulls over a row
    // that is merely in progress.
    if (isDone) {
      update.score = typeof r.score === "number" ? r.score : null;
      if (typeof r.score_max === "number" && r.score_max > 0) update.max_score = r.score_max;
      update.competencies =
        r.rubric_scores && typeof r.rubric_scores === "object"
          ? (r.rubric_scores as Json)
          : null;
      update.summary = r.summary ?? null;
      update.strengths = r.strengths ?? null;
      update.weaknesses = r.weaknesses ?? null;
      update.coaching_notes = r.recommendations ?? null;
      completed++;
    }

    const { error: uErr } = await admin
      .from("internship_interviews")
      .update(update)
      .eq("id", row.id);
    if (!uErr) {
      updated++;
      if (isDone && row.application_id) {
        // Normalise to a percentage so the pass bar (0-100) compares correctly
        // whatever scale the service scored on.
        const max = typeof update.max_score === "number" && update.max_score > 0 ? update.max_score : 100;
        const percent = typeof update.score === "number" ? (update.score / max) * 100 : null;
        finished.push({ applicationId: row.application_id, percent });
      }
    } else {
      console.error(`[interview sync] update failed for ${row.id}:`, uErr.message);
    }
  }

  // Auto-advance lane: when HR has the rule on, a completed interview scoring at
  // or above the bar moves the candidate forward to Selected on its own, and
  // (if enabled) mails them. Forward-only via nextStatusOrNull, so it never
  // pulls back someone already further along or disturbs a human hold. Off by
  // default, so this whole block is skipped unless HR opted in.
  if (finished.length) {
    const settings = await getInternshipSettings();
    if (settings.autoAdvanceEnabled) {
      const eligible = finished.filter((f) => typeof f.percent === "number" && f.percent >= settings.interviewPassScore);
      for (const cand of eligible) {
        const { data: app } = await admin
          .from("internship_applications")
          .select("status, full_name, email, preferred_role")
          .eq("id", cand.applicationId)
          .single();
        if (!app) continue;

        const advanced = nextStatusOrNull(app.status, "selected");
        if (!advanced) continue;

        const { error: aErr } = await admin
          .from("internship_applications")
          .update({ status: advanced })
          .eq("id", cand.applicationId);
        if (aErr) {
          console.error(`[interview sync] auto-advance failed for ${cand.applicationId}:`, aErr.message);
          continue;
        }

        if (settings.emailAutoSelected && app.email) {
          const email = buildStatusEmail("selected", app.full_name, app.preferred_role ?? "the internship");
          await sendInternshipEmail({
            applicationId: cand.applicationId,
            kind: "selected",
            to: app.email,
            subject: email.subject,
            html: email.html,
            sentBy: null,
          });
        }
      }
    }
  }

  const missing = ids.length - res.data.results.length;
  if (missing > 0) {
    // A shortfall is not transient. Most often a wrong org id or a stale
    // assignment id, exactly the silent failures the service documents.
    console.warn(`[interview sync] sent ${ids.length} ids, got ${res.data.results.length}. ${missing} unaccounted for.`);
  }

  return {
    ok: true,
    data: {
      configured: true,
      checked: rows.length,
      requested: ids.length,
      returned: res.data.results.length,
      updated,
      completed,
      missing,
    },
  };
}
