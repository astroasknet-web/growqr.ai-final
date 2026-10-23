import { all, one } from "../portal/db";
import { phpRound } from "../qrscore/php";
import { STAGES, stageIndex } from "./leads";

/** Management numbers, computed live from the pipeline (port of Crm\Reports). Managers and admins only (the pages enforce it). */
export const RANGES: Record<number, string> = { 7: "Last 7 days", 30: "Last 30 days", 90: "Last 90 days", 365: "Last 12 months" };

export interface FunnelStep { key: string; label: string; n: number; of_total: number; step: number }

/** Cohort funnel: of the leads created in the range, how many have reached each stage or beyond. Lost / on-hold leads count only toward "Leads". */
export async function funnel(days: number): Promise<{ total: number; lost: number; on_hold: number; steps: FunnelStep[] }> {
  const rows = await all<{ stage: string; n: number }>(`SELECT stage, COUNT(*) AS n FROM crm_leads WHERE created_at >= NOW() - INTERVAL '${Math.trunc(days)} day' GROUP BY stage`);
  const by = new Map(rows.map((r) => [r.stage, Number(r.n)]));
  const total = [...by.values()].reduce((a, b) => a + b, 0);
  const steps: FunnelStep[] = [];
  let prev = total;
  for (const [k, label] of Object.entries(STAGES)) {
    if (k === "lost" || k === "on_hold") continue;
    let reached = 0;
    for (const [s, n] of by) if (stageIndex(s) >= stageIndex(k) && s !== "lost" && s !== "on_hold") reached += n;
    steps.push({ key: k, label, n: reached, of_total: total ? phpRound((reached / total) * 100, 1) : 0, step: prev ? phpRound((reached / prev) * 100, 1) : 0 });
    prev = reached || prev;
  }
  return { total, lost: by.get("lost") ?? 0, on_hold: by.get("on_hold") ?? 0, steps };
}

export async function today(): Promise<Record<string, number>> {
  const r = await one<Record<string, unknown>>(`SELECT
    (SELECT COUNT(*) FROM crm_leads WHERE DATE(created_at) = CURRENT_DATE) AS new_today,
    (SELECT COUNT(*) FROM crm_leads WHERE stage NOT IN ('lost','enrolled') AND next_followup_at < NOW()) AS overdue,
    (SELECT COUNT(*) FROM crm_leads WHERE stage NOT IN ('lost','enrolled','on_hold') AND COALESCE(last_contact_at, created_at) < NOW() - INTERVAL '7 day') AS stale,
    (SELECT COUNT(*) FROM crm_leads WHERE counsellor_id IS NULL AND stage NOT IN ('lost','enrolled')) AS unassigned,
    (SELECT COUNT(*) FROM crm_activities WHERE DATE(created_at) = CURRENT_DATE AND kind IN ('call','whatsapp','email','meeting')) AS touches_today,
    (SELECT COALESCE(SUM(amount_inr),0) FROM crm_payments WHERE status = 'received' AND received_on >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS revenue_month,
    (SELECT COALESCE(SUM(amount_inr),0) FROM crm_payments WHERE status = 'due') AS outstanding,
    (SELECT COUNT(*) FROM crm_verifications WHERE status IN ('awaiting_payment','in_progress')) AS open_verifications`);
  return Object.fromEntries(Object.entries(r ?? {}).map(([k, v]) => [k, Number(v)]));
}

export interface TeamRow { id: number; name: string; active: number; assigned: number; touches: number; contacted: number; counselled: number; applied: number; offers: number; enrolled: number; revenue: number; overdue: number; conv: number }

/** One row per team member: the numbers a sales manager sets KRAs on. */
export async function team(days: number): Promise<TeamRow[]> {
  const d = Math.trunc(days);
  const since = `NOW() - INTERVAL '${d} day'`;
  const rows = await all<Record<string, unknown>>(`SELECT u.id, u.name,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.stage NOT IN ('lost','enrolled')) AS active,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.created_at >= ${since}) AS assigned,
    (SELECT COUNT(*) FROM crm_activities a WHERE a.actor_id = u.id AND a.created_at >= ${since} AND a.kind IN ('call','whatsapp','email','meeting')) AS touches,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.created_at >= ${since} AND l.stage <> 'new' AND l.stage <> 'lost') AS contacted,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.created_at >= ${since} AND l.stage IN ('counselling_done','interested','app_started','app_submitted','offer','deposit_paid','visa_applied','visa_approved','enrolled')) AS counselled,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.created_at >= ${since} AND l.stage IN ('app_submitted','offer','deposit_paid','visa_applied','visa_approved','enrolled')) AS applied,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.created_at >= ${since} AND l.stage IN ('offer','deposit_paid','visa_applied','visa_approved','enrolled')) AS offers,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.enrolled_at >= ${since}) AS enrolled,
    (SELECT COALESCE(SUM(p.amount_inr),0) FROM crm_payments p JOIN crm_leads l ON l.id = p.lead_id WHERE l.counsellor_id = u.id AND p.status = 'received' AND p.kind <> 'verification' AND p.received_on >= CURRENT_DATE - ${d}) AS revenue,
    (SELECT COUNT(*) FROM crm_leads l WHERE l.counsellor_id = u.id AND l.stage NOT IN ('lost','enrolled') AND l.next_followup_at < NOW()) AS overdue
    FROM users u WHERE u.role = 'admin' OR u.id IN (SELECT user_id FROM crm_access) ORDER BY enrolled DESC, revenue DESC, u.name`);
  return rows.map((r) => {
    const assigned = Number(r.assigned);
    const enrolled = Number(r.enrolled);
    return {
      id: Number(r.id), name: String(r.name), active: Number(r.active), assigned, touches: Number(r.touches), contacted: Number(r.contacted), counselled: Number(r.counselled), applied: Number(r.applied),
      offers: Number(r.offers), enrolled, revenue: Number(r.revenue), overdue: Number(r.overdue), conv: assigned > 0 ? phpRound((enrolled / assigned) * 100, 1) : 0,
    };
  });
}

