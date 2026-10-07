import type { Metadata } from "next";
import Link from "next/link";
import { gate } from "@/lib/crm/gate";
import * as AC from "@/lib/crm/access";
import * as LD from "@/lib/crm/leads";
import { CrmPage, StagePill, when } from "@/components/crm/crm-page";
import { NewLeadForm } from "@/components/crm/new-lead-form";
import { importLeadsAction } from "../actions";

export const metadata: Metadata = { title: "Leads | Overseas CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const sel = "min-h-[44px] px-3 rounded-lg border border-black/[0.15] bg-white text-[14px]";
const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { me, manager } = await gate(false, "/crm/leads");
  const sp = await searchParams;
  const f = { q: one(sp.q).trim(), stage: one(sp.stage), counsellor: one(sp.counsellor), country: one(sp.country), source: one(sp.source), due: one(sp.due) };
  const board = one(sp.view) === "board";
  const page = Math.max(1, parseInt(one(sp.p), 10) || 1);
  const per = board ? 400 : 40;
  const res = await LD.search(me, f, per, (page - 1) * per);
  const staff = await AC.staff();
  const showNew = !!one(sp.new);
  const pages = Math.ceil(res.total / per);
  const qs = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...f, view: board ? "board" : "" }).filter(([, v]) => v));
    q.set("p", String(p));
    return "/crm/leads?" + q.toString();
  };
  const cols = Object.entries(LD.STAGES).filter(([k]) => k !== "lost" && k !== "on_hold");
  const late = (ts: string | null) => !!ts && Date.parse(ts.replace(" ", "T") + "Z") < Date.now();

  return (
    <CrmPage me={me} manager={manager} tab={board ? "board" : "leads"} title={board ? "Pipeline" : "Leads"} subtitle={`${res.total} lead${res.total === 1 ? "" : "s"} match${res.total === 1 ? "es" : ""} your filters.`}
      actions={<span className="flex gap-2"><Link className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] bg-white text-[14px] font-medium" href={board ? "/crm/leads" : "/crm/leads?view=board"}>{board ? "List view" : "Board view"}</Link><Link className="min-h-[44px] inline-flex items-center px-4 rounded-lg bg-orange text-white text-[14px] font-semibold" href="/crm/leads?new=1#new">Add lead</Link></span>}>
      {showNew ? <NewLeadForm countries={LD.COUNTRIES} sources={LD.SOURCES} /> : null}

      <form method="get" role="search" aria-label="Filter leads" className="flex flex-wrap gap-2 mb-5">
        {board ? <input type="hidden" name="view" value="board" /> : null}
        <label className="sr-only" htmlFor="f-q">Search</label><input id="f-q" name="q" type="search" defaultValue={f.q} placeholder="Name, phone, email or course" className={`${sel} flex-1 min-w-[12rem] text-[16px]`} />
        <label className="sr-only" htmlFor="f-stage">Stage</label><select id="f-stage" name="stage" defaultValue={f.stage} className={sel}><option value="">All open stages</option>{Object.entries(LD.STAGES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <label className="sr-only" htmlFor="f-cn">Country</label><select id="f-cn" name="country" defaultValue={f.country} className={sel}><option value="">Any country</option>{LD.COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
        <label className="sr-only" htmlFor="f-own">Owner</label><select id="f-own" name="counsellor" defaultValue={f.counsellor} className={sel}><option value="">Any owner</option><option value="none">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label className="sr-only" htmlFor="f-due">Follow-up</label><select id="f-due" name="due" defaultValue={f.due} className={sel}><option value="">Any follow-up</option><option value="today">Due today</option><option value="overdue">Overdue</option><option value="stale">No contact 7+ days</option></select>
        <button type="submit" className="min-h-[44px] px-5 rounded-lg bg-ink text-white text-[14px] font-semibold">Filter</button>
      </form>

      {board ? (
        <div className="flex gap-3 overflow-x-auto pb-3" role="list" aria-label="Pipeline board">
          {cols.map(([key, label]) => {
            const cards = res.rows.filter((r) => r.stage === key);
            return (
              <section key={key} role="listitem" aria-label={label} className="w-64 shrink-0 bg-cream-3/60 rounded-2xl p-3">
                <h3 className="text-[13px] font-semibold text-ink mb-2 flex justify-between"><span>{label}</span><span className="text-ink-4">{cards.length}</span></h3>
                <div className="space-y-2">{cards.map((c) => (
                  <Link key={c.id} href={`/crm/leads/${c.id}`} className="block bg-white rounded-xl border border-black/[0.08] p-3 hover:shadow-card">
                    <b className="block text-[14px] text-ink">{c.name}</b>
                    <small className="block text-ink-3">{c.pref_country || "Country not set"}{c.pref_course ? ` · ${c.pref_course}` : ""}</small>
                    <small className="block text-ink-4">{c.counsellor_name || "Unassigned"}{c.next_followup_at ? <> &middot; <span className={late(c.next_followup_at) ? "text-red-700 font-semibold" : ""}>{when(c.next_followup_at, { day: "numeric", month: "short" })}</span></> : null}</small>
                  </Link>
                ))}</div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5">
          {!res.rows.length ? <p className="text-[15px] text-ink-3">No leads match. Add one, or clear the filters.</p> : (
            <div className="overflow-x-auto"><table className="w-full text-[14px] min-w-[44rem]">
              <thead><tr className="text-left text-ink-4"><th scope="col" className="py-2 pr-3">Lead</th><th scope="col" className="pr-3">Stage</th><th scope="col" className="pr-3">Wants</th><th scope="col" className="pr-3">Owner</th><th scope="col" className="pr-3">Next follow-up</th><th scope="col">Source</th></tr></thead>
              <tbody>{res.rows.map((r) => (
                <tr key={r.id} className="border-t border-black/[0.07] align-top">
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium"><Link className="text-ink hover:underline" href={`/crm/leads/${r.id}`}>{r.name}</Link><br /><small className="text-ink-4 font-normal">{r.phone || r.email}</small></th>
                  <td className="pr-3"><StagePill stage={r.stage} /></td>
                  <td className="pr-3">{r.pref_country || "-"}<br /><small className="text-ink-4">{r.pref_course}</small></td>
                  <td className="pr-3">{r.counsellor_name || "Unassigned"}</td>
                  <td className={`pr-3 ${late(r.next_followup_at) ? "text-red-700 font-bold" : ""}`}>{r.next_followup_at ? when(r.next_followup_at) : <span className="text-ink-4 font-normal">not set</span>}</td>
                  <td>{LD.SOURCES[r.source] ?? r.source}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
          {pages > 1 ? (
            <div className="flex justify-between items-center mt-4 text-[14px]"><span className="text-ink-3">Page {page} of {pages}</span><span className="flex gap-2">
              {page > 1 ? <Link className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15]" href={qs(page - 1)}>Previous</Link> : null}
              {page < pages ? <Link className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15]" href={qs(page + 1)}>Next</Link> : null}</span></div>
          ) : null}
        </div>
      )}

      {manager ? (
        <details className="mt-6 bg-white rounded-2xl border border-black/[0.08] p-5">
          <summary className="cursor-pointer font-semibold text-ink min-h-[44px] flex items-center">Import leads from a spreadsheet (CSV)</summary>
          <p className="text-[14px] text-ink-3 my-3">First row must name the columns: <code>name, phone, email, city, country, course, source, intake</code>. Only name and one contact are required. Imported leads go to the unassigned pool. Maximum 500 rows.</p>
          <form action={importLeadsAction} className="flex flex-wrap gap-3 items-end"><div><label htmlFor="csv" className="sr-only">CSV file</label><input id="csv" name="csv" type="file" accept=".csv" required className="text-[14px]" /></div><button type="submit" className="min-h-[44px] px-5 rounded-lg bg-ink text-white text-[14px] font-semibold">Import</button></form>
        </details>
      ) : null}
    </CrmPage>
  );
}
