import type { Metadata } from "next";
import Link from "next/link";
import { all, one } from "@/lib/portal/db";
import { gate } from "@/lib/crm/gate";
import * as LD from "@/lib/crm/leads";
import * as RP from "@/lib/crm/reports";
import { CrmPage, inr, StagePill, when } from "@/components/crm/crm-page";
import { claimAction, taskDoneAction } from "./actions";

export const metadata: Metadata = { title: "Overseas CRM | GrowQR", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CrmHome() {
  const { me, manager } = await gate();
  const mine = manager ? "1=1" : "l.counsellor_id = " + Math.trunc(me.id);
  const k = (await one<Record<string, unknown>>(`SELECT
    COUNT(*) FILTER (WHERE l.stage NOT IN ('lost','enrolled')) AS active,
    COUNT(*) FILTER (WHERE l.created_at::date = CURRENT_DATE) AS new_today,
    COUNT(*) FILTER (WHERE l.stage NOT IN ('lost','enrolled') AND l.next_followup_at < NOW()) AS overdue,
    COUNT(*) FILTER (WHERE l.stage NOT IN ('lost','enrolled') AND l.next_followup_at::date = CURRENT_DATE) AS due_today,
    COUNT(*) FILTER (WHERE l.stage NOT IN ('lost','enrolled','on_hold') AND COALESCE(l.last_contact_at, l.created_at) < NOW() - INTERVAL '7 day') AS stale,
    COUNT(*) FILTER (WHERE l.stage = 'enrolled') AS enrolled FROM crm_leads l WHERE ${mine}`)) ?? {};
  const t = manager ? await RP.today() : {};
  const due = await all<Record<string, unknown>>(`SELECT l.id, l.name, l.stage, l.pref_country, l.next_followup_at, c.name AS counsellor_name FROM crm_leads l LEFT JOIN users c ON c.id = l.counsellor_id
    WHERE ${mine} AND l.stage NOT IN ('lost','enrolled') AND l.next_followup_at IS NOT NULL AND l.next_followup_at < NOW() + INTERVAL '1 day' ORDER BY l.next_followup_at LIMIT 12`);
  const tasks = await all<Record<string, unknown>>("SELECT t.*, l.name AS lead_name FROM crm_tasks t JOIN crm_leads l ON l.id = t.lead_id WHERE t.done_at IS NULL AND t.assignee_id = $1 AND t.due_at < NOW() + INTERVAL '1 day' ORDER BY t.due_at LIMIT 12", [me.id]);
  const pool = await all<Record<string, unknown>>("SELECT l.id, l.name, l.pref_country, l.source, l.created_at FROM crm_leads l WHERE l.counsellor_id IS NULL AND l.stage NOT IN ('lost','enrolled') ORDER BY l.created_at LIMIT 8");
  const recent = await all<Record<string, unknown>>(`SELECT a.*, l.name AS lead_name, u.name AS actor FROM crm_activities a JOIN crm_leads l ON l.id = a.lead_id LEFT JOIN users u ON u.id = a.actor_id WHERE ${mine} ORDER BY a.id DESC LIMIT 10`);
  const stat = (label: string, v: unknown, href?: string, bad = false) => (
    <div key={label} className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-4">
      <dt className="text-[13px] text-ink-4">{label}</dt><dd className={`text-[24px] font-bold ${bad ? "text-red-700" : "text-ink"}`}>{String(v ?? 0)}</dd>
      {href ? <dd className="text-[13px]"><Link className="underline" href={href}>view</Link></dd> : null}
    </div>
  );
  const box = "bg-white rounded-2xl border border-black/[0.08] shadow-card p-5";

  return (
    <CrmPage me={me} manager={manager} tab="home" title="Overseas education CRM" subtitle={manager ? "Every lead, from first enquiry to enrolment." : "Your leads, follow-ups and tasks for today."} actions={<Link href="/crm/leads?new=1#new" className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-orange hover:bg-orange-dark text-white text-[14px] font-semibold">Add lead</Link>}>
      <dl className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        {stat(manager ? "Active leads" : "My active leads", k.active)}{stat("New today", k.new_today)}{stat("Follow-ups due today", k.due_today)}
        {stat("Overdue follow-ups", k.overdue, "/crm/leads?due=overdue", Number(k.overdue) > 0)}{stat("No contact for 7+ days", k.stale, "/crm/leads?due=stale")}{stat("Enrolled", k.enrolled)}
      </dl>
      {manager ? (
        <dl className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6" aria-label="Management summary">
          {stat("Unassigned leads", t.unassigned)}{stat("Contacts logged today", t.touches_today)}{stat("Received this month", inr(t.revenue_month ?? 0))}
          {stat("Outstanding fees", inr(t.outstanding ?? 0))}{stat("Open verifications", t.open_verifications)}{stat("Reports", "", "/crm/reports")}
        </dl>
      ) : <div className="mb-6" />}

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <section className={box} aria-labelledby="fu-h"><h2 id="fu-h" className="text-[18px] font-semibold text-ink mb-3">Follow up now</h2>
          {!due.length ? <p className="text-[14px] text-ink-3">No follow-ups are due. Open a lead and set the next follow-up date after every call.</p> : (
            <ul className="divide-y divide-black/[0.07]">{due.map((d) => {
              const late = Date.parse(String(d.next_followup_at).replace(" ", "T") + "Z") < Date.now();
              return <li key={String(d.id)} className="py-2.5 flex flex-wrap justify-between gap-2"><span><Link className="font-medium text-ink hover:underline" href={`/crm/leads/${d.id}`}>{String(d.name)}</Link><br /><small className="text-ink-4">{String(d.pref_country || "")}{manager ? ` · ${d.counsellor_name ?? "Unassigned"}` : ""}</small></span><span className="text-right"><StagePill stage={String(d.stage)} /><br /><small className={late ? "text-red-700 font-bold" : "text-ink-3"}>{when(String(d.next_followup_at))}{late ? " (overdue)" : ""}</small></span></li>;
            })}</ul>
          )}
        </section>
        <section className={box} aria-labelledby="tk-h"><h2 id="tk-h" className="text-[18px] font-semibold text-ink mb-3">My tasks</h2>
          {!tasks.length ? <p className="text-[14px] text-ink-3">Nothing due. Tasks you create on a lead appear here.</p> : null}
          {tasks.map((tk) => (
            <form key={String(tk.id)} action={taskDoneAction} className="flex gap-3 items-start py-2"><input type="hidden" name="id" value={String(tk.id)} />
              <button type="submit" aria-label={`Mark done: ${tk.title}`} className="min-h-[44px] min-w-[44px] rounded-lg border border-black/[0.15] hover:bg-cream-2">&#10003;</button>
              <span><b className="text-ink">{String(tk.title)}</b><br /><small className="text-ink-3"><Link className="underline" href={`/crm/leads/${tk.lead_id}`}>{String(tk.lead_name)}</Link> &middot; {when(String(tk.due_at))}</small></span></form>
          ))}
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className={box} aria-labelledby="pl-h"><h2 id="pl-h" className="text-[18px] font-semibold text-ink mb-3">Unassigned pool</h2>
          {!pool.length ? <p className="text-[14px] text-ink-3">Every lead has an owner.</p> : null}
          {pool.map((p) => (
            <form key={String(p.id)} action={claimAction} className="flex justify-between items-center gap-3 py-2"><input type="hidden" name="id" value={String(p.id)} />
              <span><Link className="font-medium text-ink hover:underline" href={`/crm/leads/${p.id}`}>{String(p.name)}</Link><br /><small className="text-ink-4">{String(p.pref_country || "Country not set")} &middot; {LD.SOURCES[String(p.source)] ?? String(p.source)} &middot; {when(String(p.created_at), { day: "numeric", month: "short" })}</small></span>
              <button type="submit" className="min-h-[44px] px-4 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">Claim</button></form>
          ))}
        </section>
        <section className={box} aria-labelledby="ra-h"><h2 id="ra-h" className="text-[18px] font-semibold text-ink mb-3">Latest activity</h2>
          {!recent.length ? <p className="text-[14px] text-ink-3">Activity appears here as your team works leads.</p> : null}
          <ul className="space-y-2.5">{recent.map((r) => <li key={String(r.id)} className="text-[14px] text-ink-2"><Link className="font-semibold text-ink hover:underline" href={`/crm/leads/${r.lead_id}`}>{String(r.lead_name)}</Link>: {String(r.body)}<br /><small className="text-ink-4">{String(r.actor || "System")} &middot; {when(String(r.created_at))}</small></li>)}</ul>
        </section>
      </div>
    </CrmPage>
  );
}
