"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { freeScoreAction, type FreeScoreState } from "@/app/resume-score/actions";

const box = "bg-white rounded-2xl border border-black/[0.08] shadow-card p-5 sm:p-7 mb-6";
const fld = "w-full px-4 py-3 rounded-lg border border-black/[0.15] bg-white text-[16px] sm:text-[15px] min-h-[44px]";

function Go({ again }: { again: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="min-h-[52px] px-8 rounded-lg bg-orange hover:bg-orange-dark disabled:opacity-60 text-white font-semibold text-[16px]">{pending ? "Scoring your resume..." : again ? "Score another resume" : "Get my free score"}</button>;
}

export function FreeScoreForm() {
  const [s, action] = useActionState(freeScoreAction, {} as FreeScoreState);
  const r = s.result;
  return (
    <>
      {s.error ? <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">{s.error}</p> : null}
      {r ? (
        <>
          <section className={box} aria-labelledby="rsc-r">
            <div className="flex flex-wrap items-center gap-6 mb-5">
              <div role="img" aria-label={`RQ Score ${r.score} out of 100`} className="w-28 h-28 rounded-full grid place-items-center text-[36px] font-bold text-ink shrink-0" style={{ background: `conic-gradient(#ea580c ${r.score * 3.6}deg, #f1ede6 0)` }}>
                <span className="w-[5.5rem] h-[5.5rem] rounded-full bg-white grid place-items-center">{r.score}</span>
              </div>
              <div><h2 id="rsc-r" className="text-[22px] font-bold text-ink">Your RQ Score: {r.score} out of 100</h2><p className="text-[16px] font-semibold text-orange-deep">{r.grade}</p><p className="text-[15px] text-ink-3 mt-1">{r.verdict}</p></div>
            </div>
            <h3 className="text-[17px] font-semibold text-ink mb-2">Where to focus first</h3>
            <ol className="space-y-3 list-decimal pl-5">{r.advice.map((a) => <li key={a.title} className="text-[15px] text-ink-2"><b className="text-ink">{a.title}</b><br />{a.text}</li>)}</ol>
          </section>

          <section className={box} aria-labelledby="rsc-n">
            <h2 id="rsc-n" className="text-[22px] font-bold text-ink mb-2">Turn this score into your next job</h2>
            <p className="text-[15px] text-ink-2 mb-3">Create a free account and your result is saved to your <b>Skill Passport</b>. You also unlock:</p>
            <ul className="space-y-2.5 mb-5 text-[15px] text-ink-2">
              <li><b className="text-ink">Your full report.</b> Scores for each part of your resume, so you see exactly where you stand.</li>
              <li><b className="text-ink">Resume Studio.</b> Rebuild your resume in a format that suits your country and goal, and watch your score change as you type. 45 formats.</li>
              <li><b className="text-ink">Matched internships.</b> Paid roles ranked by how well your skills fit, with the gaps and a course to close each one.</li>
              <li><b className="text-ink">A QR-verified passport.</b> Share a signed score on your resume that recruiters can check in seconds.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup?role=student" className="min-h-[52px] inline-flex items-center px-6 rounded-lg bg-orange hover:bg-orange-dark text-white font-semibold text-[16px]">Create my free account</Link>
              <Link href="/login?next=%2Fpassport" className="min-h-[52px] inline-flex items-center px-6 rounded-lg border border-black/[0.15] font-semibold text-[16px] hover:bg-cream-2">I already have an account</Link>
            </div>
            <p className="text-[13px] text-ink-4 mt-3">Your result stays in this browser session and is added to your passport when you sign up and log in here. We keep the resume text to improve our scoring.</p>
          </section>

          {r.courses.length ? (
            <section className="mb-6" aria-labelledby="rsc-c"><h2 id="rsc-c" className="text-[20px] font-bold text-ink mb-3">Courses that fit your profile</h2>
              <div className="grid sm:grid-cols-3 gap-3">{r.courses.map((c) => (
                <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl border border-black/[0.08] p-4 hover:shadow-card"><span className="text-[12px] uppercase tracking-wide text-ink-4">{c.cat}</span><b className="block text-[15px] text-ink mt-1">{c.title}</b><span className="text-[13px] text-orange-deep">View course</span></a>
              ))}</div></section>
          ) : null}
        </>
      ) : null}

      <form action={action} className={box} aria-labelledby="rsc-f">
        <h2 id="rsc-f" className="text-[20px] font-bold text-ink mb-1">{r ? "Check another resume" : "Check your resume"}</h2>
        <p className="text-[14px] text-ink-3 mb-4">Upload a PDF, Word file or text file, or paste the text.</p>
        <div className="mb-4"><label htmlFor="resume" className="block text-[14px] font-medium text-ink-2 mb-1.5">Resume file (PDF, DOCX or TXT, up to 5 MB)</label><input type="file" id="resume" name="resume" accept=".pdf,.docx,.txt" className="text-[14px]" /></div>
        <div className="mb-5"><label htmlFor="resume_text" className="block text-[14px] font-medium text-ink-2 mb-1.5">Or paste your resume text</label><textarea id="resume_text" name="resume_text" rows={6} placeholder="Paste the text of your resume here..." className={fld} /></div>
        <Go again={!!r} />
      </form>
    </>
  );
}
