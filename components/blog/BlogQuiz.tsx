"use client";

import { useRef, useState } from "react";
import type { Quiz } from "@/lib/blog/local";

/**
 * The interactive quiz inside an educational post. Everything runs in the browser: the answers ship with the page (it is a self-check,
 * not an exam) and nothing is sent anywhere. Radio groups, a live score region and visible focus keep it usable by keyboard and screen reader.
 */
const BANDS: Array<{ min: number; label: string; text: string }> = [
  { min: 0.85, label: "Solid everyday skills", text: "You handle the basics and the traps. Try the challenge activities next." },
  { min: 0.6, label: "A good base with a few gaps", text: "Read the explanation for each question you missed, then do the matching practice." },
  { min: 0.33, label: "You know the ideas, not yet the habits", text: "Practise instead of rereading. Start with computer basics and documents." },
  { min: 0, label: "A fresh start", text: "That is a fine place to begin. Module 1 of the course starts from zero." },
];

export default function BlogQuiz({ quiz }: { quiz: Quiz }) {
  const n = quiz.questions.length;
  const [picked, setPicked] = useState<Array<number | null>>(() => Array(n).fill(null));
  const [done, setDone] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const answered = picked.filter((p) => p !== null).length;
  const score = picked.filter((p, i) => p === quiz.questions[i].answer).length;
  const band = BANDS.find((b) => score / n >= b.min) ?? BANDS[BANDS.length - 1];

  const submit = () => { setDone(true); setTimeout(() => result.current?.focus(), 50); };
  const retry = () => { setPicked(Array(n).fill(null)); setDone(false); top.current?.scrollIntoView({ block: "start" }); };

  return (
    <section ref={top} aria-labelledby="quiz-title" className="not-prose my-8 rounded-2xl border border-black/[0.1] bg-white p-4 shadow-sm sm:p-6" style={{ scrollMarginTop: 110 }}>
      <h3 id="quiz-title" className="text-[20px] font-bold text-ink">{quiz.title}</h3>
      <p className="mt-1 text-[14.5px] text-ink-3">{quiz.intro}</p>
      <p className="mt-2 text-[13px] font-medium text-ink-2" aria-live="polite">{done ? "Answers are shown below each question." : `${answered} of ${n} answered`}</p>
      <ol className="mt-4 space-y-5">
        {quiz.questions.map((q, i) => {
          const right = done && picked[i] === q.answer;
          const wrong = done && picked[i] !== q.answer;
          return (
            <li key={i} className={`rounded-xl border p-3.5 sm:p-4 ${right ? "border-emerald-300 bg-emerald-50/60" : wrong ? "border-amber-300 bg-amber-50/60" : "border-black/[0.08]"}`}>
              <fieldset disabled={done}>
                <legend className="mb-2 text-[15.5px] font-semibold leading-snug text-ink"><span className="mr-1.5 text-ink-3">Q{i + 1}.</span>{q.q}</legend>
                <div className="grid gap-1.5">
                  {q.options.map((o, j) => {
                    const isAnswer = done && j === q.answer;
                    const isMine = picked[i] === j;
                    return (
                      <label key={j} className={`flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-[14.5px] text-ink-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-orange-deep ${isAnswer ? "border-emerald-500 bg-emerald-100/70" : done && isMine ? "border-amber-500 bg-amber-100/70" : isMine ? "border-orange-deep bg-orange-light" : "border-black/[0.12] bg-white hover:bg-cream-2"}`}>
                        <input type="radio" name={`bq-${i}`} value={j} checked={isMine} onChange={() => setPicked((p) => p.map((x, k) => (k === i ? j : x)))} className="mt-1 accent-orange-deep" />
                        <span>{o}{isAnswer ? <b className="ml-2 text-[12px] text-emerald-800">Correct answer</b> : done && isMine ? <b className="ml-2 text-[12px] text-amber-800">Your answer</b> : null}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {done ? <p className="mt-2.5 rounded-md bg-white px-3 py-2 text-[14px] leading-relaxed text-ink-2"><b>{right ? "Right. " : picked[i] === null ? "Not answered. " : "Not quite. "}</b>{q.explain}</p> : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!done ? (
          <button type="button" onClick={submit} disabled={answered === 0} className="inline-flex min-h-[48px] items-center rounded-lg bg-orange-deep px-6 text-[15px] font-semibold text-white hover:bg-ink disabled:opacity-50">Check my score</button>
        ) : (
          <button type="button" onClick={retry} className="inline-flex min-h-[48px] items-center rounded-lg border border-black/[0.2] bg-white px-6 text-[15px] font-semibold text-ink hover:bg-cream-2">Try again</button>
        )}
        {!done && answered > 0 && answered < n ? <span className="text-[13px] text-ink-3">{n - answered} unanswered will count as wrong.</span> : null}
      </div>
      {done ? (
        <div ref={result} tabIndex={-1} role="status" className="mt-5 rounded-xl bg-ink p-5 text-white outline-none">
          <p className="text-[13px] font-semibold uppercase tracking-wide !text-white/70">Your score</p>
          <p className="text-[34px] font-bold leading-tight !text-white">{score} <span className="text-[20px] font-medium !text-white/70">out of {n}</span></p>
          <p className="mt-1 text-[16px] font-semibold !text-white">{band.label}</p>
          <p className="mt-0.5 text-[14.5px] !text-white/85">{band.text}</p>
        </div>
      ) : null}
    </section>
  );
}
