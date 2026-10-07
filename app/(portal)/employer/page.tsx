import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/portal/guard";
import * as apps from "@/lib/market/applications";
import * as jobs from "@/lib/market/jobs";
import { Alert } from "@/components/portal/ui";
import { Card, PortalPage } from "@/components/portal/shell";
import { moveApplicantAction } from "./actions";

export const metadata: Metadata = { title: "Employer dashboard | GrowQR" };
export const dynamic = "force-dynamic";

const TIER: Record<string, string> = { verified: "verified", certificate: "certificate", self: "self-reported" };
const input = "w-full min-h-[44px] px-3 rounded-lg border border-black/[0.15] bg-white text-[14px]";

export default async function EmployerPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser("employer");
  const sp = await searchParams;
  const company = await jobs.companyOf(me.id);
  const list = await jobs.forEmployer(me.id);
  const want = parseInt(sp.r ?? "", 10) || 0;
  const sel = list.find((j) => j.id === want) ?? list.find((j) => j.applicants > 0) ?? list[0] ?? null;
  const cnt = await apps.counts(me.id);
  const board: Record<string, apps.Applicant[]> = Object.fromEntries(apps.STAGES.map((s) => [s, []]));
  if (sel) for (const a of await apps.forJob(sel.id)) (board[String(a.status)] ?? (board[String(a.status)] = [])).push(a);

  return (
    <PortalPage user={me} active="employer" title="Hiring overview" subtitle="Applicants are ranked by match score, not by cover letter length." wide="full">
      {company && Number(company.verified) !== 1 ? <Alert kind="info">Your company is pending verification. Your first role goes live after our team reviews it, usually within one business day.</Alert> : null}
      {sp.moved ? <Alert kind="success">Applicant updated. The student can see the new stage.</Alert> : null}
      {sp.error ? <Alert>{sp.error}</Alert> : null}

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["Live roles", cnt.live_roles, `${cnt.pending_roles} in review`], ["Applicants", cnt.total_apps, `${cnt.new_apps} in the last 7 days`], ["Roles posted", list.length, "all time"], ["Company", company?.name ?? "", Number(company?.verified) === 1 ? "Verified employer" : "Awaiting verification"]].map(([k, v, s]) => (
          <div key={String(k)} className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5">
            <dt className="text-[13px] text-ink-4">{k}</dt><dd className="text-[24px] font-bold text-ink break-words">{v}</dd><dd className="text-[13px] text-ink-3">{s}</dd>
          </div>
        ))}
      </dl>
      <p className="mb-6"><Link href="/employer/post" className="inline-flex items-center min-h-[48px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[15px]">Post a role</Link></p>

      {!sel ? (
        <Card title="You have not posted a role yet"><p className="text-[15px] text-ink-3">Post your first internship and start receiving applicants ranked by match.</p></Card>
      ) : (
        <>
          <section aria-labelledby="kb-h" className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 id="kb-h" className="text-[20px] font-bold text-ink">Applicants: {sel.title}</h2>
              <form method="get" className="flex items-center gap-2">
                <label htmlFor="role-pick" className="sr-only">Choose role</label>
                <select id="role-pick" name="r" defaultValue={sel.id} className={input}>
                  {list.map((j) => <option key={j.id} value={j.id}>{j.title} ({j.applicants})</option>)}
                </select>
                <button type="submit" className="min-h-[44px] px-4 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">Show</button>
              </form>
            </div>
            {sel.status !== "live" ? <p className="text-[14px] text-ink-3 mb-3">This role is <b>{sel.status}</b>, so it is not visible to students yet.</p> : null}
            <div className="flex gap-4 overflow-x-auto pb-3" role="list">
              {Object.entries(board).map(([col, cards]) => (
                <section key={col} role="listitem" aria-label={col} className="w-72 shrink-0 bg-cream-3/60 rounded-2xl p-3">
                  <h3 className="text-[14px] font-semibold text-ink mb-2">{col} <span className="ml-1 text-ink-4">{cards.length}</span></h3>
                  {!cards.length ? <p className="text-[13px] text-ink-4 px-1 py-2">No candidates here</p> : null}
                  <div className="space-y-3">
                    {cards.map((c) => (
                      <article key={c.id} className="bg-white rounded-xl border border-black/[0.08] p-3.5">
                        <div className="flex justify-between gap-2"><b className="text-[15px] text-ink">{c.name}</b>{c.match_score !== null && c.match_score !== undefined ? <span title="Match score at the time of applying" className="px-2 rounded-full bg-orange-light text-orange-deep text-[12px] font-semibold h-6 grid place-items-center">{Number(c.match_score)}</span> : null}</div>
                        <p className="text-[13px] text-ink-3">{String(c.college || "College not provided")}{c.rq_grade ? ` · RQ ${c.rq_grade}` : ""}</p>
                        {c.skills.length ? <ul className="flex flex-wrap gap-1.5 mt-2">{c.skills.slice(0, 3).map((s) => <li key={s} className="px-2 py-0.5 rounded-full bg-cream-3 text-[12px] text-ink-2">{s}</li>)}</ul> : null}
                        <details className="mt-2">
                          <summary className="cursor-pointer text-[13px] font-medium text-orange-dark min-h-[36px] flex items-center">View application</summary>
                          <div className="text-[13px] text-ink-2 space-y-2 mt-1">
                            <p className="font-semibold text-ink">Why they fit</p><p className="whitespace-pre-line">{String(c.note)}</p>
                            <p className="font-semibold text-ink">Screening answer</p><p className="whitespace-pre-line">{String(c.answer)}</p>
                            {c.courses.length ? (<><p className="font-semibold text-ink">Completed courses</p><ul>{c.courses.map((cc) => <li key={cc.title}>{cc.title} <span className="text-ink-4">({TIER[cc.tier]})</span></li>)}</ul></>) : null}
                            <p className="font-semibold text-ink">Contact</p><p className="break-all">{c.email} &middot; {String(c.phone)} &middot; starts {String(c.availability)}</p>
                            <p><a className="underline" href={`/employer/resume/${c.id}`} target="_blank" rel="noopener noreferrer">Open resume</a></p>
                            <form action={moveApplicantAction} className="space-y-2 pt-1">
                              <input type="hidden" name="app_id" value={c.id} />
                              <label className="sr-only" htmlFor={`st-${c.id}`}>Move to stage</label>
                              <select id={`st-${c.id}`} name="status" defaultValue={String(c.status)} className={input}>{apps.STAGES.map((s) => <option key={s}>{s}</option>)}</select>
                              <label className="sr-only" htmlFor={`nt-${c.id}`}>Note to student</label>
                              <input id={`nt-${c.id}`} name="note" type="text" maxLength={255} placeholder="Note (required if rejecting)" className={input} />
                              <button type="submit" className="w-full min-h-[44px] rounded-lg bg-ink text-white text-[14px] font-semibold">Update</button>
                            </form>
                          </div>
                        </details>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <Card title="Your roles">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead><tr className="text-left text-ink-4"><th scope="col" className="py-2 pr-4">Role</th><th scope="col" className="pr-4">Status</th><th scope="col" className="pr-4">Applicants</th><th scope="col">Stipend</th></tr></thead>
                <tbody>
                  {list.map((j) => (
                    <tr key={j.id} className="border-t border-black/[0.07]">
                      <th scope="row" className="py-3 pr-4 text-left font-medium"><Link className="hover:underline" href={`/employer?r=${j.id}`}>{j.title}</Link></th>
                      <td className="pr-4">{j.status}</td><td className="pr-4">{j.applicants}</td><td>₹{j.stipend.toLocaleString("en-IN")}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </PortalPage>
  );
}
