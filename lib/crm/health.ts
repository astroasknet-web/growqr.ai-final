import { createAdminClient } from "@/lib/data/server";
import { getResend } from "@/lib/resend";
import { createLogger } from "@/lib/log";
import { escapeHtml } from "@/lib/escape-html";
import { CRM_SOURCES, type CrmSourceDefinition } from "@/lib/crm/sources";
import { MAX_ATTEMPTS } from "@/lib/crm/sync";

/**
 * CRM sync health: finds rows that need a HUMAN (the cron will never fix
 * them on its own) and emails one digest per cron run when any exist.
 *
 *  - gave_up:  'failed' with attempts >= MAX_ATTEMPTS — retries exhausted.
 *  - stuck:    'syncing' older than the stale threshold. The sweep's reaper
 *              resets these BEFORE this check runs, so any that remain mean
 *              the reaper itself is failing — a worse signal than the row.
 *
 * 'failed' below the attempts cap is normal retry traffic and never alerts.
 *
 * Cadence caveat (documented in lib/crm/README.md): the digest repeats
 * every cron run while a row stays stuck — stateless by design; deduping
 * would need an alerted_at column (deferred unless fatigue materialises).
 */

const log = createLogger("crm-health");

const ALERT_FROM = "GrowQR CRM <hello@growqr.ai>";
const ALERT_TO = "support@growqr.ai";
/** Mirrors the sweep's grace window; 'syncing' beyond this is stranded. */
const STALE_SYNCING_MS = 10 * 60_000;

export interface StuckRow {
  table: string;
  reason: "gave_up" | "stuck_syncing";
  id: string | number;
  email: string | null;
  attempts: number;
  error: string | null;
  createdAt: string;
}

export async function findRowsNeedingAttention(
  sources: readonly CrmSourceDefinition[] = Object.values(CRM_SOURCES),
): Promise<StuckRow[]> {
  const staleCutoff = new Date(Date.now() - STALE_SYNCING_MS).toISOString();
  const rows: StuckRow[] = [];
  const enabled = sources.filter((s) => s.enabled);
  if (enabled.length === 0) return rows;
  const admin = createAdminClient();

  for (const source of enabled) {

    const { data: gaveUp, error: gaveUpError } = await admin
      .from(source.table)
      .select("id, email, crm_sync_attempts, crm_sync_error, created_at")
      .eq("crm_sync_status", "failed")
      .gte("crm_sync_attempts", MAX_ATTEMPTS);
    if (gaveUpError) log.error(`${source.table} gave-up query failed:`, gaveUpError);

    const { data: stuck, error: stuckError } = await admin
      .from(source.table)
      .select("id, email, crm_sync_attempts, crm_sync_error, created_at")
      .eq("crm_sync_status", "syncing")
      .lt("created_at", staleCutoff);
    if (stuckError) log.error(`${source.table} stuck query failed:`, stuckError);

    for (const [reason, list] of [
      ["gave_up", gaveUp ?? []],
      ["stuck_syncing", stuck ?? []],
    ] as const) {
      for (const row of list) {
        rows.push({
          table: source.table,
          reason,
          id: row.id,
          email: row.email ?? null,
          attempts: row.crm_sync_attempts ?? 0,
          error: row.crm_sync_error ?? null,
          createdAt: row.created_at ?? "",
        });
      }
    }
  }

  return rows;
}

/** Pure so the digest content is unit-testable. */
export function buildDigestEmail(rows: StuckRow[]): { subject: string; html: string } {
  const tableRows = rows
    .map(
      (r) => `<tr>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(r.table)}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(String(r.id))}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(r.reason)}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(r.email ?? "—")}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${r.attempts}</td>
        <td style="padding:6px 10px;border:1px solid #e5e7eb;">${escapeHtml(r.error ?? "—")}</td>
      </tr>`,
    )
    .join("");

  return {
    subject: `[CRM sync] ${rows.length} row(s) need attention`,
    html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#111827;">
      <p><strong>CRM sync digest</strong> — these rows will not recover without action
      (see lib/crm/README.md for the requeue recipe):</p>
      <table style="border-collapse:collapse;font-size:13px;">
        <tr>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">table</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">id</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">reason</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">email</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">attempts</th>
          <th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">last error</th>
        </tr>
        ${tableRows}
      </table>
      <p style="color:#6b7280;font-size:12px;">Sent by the crm-sync cron. This digest repeats
      every run until the rows are resolved or requeued.</p>
    </div>`,
  };
}

export interface AlertOutcome {
  alerted: boolean;
  /** Rows currently needing attention; -1 when the check itself failed. */
  stuckRows: number;
  error?: string;
}

/**
 * One digest per cron run, only when non-empty. Never throws — a broken
 * alerting path must not fail the sweep it reports on.
 */
export async function alertOnStuckRows(
  sources: readonly CrmSourceDefinition[] = Object.values(CRM_SOURCES),
): Promise<AlertOutcome> {
  try {
    const rows = await findRowsNeedingAttention(sources);
    if (rows.length === 0) return { alerted: false, stuckRows: 0 };

    const { subject, html } = buildDigestEmail(rows);
    await getResend().emails.send({ from: ALERT_FROM, to: ALERT_TO, subject, html });
    log.warn(`digest sent: ${rows.length} row(s) need attention`);
    return { alerted: true, stuckRows: rows.length };
  } catch (error) {
    log.error("alerting failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { alerted: false, stuckRows: -1, error: message };
  }
}
