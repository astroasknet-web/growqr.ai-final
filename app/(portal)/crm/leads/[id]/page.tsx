import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { appUrl } from "@/lib/portal/mail";
import { gate } from "@/lib/crm/gate";
import * as AC from "@/lib/crm/access";
import * as DC from "@/lib/crm/docs";
import * as LD from "@/lib/crm/leads";
import * as MN from "@/lib/crm/money";
import * as PT from "@/lib/crm/path";
import * as VF from "@/lib/crm/verify";
import { CrmPage, fieldCls, inr, StagePill, when } from "@/components/crm/crm-page";
import { leadAction } from "../../actions";

export const metadata: Metadata = { title: "Lead | Overseas CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const box = "bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 mb-5";
const lab = "block text-[13px] font-medium text-ink-2 mb-1";
const btn = "min-h-[44px] px-4 rounded-lg bg-ink text-white text-[14px] font-semibold";
const ghost = "min-h-[44px] px-4 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2";
const dt = (ts: string | null) => (ts ? String(ts).slice(0, 16).replace(" ", "T") : "");

function Act({ id, act, disabled, className, children }: { id: number; act: string; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <form action={leadAction} className={className}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="act" value={act} />
      <fieldset disabled={disabled} className="contents">{children}</fieldset>
    </form>
  );
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = /^\d{1,9}$/.test(raw) ? Number(raw) : 0;
  const { me, manager } = await gate(false, `/crm/leads/${id}`);
  const lead = id ? await LD.find(id) : null;
  if (!lead || !(await LD.canView(me, lead))) notFound();
  const edit = await LD.canEdit(me, lead);
  const [tasks, acts, apps, ms, docs, vers, pays, staff, submittable] = await Promise.all([
    LD.tasks(id), LD.activities(id), LD.applications(id), PT.forLead(id), DC.forLead(id), VF.forLead(id), MN.forLead(id), AC.staff(), VF.submittable(id),
  ]);
  const sum = await MN.summary(id);
  const link = await appUrl(`file/${lead.access_token}`);
  const prog = PT.progress(ms);
  const cur = LD.stageIndex(lead.stage);
  const dis = !edit;

  return (
    <CrmPage me={me} manager={manager} tab="leads" title={lead.name} actions={<Link href="/crm/leads" className={`${ghost} inline-flex items-center`}>All leads</Link>}>
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="mb-2"><StagePill stage={lead.stage} /> {lead.stage === "lost" && lead.lost_reason ? <span className="text-ink-3 text-[14px]">({lead.lost_reason})</span> : null}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-ink-2">
            {lead.phone ? <span><b>Phone</b> <a className="underline" href={`tel:${lead.phone}`}>{lead.phone}</a></span> : null}
            {lead.email ? <span><b>Email</b> <a className="underline" href={`mailto:${lead.email}`}>{lead.email}</a></span> : null}
            <span><b>Owner</b> {lead.counsellor_name || "Unassigned"}</span><span><b>Source</b> {LD.SOURCES[lead.source] ?? lead.source}</span><span><b>Added</b> {when(lead.created_at, { day: "numeric", month: "short", year: "numeric" })}</span>
          </p>
        </div>
        {lead.counsellor_id === null ? <Act id={id} act="claim"><button className="min-h-[44px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold" type="submit">Claim this lead</button></Act> : null}
      </div>
      {!edit && lead.counsellor_id !== null ? <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[14px] text-amber-900">This lead belongs to {lead.counsellor_name}. You can read it but not change it.</p> : null}

      <ol className="flex flex-wrap gap-2 mb-6" aria-label="Funnel progress">
        {Object.entries(LD.STAGES).filter(([k]) => k !== "on_hold" && k !== "lost").map(([k, label]) => {
          const i = LD.stageIndex(k);
          return <li key={k} aria-current={cur === i ? "step" : undefined} className={`px-3 py-1.5 rounded-full text-[12px] border ${cur > i ? "bg-emerald-50 border-emerald-200 text-emerald-800" : cur === i ? "bg-orange-light border-orange/40 text-orange-deep font-semibold" : "bg-white border-black/[0.1] text-ink-4"}`}>{cur > i ? "✓ " : ""}{label}</li>;
        })}
      </ol>

      <div className="grid xl:grid-cols-2 gap-x-6">
        <div>
          <section id="profile" className={box} aria-labelledby="pf-h"><h2 id="pf-h" className="text-[18px] font-semibold text-ink mb-3">Student profile</h2>
            <Act id={id} act="profile" disabled={dis} className="grid sm:grid-cols-2 gap-3">
              {([["name", "Name", lead.name], ["phone", "Phone", lead.phone], ["email", "Email", lead.email], ["city", "City", lead.city], ["qualification", "Qualification", lead.qualification], ["percentage", "Percentage", lead.percentage ?? ""], ["pref_course", "Preferred course", lead.pref_course], ["intake", "Intake", lead.intake], ["budget_inr", "Budget (INR)", lead.budget_inr ?? ""]] as const).map(([k, l, v]) => (
                <div key={k}><label className={lab} htmlFor={`p-${k}`}>{l}</label><input id={`p-${k}`} name={k} defaultValue={String(v)} className={fieldCls} /></div>
              ))}
              <div><label className={lab} htmlFor="p-country">Preferred country</label><select id="p-country" name="pref_country" defaultValue={lead.pref_country} className={fieldCls}><option value="">Not decided</option>{LD.COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div className="sm:col-span-2"><button className={btn} type="submit">Save profile</button></div>
            </Act>
          </section>

          <section className={box} aria-labelledby="st-h"><h2 id="st-h" className="text-[18px] font-semibold text-ink mb-3">Stage and owner</h2>
            <Act id={id} act="move" disabled={dis} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-4">
              <div><label className={lab} htmlFor="m-stage">Move to</label><select id="m-stage" name="stage" defaultValue={lead.stage} className={fieldCls}>{Object.entries(LD.STAGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div><label className={lab} htmlFor="m-note">Note, or why lost</label><input id="m-note" name="note" list="lost-reasons" maxLength={160} className={fieldCls} /><datalist id="lost-reasons">{LD.LOST_REASONS.map((r) => <option key={r} value={r} />)}</datalist><input type="hidden" name="lost_reason" value="" /></div>
              <button className={btn} type="submit">Update stage</button>
            </Act>
            {manager ? (
              <Act id={id} act="assign" className="flex flex-wrap gap-3 items-end">
                <div><label className={lab} htmlFor="a-own">Owner</label><select id="a-own" name="counsellor_id" defaultValue={lead.counsellor_id ?? 0} className={fieldCls}><option value={0}>Unassigned pool</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <button className={btn} type="submit">Reassign</button>
              </Act>
            ) : null}
          </section>

          <section id="timeline" className={box} aria-labelledby="tl-h"><h2 id="tl-h" className="text-[18px] font-semibold text-ink mb-3">Log a contact</h2>
            <Act id={id} act="log" disabled={dis} className="grid sm:grid-cols-2 gap-3 mb-4">
              <div><label className={lab} htmlFor="l-kind">What happened</label><select id="l-kind" name="kind" className={fieldCls}>{Object.entries(LD.KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div><label className={lab} htmlFor="l-next">Next follow-up</label><input id="l-next" name="next" type="datetime-local" defaultValue={dt(lead.next_followup_at)} className={fieldCls} /></div>
              <div className="sm:col-span-2"><label className={lab} htmlFor="l-body">Notes</label><textarea id="l-body" name="body" rows={3} maxLength={1000} className={fieldCls} /></div>
              <div className="sm:col-span-2"><button className={btn} type="submit">Save to timeline</button></div>
            </Act>
            <ul className="space-y-2.5">{acts.map((a) => <li key={String(a.id)} className="text-[14px] text-ink-2 border-l-2 border-black/[0.1] pl-3"><b className="text-[12px] uppercase tracking-wide text-ink-4">{a.kind}</b> {a.body}<br /><small className="text-ink-4">{a.actor || "System"} &middot; {when(a.created_at)}</small></li>)}</ul>
          </section>
        </div>

        <div>
          <section className={box} aria-labelledby="tk-h"><h2 id="tk-h" className="text-[18px] font-semibold text-ink mb-3">Tasks</h2>
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-1.5 text-[14px]">
                <span className={t.done_at ? "line-through text-ink-4" : "text-ink"}>{t.title} <small className="text-ink-4">{t.assignee} &middot; {when(t.due_at)}</small></span>
                {!t.done_at ? <Act id={id} act="task_done" disabled={dis}><input type="hidden" name="task" value={t.id} /><button className={ghost} type="submit">Done</button></Act> : null}
              </div>
            ))}
            <Act id={id} act="task_add" disabled={dis} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end mt-3">
              <div><label className={lab} htmlFor="t-title">New task</label><input id="t-title" name="title" maxLength={160} className={fieldCls} /></div>
              <div><label className={lab} htmlFor="t-due">Due</label><input id="t-due" name="due" type="datetime-local" className={fieldCls} /></div>
              <input type="hidden" name="assignee" value={me.id} /><button className={btn} type="submit">Add</button>
            </Act>
          </section>

          <section id="apps" className={box} aria-labelledby="ap-h"><h2 id="ap-h" className="text-[18px] font-semibold text-ink mb-3">University applications</h2>
            {apps.map((a) => (
              <div key={a.id} className="py-2 border-b border-black/[0.07]">
                <b className="text-ink">{a.university}</b> <small className="text-ink-3">{String(a.country || "")} &middot; {a.program} &middot; {a.intake}</small>
                <Act id={id} act="app_set" disabled={dis} className="flex flex-wrap gap-2 mt-1.5"><input type="hidden" name="app" value={a.id} />
                  <select name="status" defaultValue={a.status} aria-label={`Status of ${a.university}`} className={fieldCls + " !w-auto"}>{Object.entries(LD.APP_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  <select name="offer_type" defaultValue={a.offer_type} aria-label="Offer type" className={fieldCls + " !w-auto"}><option value="">No offer type</option><option value="conditional">Conditional</option><option value="unconditional">Unconditional</option></select>
                  <button className={ghost} type="submit">Update</button></Act>
              </div>
            ))}
            <Act id={id} act="app_add" disabled={dis} className="grid sm:grid-cols-2 gap-3 mt-3">
              <div><label className={lab} htmlFor="ap-uni">University</label><input id="ap-uni" name="university" maxLength={160} className={fieldCls} /></div>
              <div><label className={lab} htmlFor="ap-cn">Country</label><input id="ap-cn" name="country" maxLength={40} className={fieldCls} /></div>
              <div><label className={lab} htmlFor="ap-pr">Program</label><input id="ap-pr" name="program" maxLength={160} className={fieldCls} /></div>
              <div><label className={lab} htmlFor="ap-in">Intake</label><input id="ap-in" name="intake" maxLength={30} className={fieldCls} /></div>
              <div className="sm:col-span-2"><button className={btn} type="submit">Add application</button></div>
            </Act>
          </section>
        </div>
      </div>

      <section id="path" className={box} aria-labelledby="pa-h"><h2 id="pa-h" className="text-[18px] font-semibold text-ink">The student&apos;s route: tests, internship, community service</h2>
        <p className="text-[14px] text-ink-3 mb-3">{prog}% of the route is done. IELTS, TOEFL, PTE or Duolingo: one English test is enough. SAT, ACT, GRE and GMAT count once started.</p>
        <div className="grid lg:grid-cols-2 gap-3">
          {Object.entries(PT.KINDS).map(([k, [label, group, hint]]) => {
            const m = ms[k];
            return (
              <Act key={k} id={id} act="ms" disabled={dis} className="rounded-xl border border-black/[0.08] p-3 grid grid-cols-2 gap-2"><input type="hidden" name="kind" value={k} />
                <div className="col-span-2 flex justify-between gap-2"><b className="text-[14px] text-ink">{label}</b><small className="text-ink-4">{group}</small></div>
                <select name="status" defaultValue={m?.status ?? "not_started"} aria-label={`${label} status`} className={fieldCls}>{Object.entries(PT.STATUS).map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select>
                <input name="score" defaultValue={m?.score ?? ""} maxLength={30} placeholder="Score" aria-label={`${label} score`} className={fieldCls} />
                <input name="exam_date" type="date" defaultValue={m?.exam_date ?? ""} aria-label={`${label} exam date`} className={fieldCls} />
                <input name="target_date" type="date" defaultValue={m?.target_date ?? ""} aria-label={`${label} target date`} className={fieldCls} />
                <input name="detail" defaultValue={m?.detail ?? ""} maxLength={255} placeholder={hint} aria-label={`${label} details`} className={`${fieldCls} col-span-2`} />
                <button className={`${ghost} col-span-2`} type="submit">Save {label}</button>
              </Act>
            );
          })}
        </div>
      </section>

      <div className="grid xl:grid-cols-2 gap-x-6">
        <section id="docs" className={box} aria-labelledby="dc-h"><h2 id="dc-h" className="text-[18px] font-semibold text-ink mb-3">Documents</h2>
          <ul className="divide-y divide-black/[0.07] mb-3">{docs.map((d) => (
            <li key={d.id} className="py-2 flex flex-wrap justify-between gap-2 text-[14px]"><span><b className="text-ink">{DC.TYPES[d.doc_type]}</b><br /><small className="text-ink-3">{d.original_name} &middot; {d.status.replace("_", " ")} &middot; {d.uploaded_by === null ? "uploaded by the student" : "uploaded by staff"}</small></span>
              <span className="flex gap-2"><a className={`${ghost} inline-flex items-center`} href={`/crm/doc/${d.id}`} target="_blank" rel="noopener noreferrer">Open</a>
                {d.status !== "in_verification" ? <Act id={id} act="doc_delete" disabled={dis}><input type="hidden" name="doc" value={d.id} /><button className={`${ghost} text-red-700`} type="submit">Remove</button></Act> : null}</span></li>
          ))}</ul>
          <Act id={id} act="doc_upload" disabled={dis} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div><label className={lab} htmlFor="d-type">Type</label><select id="d-type" name="doc_type" className={fieldCls}>{Object.entries(DC.TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className={lab} htmlFor="d-file">File (PDF, JPG, PNG, DOCX, 8 MB)</label><input id="d-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" className="text-[14px]" /></div>
            <button className={btn} type="submit">Upload</button>
          </Act>
        </section>

        <section id="verify" className={box} aria-labelledby="vf-h"><h2 id="vf-h" className="text-[18px] font-semibold text-ink mb-1">Third-party verification</h2>
          <p className="text-[13px] text-ink-3 mb-3">The student pays the fee. Nothing goes to {VF.provider()} until it is paid.</p>
          {vers.map(async (v) => {
            const items = await VF.items(v.id);
            return (
              <div key={v.id} className="rounded-xl border border-black/[0.08] p-3 mb-3">
                <p className="text-[14px]"><b>#{v.id}</b> {VF.STATUS[v.status]} &middot; fee {inr(v.fee_inr)} {v.reference ? <>&middot; ref {v.reference}</> : null}</p>
                <ul className="mt-2 space-y-1.5 text-[14px]">{items.map((it) => (
                  <li key={it.id} className="flex flex-wrap items-center justify-between gap-2"><span>{DC.TYPES[it.doc_type]} <small className="text-ink-4">{VF.RESULT[it.result]}{it.note ? ` · ${it.note}` : ""}</small></span>
                    {v.status === "in_progress" && it.result === "pending" ? (
                      <Act id={id} act="verify_result" disabled={dis} className="flex gap-2"><input type="hidden" name="item" value={it.id} />
                        <select name="result" aria-label="Result" className={fieldCls + " !w-auto"}><option value="verified">Verified</option><option value="mismatch">Mismatch</option><option value="unverifiable">Could not verify</option></select>
                        <input name="note" maxLength={255} placeholder="Note" aria-label="Note" className={fieldCls + " !w-auto"} /><button className={ghost} type="submit">Record</button></Act>
                    ) : null}</li>
                ))}</ul>
                {v.status === "in_progress" ? <Act id={id} act="verify_case" disabled={dis} className="flex flex-wrap gap-2 mt-2"><input type="hidden" name="v" value={v.id} /><input name="provider" defaultValue={v.provider} aria-label="Partner" className={fieldCls + " !w-auto"} /><input name="reference" defaultValue={v.reference} placeholder="Case number" aria-label="Case number" className={fieldCls + " !w-auto"} /><button className={ghost} type="submit">Save case</button></Act> : null}
                {v.status === "awaiting_payment" ? <Act id={id} act="verify_cancel" disabled={dis} className="mt-2"><input type="hidden" name="v" value={v.id} /><button className={ghost} type="submit">Cancel before payment</button></Act> : null}
              </div>
            );
          })}
          {submittable.length ? (
            <Act id={id} act="verify_request" disabled={dis}>
              <fieldset><legend className={lab}>Documents to verify (fee INR {VF.fee(1)} for one, {VF.fee(submittable.length)} for all)</legend>
                {submittable.map((d) => <label key={d.id} className="flex items-center gap-2.5 min-h-[40px] text-[14px]"><input type="checkbox" name="docs" value={d.id} />{DC.TYPES[d.doc_type]} <small className="text-ink-4">{d.original_name}</small></label>)}</fieldset>
              <button className={`${btn} mt-2`} type="submit">Open verification</button>
            </Act>
          ) : <p className="text-[14px] text-ink-3">No documents are waiting to be verified.</p>}
        </section>
      </div>

      <section id="money" className={box} aria-labelledby="mo-h"><h2 id="mo-h" className="text-[18px] font-semibold text-ink mb-1">Fees</h2>
        <p className="text-[14px] text-ink-3 mb-3">Received {inr(sum.received)} &middot; due {inr(sum.due)}</p>
        <ul className="divide-y divide-black/[0.07] mb-3">{pays.map((p) => (
          <li key={p.id} className="py-2 flex flex-wrap justify-between gap-2 text-[14px]"><span><b>{MN.KINDS[p.kind]}</b> {inr(p.amount_inr)} <small className="text-ink-3">{p.status}{p.method ? ` · ${MN.METHODS[p.method] ?? p.method}` : ""}{p.reference ? ` · ${p.reference}` : ""}</small></span>
            {p.status === "due" && manager ? (
              <Act id={id} act="pay_receive" className="flex flex-wrap gap-2"><input type="hidden" name="pay" value={p.id} />
                <select name="method" aria-label="Method" className={fieldCls + " !w-auto"}>{Object.entries(MN.METHODS).filter(([k]) => k !== "razorpay").map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                <input name="reference" maxLength={80} placeholder="Reference" aria-label="Reference" className={fieldCls + " !w-auto"} /><button className={ghost} type="submit">Mark received</button></Act>
            ) : null}</li>
        ))}</ul>
        {manager ? (
          <Act id={id} act="pay_add" className="grid sm:grid-cols-3 gap-3">
            <div><label className={lab} htmlFor="f-kind">Fee</label><select id="f-kind" name="kind" className={fieldCls}>{Object.entries(MN.KINDS).filter(([k]) => k !== "verification").map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className={lab} htmlFor="f-amt">Amount (Rs)</label><input id="f-amt" name="amount" inputMode="numeric" className={fieldCls} /></div>
            <div><label className={lab} htmlFor="f-st">Status</label><select id="f-st" name="status" className={fieldCls}><option value="due">Raise as due</option><option value="received">Already received</option></select></div>
            <div><label className={lab} htmlFor="f-due">Due on</label><input id="f-due" name="due_on" type="date" className={fieldCls} /></div>
            <div><label className={lab} htmlFor="f-meth">Method</label><select id="f-meth" name="method" className={fieldCls}><option value="">-</option>{Object.entries(MN.METHODS).filter(([k]) => k !== "razorpay").map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div><label className={lab} htmlFor="f-ref">Reference</label><input id="f-ref" name="reference" maxLength={80} className={fieldCls} /></div>
            <input type="hidden" name="note" value="" /><div className="sm:col-span-3"><button className={btn} type="submit">Record fee</button></div>
          </Act>
        ) : <p className="text-[13px] text-ink-4">Only a manager can record fees.</p>}
      </section>

      <section className={box} aria-labelledby="sl-h"><h2 id="sl-h" className="text-[18px] font-semibold text-ink mb-2">The student&apos;s private file link</h2>
        <p className="text-[14px] text-ink-3 mb-2">Share this with the student so they can upload documents and pay the verification fee. Anyone with the link can open it.</p>
        <input readOnly value={link} aria-label="Student file link" className={`${fieldCls} font-mono text-[13px]`} />
        <div className="flex flex-wrap gap-3 mt-3">
          <Act id={id} act="new_link" disabled={dis}><button className={ghost} type="submit">Make a new link (old one stops working)</button></Act>
          {manager ? <Act id={id} act="erase" className="flex gap-2 items-end"><div><label className={lab} htmlFor="er">Type DELETE to erase this lead and its files</label><input id="er" name="confirm" autoComplete="off" className={fieldCls} /></div><button className={`${btn} !bg-red-700`} type="submit">Erase</button></Act> : null}
        </div>
      </section>
    </CrmPage>
  );
}
