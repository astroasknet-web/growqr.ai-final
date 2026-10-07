"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { postRoleAction, type PostState } from "@/app/(portal)/employer/actions";
import { Alert } from "@/components/portal/ui";
import { CATEGORIES, LOCATIONS, MODES } from "@/lib/market/listing";
import { EMPTY, skillList } from "@/lib/market/post-role";

const input = "w-full px-4 py-3 rounded-lg border text-[16px] sm:text-[15px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/60 min-h-[44px]";
const ring = (e?: string) => (e ? "border-red-400" : "border-black/[0.12]");

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="min-h-[52px] px-8 rounded-lg bg-orange hover:bg-orange-dark disabled:opacity-60 text-white font-semibold text-[16px]">{pending ? "Submitting..." : "Submit for review"}</button>;
}

function Row({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-[14px] font-medium text-ink-2 mb-2">{label} {hint ? <span className="text-ink-4 font-normal">{hint}</span> : null}</label>
      {children}
      {error ? <p id={`${id}-err`} className="mt-1.5 text-[13px] text-red-700">{error}</p> : null}
    </div>
  );
}

export function PostForm({ company }: { company: string }) {
  const [s, action] = useActionState(postRoleAction, {} as PostState);
  const v = s.values ?? EMPTY;
  const e = s.errors ?? {};
  const [live, setLive] = useState(v);
  // A server response resets the form to its defaults; a new key re-creates the fields so selects start from the values just sent.
  const fieldsKey = useMemo(() => Math.random(), [s]); // eslint-disable-line react-hooks/exhaustive-deps
  const upd = (k: keyof typeof EMPTY) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setLive((p) => ({ ...p, [k]: ev.target.value }));
  if (s.done) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6" role="status">
        <h2 className="text-[20px] font-bold text-ink">Role submitted for review</h2>
        <p className="text-[15px] text-ink-3 mt-1">&ldquo;{s.title}&rdquo; is now with our team for verification. Once approved it appears in search and you will see applicants on your dashboard.{s.escrow ? " You asked for the Verified stipend badge; we will contact you to fund the first month in escrow before it is shown." : ""}</p>
        <p className="mt-4 flex flex-wrap gap-3">
          <Link href="/employer" className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[14px]">Back to overview</Link>
          <a href="/employer/post" className="inline-flex items-center min-h-[44px] px-5 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">Post another</a>
        </p>
      </div>
    );
  }
  const skills = skillList(live.skills);
  return (
    <div className="grid lg:grid-cols-[1fr_20rem] gap-6 items-start">
      <form action={action} className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 sm:p-7" noValidate>
        {s.error ? <Alert>{s.error}</Alert> : null}
        <div key={fieldsKey}>
        <h2 className="text-[18px] font-bold text-ink mb-4">Role basics</h2>
        <Row id="title" label="Role title" error={e.title}><input id="title" name="title" maxLength={100} defaultValue={v.title} onChange={upd("title")} placeholder="e.g. Frontend Developer Intern" aria-invalid={e.title ? true : undefined} aria-describedby="title-err" className={`${input} ${ring(e.title)}`} /></Row>
        <div className="grid sm:grid-cols-2 gap-4">
          <Row id="cat" label="Field" error={e.cat}>
            <select id="cat" name="cat" defaultValue={v.cat} aria-describedby="cat-err" className={`${input} ${ring(e.cat)}`}><option value="">Select</option>{CATEGORIES.map((c) => <option key={c[0]}>{c[0]}</option>)}</select>
          </Row>
          <Row id="mode" label="Work mode" error={e.mode}>
            <select id="mode" name="mode" defaultValue={v.mode} onChange={upd("mode")} aria-describedby="mode-err" className={`${input} ${ring(e.mode)}`}>{MODES.map((m) => <option key={m}>{m}</option>)}</select>
          </Row>
        </div>
        <Row id="loc" label="Office location" hint="(not needed for remote)" error={e.loc}>
          <select id="loc" name="loc" defaultValue={v.loc} aria-describedby="loc-err" className={`${input} ${ring(e.loc)}`}><option value="">Select</option>{LOCATIONS.filter((l) => l !== "Remote").map((l) => <option key={l}>{l}</option>)}</select>
        </Row>

        <h2 className="text-[18px] font-bold text-ink mb-4 mt-2">Stipend and duration</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Row id="stipend" label="Stipend per month (₹)" error={e.stipend}><input id="stipend" name="stipend" type="number" min={0} step={500} inputMode="numeric" defaultValue={v.stipend} onChange={upd("stipend")} aria-describedby="stipend-err" className={`${input} ${ring(e.stipend)}`} /></Row>
          <Row id="weeks" label="Duration (weeks)" error={e.weeks}><input id="weeks" name="weeks" type="number" min={2} max={26} inputMode="numeric" defaultValue={v.weeks} onChange={upd("weeks")} aria-describedby="weeks-err" className={`${input} ${ring(e.weeks)}`} /></Row>
          <Row id="openings" label="Openings" error={e.openings}><input id="openings" name="openings" type="number" min={1} max={20} inputMode="numeric" defaultValue={v.openings} aria-describedby="openings-err" className={`${input} ${ring(e.openings)}`} /></Row>
        </div>
        <label className="flex items-start gap-2.5 text-[14px] text-ink-2 mb-6 min-h-[44px]"><input type="checkbox" name="escrow" value="1" defaultChecked={v.escrow !== ""} className="mt-1" /><span>I will fund the first month in escrow to earn the <b>Verified stipend</b> badge. We will contact you to arrange it; the badge shows only after funding.</span></label>

        <h2 className="text-[18px] font-bold text-ink mb-4">What interns will do</h2>
        <Row id="about" label="Role description" error={e.about}><textarea id="about" name="about" rows={6} maxLength={2000} defaultValue={v.about} onChange={upd("about")} placeholder="Describe the team, the day-to-day work and what a great intern ships by the end." aria-describedby="about-err" className={`${input} ${ring(e.about)}`} /></Row>
        <Row id="skills" label="Required skills" hint="(comma separated)" error={e.skills}><input id="skills" name="skills" defaultValue={v.skills} onChange={upd("skills")} placeholder="React, CSS, Git" aria-describedby="skills-err" className={`${input} ${ring(e.skills)}`} /></Row>
        <Row id="question" label="One screening question" hint="(optional)"><input id="question" name="question" maxLength={200} defaultValue={v.question} placeholder="Ask something that shows how they think" className={`${input} border-black/[0.12]`} /></Row>
        </div>
        {Object.keys(e).length ? <p role="alert" className="mb-4 text-[14px] text-red-700">Please fix the highlighted fields.</p> : null}
        <Submit />
      </form>

      <aside aria-label="Live preview" className="lg:sticky lg:top-6">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-4 mb-2">Live preview</p>
        <article className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5">
          <h3 className="text-[17px] font-semibold text-ink">{live.title || "Your role title"}</h3>
          <p className="text-[14px] text-ink-3">{company}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[14px] text-ink-2"><li>{live.mode}</li><li>₹{(parseInt(live.stipend, 10) || 0).toLocaleString("en-IN")}/mo</li><li>{parseInt(live.weeks, 10) || 0} weeks</li></ul>
          <p className="text-[14px] text-ink-2 mt-3 whitespace-pre-line">{live.about || "Your description will appear here."}</p>
          <ul className="flex flex-wrap gap-2 mt-3">{skills.map((k) => <li key={k} className="px-2.5 py-1 rounded-full bg-cream-3 text-[12px]">{k}</li>)}</ul>
        </article>
        <p className="text-[13px] text-ink-3 mt-3">Minimum stipend: ₹1,000 remote, ₹2,000 on-site or hybrid.</p>
      </aside>
    </div>
  );
}
