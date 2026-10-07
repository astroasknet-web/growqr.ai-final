import type { Metadata } from "next";
import { gate } from "@/lib/crm/gate";
import * as LD from "@/lib/crm/leads";
import * as PT from "@/lib/crm/path";
import * as RP from "@/lib/crm/reports";
import { CrmPage, fieldCls, inr } from "@/components/crm/crm-page";

export const metadata: Metadata = { title: "Reports | Overseas CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const box = "bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 mb-5";
const th = "py-2 pr-3 text-left font-medium text-ink-4";

export default async function Reports({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { me, manager } = await gate(true, "/crm/reports");
  const sp = await searchParams;
  const d = parseInt(String(Array.isArray(sp.days) ? sp.days[0] : sp.days ?? ""), 10);
  const days = d in RP.RANGES ? d : 30;
  const [fun, team, src, cn, lost, rev, path] = await Promise.all([RP.funnel(days), RP.team(days), RP.sources(days), RP.countries(days), RP.lostReasons(days), RP.revenueByMonth(6), RP.pathCompletion()]);
  const pathBy = Object.fromEntries(path.map((p) => [p.kind, p]));
  const max = Math.max(1, fun.total);
  const maxRev = Math.max(1, ...rev.map((r) => r.amount));

  return (
    <CrmPage me={me} manager={manager} tab="reports" title="Reports and KRAs" subtitle="Computed live from the pipeline. Change the range to compare periods.">
      <form method="get" className="flex flex-wrap gap-2 items-end mb-5">
        <div><label htmlFor="days" className="block text-[13px] text-ink-3 mb-1">Range</label>
          <select id="days" name="days" defaultValue={days} className={`${fieldCls} !w-auto`}>{Object.entries(RP.RANGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
        <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-ink text-white text-[14px] font-semibold">Apply</button>
        <a className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] text-[14px]" href={`/crm/reports/csv?days=${days}&what=funnel`}>Export funnel (CSV)</a>
        <a className="min-h-[44px] inline-flex items-center px-4 rounded-lg border border-black/[0.15] text-[14px]" href={`/crm/reports/csv?days=${days}&what=team`}>Export team (CSV)</a>
      </form>

      <div className="grid xl:grid-cols-2 gap-x-6">
        <section className={box} aria-labelledby="fn-h"><h2 id="fn-h" className="text-[18px] font-semibold text-ink mb-1">Funnel</h2>
          <p className="text-[14px] text-ink-3 mb-3">{fun.total} leads created in range. {fun.lost} lost, {fun.on_hold} on hold.</p>
          <ol className="space-y-2">{fun.steps.map((s) => (
            <li key={s.key} className="text-[14px]"><div className="flex justify-between"><span>{s.label}</span><span><b>{s.n}</b> <small className="text-ink-4">{s.of_total}% of all &middot; {s.step}% of previous</small></span></div>
              <div className="h-2 rounded bg-cream-3 mt-1" role="presentation"><div className="h-2 rounded bg-orange" style={{ width: `${Math.round((s.n / max) * 100)}%` }} /></div></li>
          ))}</ol>
        </section>

        <section className={box} aria-labelledby="rv-h"><h2 id="rv-h" className="text-[18px] font-semibold text-ink mb-3">Revenue received, last 6 months</h2>
          <ul className="space-y-2">{rev.map((r) => (
            <li key={r.month} className="text-[14px]"><div className="flex justify-between"><span>{r.month}</span><span><b>{inr(r.amount)}</b> <small className="text-ink-4">{r.n} payment{r.n === 1 ? "" : "s"}</small></span></div>
              <div className="h-2 rounded bg-cream-3 mt-1" role="presentation"><div className="h-2 rounded bg-emerald-600" style={{ width: `${Math.round((r.amount / maxRev) * 100)}%` }} /></div></li>
          ))}</ul>
        </section>
      </div>

      <section className={box} aria-labelledby="tm-h"><h2 id="tm-h" className="text-[18px] font-semibold text-ink mb-3">Team KRAs</h2>
        <div className="overflow-x-auto"><table className="w-full text-[14px] min-w-[52rem]">
          <thead><tr><th scope="col" className={th}>Counsellor</th>{["Active", "New", "Touches", "Counselled", "Applied", "Offers", "Enrolled", "Revenue", "Overdue", "Conv."].map((h) => <th key={h} scope="col" className={`${th} text-right`}>{h}</th>)}</tr></thead>
          <tbody>{team.map((r) => (
            <tr key={r.id} className="border-t border-black/[0.07]"><th scope="row" className="py-2 pr-3 text-left font-medium">{r.name}</th>
              {[r.active, r.assigned, r.touches, r.counselled, r.applied, r.offers, r.enrolled].map((v, i) => <td key={i} className="text-right pr-3">{v}</td>)}
              <td className="text-right pr-3">{inr(r.revenue)}</td><td className={`text-right pr-3 ${r.overdue > 0 ? "text-red-700 font-bold" : ""}`}>{r.overdue}</td><td className="text-right">{r.conv}%</td></tr>
          ))}</tbody>
        </table></div>
      </section>

      <div className="grid xl:grid-cols-3 gap-x-6">
        <section className={box} aria-labelledby="sr-h"><h2 id="sr-h" className="text-[18px] font-semibold text-ink mb-3">Lead sources</h2>
          <table className="w-full text-[14px]"><thead><tr><th scope="col" className={th}>Source</th><th scope="col" className={`${th} text-right`}>Leads</th><th scope="col" className={`${th} text-right`}>Applied</th><th scope="col" className={`${th} text-right`}>Enrolled</th></tr></thead>
            <tbody>{src.map((r) => <tr key={r.source} className="border-t border-black/[0.07]"><th scope="row" className="py-1.5 pr-2 text-left font-normal">{LD.SOURCES[r.source] ?? r.source}</th><td className="text-right">{r.leads}</td><td className="text-right">{r.applied}</td><td className="text-right">{r.enrolled}</td></tr>)}</tbody></table>
        </section>
        <section className={box} aria-labelledby="cn-h"><h2 id="cn-h" className="text-[18px] font-semibold text-ink mb-3">Countries wanted</h2>
          <table className="w-full text-[14px]"><thead><tr><th scope="col" className={th}>Country</th><th scope="col" className={`${th} text-right`}>Leads</th><th scope="col" className={`${th} text-right`}>Enrolled</th></tr></thead>
            <tbody>{cn.map((r) => <tr key={r.country} className="border-t border-black/[0.07]"><th scope="row" className="py-1.5 pr-2 text-left font-normal">{r.country}</th><td className="text-right">{r.leads}</td><td className="text-right">{r.enrolled}</td></tr>)}</tbody></table>
        </section>
        <section className={box} aria-labelledby="ls-h"><h2 id="ls-h" className="text-[18px] font-semibold text-ink mb-3">Why leads were lost</h2>
          {!lost.length ? <p className="text-[14px] text-ink-3">No lost leads in this range.</p> : <ul className="space-y-1.5 text-[14px]">{lost.map((r) => <li key={r.reason} className="flex justify-between"><span>{r.reason || "No reason given"}</span><b>{r.n}</b></li>)}</ul>}
        </section>
      </div>

      <section className={box} aria-labelledby="pc-h"><h2 id="pc-h" className="text-[18px] font-semibold text-ink mb-3">Students&apos; preparation route</h2>
        <table className="w-full text-[14px]"><thead><tr><th scope="col" className={th}>Step</th><th scope="col" className={`${th} text-right`}>In progress</th><th scope="col" className={`${th} text-right`}>Done</th></tr></thead>
          <tbody>{Object.entries(PT.KINDS).map(([k, [label]]) => <tr key={k} className="border-t border-black/[0.07]"><th scope="row" className="py-1.5 pr-2 text-left font-normal">{label}</th><td className="text-right">{pathBy[k]?.active ?? 0}</td><td className="text-right">{pathBy[k]?.done ?? 0}</td></tr>)}</tbody></table>
      </section>
    </CrmPage>
  );
}