export async function sources(days: number): Promise<Array<{ source: string; leads: number; applied: number; enrolled: number }>> {
  return (await all<Record<string, unknown>>(`SELECT source, COUNT(*) AS leads,
    SUM(CASE WHEN stage IN ('app_submitted','offer','deposit_paid','visa_applied','visa_approved','enrolled') THEN 1 ELSE 0 END) AS applied,
    SUM(CASE WHEN stage = 'enrolled' THEN 1 ELSE 0 END) AS enrolled
    FROM crm_leads WHERE created_at >= NOW() - INTERVAL '${Math.trunc(days)} day' GROUP BY source ORDER BY leads DESC`)).map((r) => ({ source: String(r.source), leads: Number(r.leads), applied: Number(r.applied), enrolled: Number(r.enrolled) }));
}

export async function countries(days: number): Promise<Array<{ country: string; leads: number; enrolled: number }>> {
  return (await all<Record<string, unknown>>(`SELECT CASE WHEN pref_country = '' THEN 'Not set' ELSE pref_country END AS country, COUNT(*) AS leads,
    SUM(CASE WHEN stage = 'enrolled' THEN 1 ELSE 0 END) AS enrolled
    FROM crm_leads WHERE created_at >= NOW() - INTERVAL '${Math.trunc(days)} day' GROUP BY 1 ORDER BY leads DESC LIMIT 12`)).map((r) => ({ country: String(r.country), leads: Number(r.leads), enrolled: Number(r.enrolled) }));
}

export async function lostReasons(days: number): Promise<Array<{ reason: string; n: number }>> {
  return (await all<Record<string, unknown>>(`SELECT CASE WHEN lost_reason = '' THEN 'Not recorded' ELSE lost_reason END AS reason, COUNT(*) AS n FROM crm_leads
    WHERE stage = 'lost' AND updated_at >= NOW() - INTERVAL '${Math.trunc(days)} day' GROUP BY 1 ORDER BY n DESC`)).map((r) => ({ reason: String(r.reason), n: Number(r.n) }));
}

export async function revenueByMonth(months = 6): Promise<Array<{ month: string; amount: number; n: number }>> {
  return (await all<Record<string, unknown>>(`SELECT DATE_FORMAT(received_on, '%Y-%m') AS month, SUM(amount_inr) AS amount, COUNT(*) AS n
    FROM crm_payments WHERE status = 'received' AND kind <> 'verification' AND received_on >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01') - INTERVAL ${Math.trunc(months - 1)} MONTH
    GROUP BY 1 ORDER BY 1`)).map((r) => ({ month: String(r.month), amount: Number(r.amount), n: Number(r.n) }));
}

export async function pathCompletion(): Promise<Array<{ kind: string; done: number; active: number }>> {
  return (await all<Record<string, unknown>>(`SELECT kind, SUM(CASE WHEN status IN ('completed','certified') THEN 1 ELSE 0 END) AS done, SUM(CASE WHEN status IN ('in_progress','booked') THEN 1 ELSE 0 END) AS active FROM crm_milestones GROUP BY kind`)).map((r) => ({ kind: String(r.kind), done: Number(r.done), active: Number(r.active) }));
}

/** Stop spreadsheet formula injection from a name that starts with = + - @. */
export const safe = (v: string): string => (/^[=+\-@\t\r]/.test(v) ? "'" + v : v);

const csvCell = (v: unknown): string => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export async function csv(what: string, days: number): Promise<string> {
  const lines: unknown[][] = [];
  if (what === "team") {
    lines.push(["Counsellor", "Active leads", "New in range", "Touches", "Counselled", "Applied", "Offers", "Enrolled", "Revenue INR", "Overdue follow-ups", "Conversion %"]);
    for (const r of await team(days)) lines.push([safe(r.name), r.active, r.assigned, r.touches, r.counselled, r.applied, r.offers, r.enrolled, r.revenue, r.overdue, r.conv]);
  } else {
    lines.push(["Stage", "Leads reaching it", "% of all leads", "% of previous stage"]);
    for (const s of (await funnel(days)).steps) lines.push([s.label, s.n, s.of_total, s.step]);
  }
  return lines.map((l) => l.map(csvCell).join(",")).join("\n") + "\n";
}
