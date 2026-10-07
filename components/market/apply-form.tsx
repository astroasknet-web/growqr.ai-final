"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { applyAction, type ApplyState } from "@/app/internships/actions";
import { Alert } from "@/components/portal/ui";

const input = "w-full px-4 py-3 rounded-lg border text-[16px] sm:text-[15px] text-ink bg-white outline-none focus:ring-2 focus:ring-orange/25 focus:border-orange/60 min-h-[44px]";
const ring = (e?: string) => (e ? "border-red-400" : "border-black/[0.12]");

function Err({ id, text }: { id: string; text?: string }) {
  return text ? <p id={id} className="mt-1.5 text-[13px] text-red-700">{text}</p> : null;
}

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="min-h-[52px] px-8 rounded-lg bg-orange hover:bg-orange-dark disabled:opacity-60 text-white font-semibold text-[16px]">{pending ? "Sending..." : "Submit application"}</button>;
}

export function ApplyForm({ slug, question, company, defaultPhone, hasPassportResume, passportResumeName }: { slug: string; question: string; company: string; defaultPhone: string; hasPassportResume: boolean; passportResumeName: string }) {
  const [s, action] = useActionState(applyAction.bind(null, slug), {} as ApplyState);
  const [count, setCount] = useState(0);
  const fieldsKey = useMemo(() => Math.random(), [s]); // eslint-disable-line react-hooks/exhaustive-deps -- remount after each response so the start-date select keeps its value
  const v = s.values;
  if (s.ok) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6" role="status">
        <h2 className="text-[20px] font-bold text-ink">Application sent</h2>
        <p className="text-[15px] text-ink-3 mt-1">{company} can now see your note and Skill Passport. Track every stage on your applications page; if they reject you, you will see the reason.</p>
        <p className="mt-4 flex flex-wrap gap-3">
          <Link href="/applications" className="inline-flex items-center min-h-[44px] px-5 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[14px]">My applications</Link>
          <Link href="/internships" className="inline-flex items-center min-h-[44px] px-5 rounded-lg border border-black/[0.15] text-[14px] font-medium hover:bg-cream-2">Keep browsing</Link>
        </p>
      </div>
    );
  }
  const f = s.fields ?? {};
  return (
    <form id="apply" action={action} className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 sm:p-7" noValidate>
      <h2 className="text-[20px] font-bold text-ink">Apply for this internship</h2>
      <p className="text-[14px] text-ink-3 mt-1 mb-5">Free to apply. Your Skill Passport is shared with the employer.</p>
      {s.error ? <Alert>{s.error}</Alert> : null}

      <div key={fieldsKey}>
      <div className="mb-5">
        <label htmlFor="note" className="block text-[14px] font-medium text-ink-2 mb-2">Why are you a good fit? <span className="text-ink-4 font-normal">required</span></label>
        <textarea id="note" name="note" rows={5} maxLength={1500} defaultValue={v?.note} onChange={(e) => setCount(Array.from(e.target.value).length)} aria-invalid={f.note ? true : undefined} aria-describedby="note-err note-count" className={`${input} ${ring(f.note)}`} />
        <div className="flex justify-between"><Err id="note-err" text={f.note} /><span id="note-count" className="ml-auto mt-1.5 text-[12px] text-ink-4">{count} / 1500</span></div>
      </div>

      <div className="mb-5">
        <label htmlFor="answer" className="block text-[14px] font-medium text-ink-2 mb-2">{question || "Tell the employer one thing about your work that is not on your resume."} <span className="text-ink-4 font-normal">required</span></label>
        <textarea id="answer" name="answer" rows={3} maxLength={1000} defaultValue={v?.answer} aria-invalid={f.answer ? true : undefined} aria-describedby="answer-err" className={`${input} ${ring(f.answer)}`} />
        <Err id="answer-err" text={f.answer} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label htmlFor="phone" className="block text-[14px] font-medium text-ink-2 mb-2">Phone number <span className="text-ink-4 font-normal">required</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v?.phone ?? defaultPhone} aria-invalid={f.phone ? true : undefined} aria-describedby="phone-err" className={`${input} ${ring(f.phone)}`} />
          <Err id="phone-err" text={f.phone} />
        </div>
        <div>
          <label htmlFor="avail" className="block text-[14px] font-medium text-ink-2 mb-2">Available to start <span className="text-ink-4 font-normal">required</span></label>
          <select id="avail" name="avail" defaultValue={v?.avail ?? ""} aria-invalid={f.avail ? true : undefined} aria-describedby="avail-err" className={`${input} ${ring(f.avail)}`}>
            <option value="">Select</option>
            <option value="immediate">Immediately</option>
            <option value="2weeks">Within 2 weeks</option>
            <option value="1month">Within a month</option>
          </select>
          <Err id="avail-err" text={f.avail} />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="resume" className="block text-[14px] font-medium text-ink-2 mb-2">Resume (PDF or DOCX, max 5 MB)</label>
        <input id="resume" name="resume" type="file" accept=".pdf,.docx" aria-invalid={f.resume ? true : undefined} aria-describedby="resume-err" className="block w-full text-[14px]" />
        {hasPassportResume ? (
          <label className="flex items-center gap-2.5 mt-3 text-[14px] text-ink-2 min-h-[44px]"><input type="checkbox" name="use_passport" value="1" />Use my Skill Passport resume ({passportResumeName || "saved resume"})</label>
        ) : (
          <p className="mt-2 text-[13px] text-ink-3">Tip: <Link className="underline" href="/passport">score your resume</Link> once and reuse it on every application.</p>
        )}
        <Err id="resume-err" text={f.resume} />
      </div>

      <div className="mb-5">
        <label className="flex items-start gap-2.5 text-[14px] text-ink-2 min-h-[44px]"><input type="checkbox" name="consent" value="1" className="mt-1" />I confirm these details are mine and accurate.</label>
        <Err id="consent-err" text={f.consent} />
      </div>
      </div>
      {Object.keys(f).length ? <p role="alert" className="mb-4 text-[14px] text-red-700">Please fix the highlighted fields.</p> : null}
      <Submit />
    </form>
  );
}
