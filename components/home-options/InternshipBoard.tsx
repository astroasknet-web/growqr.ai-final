"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { INTERNSHIPS, SCORE_URL, type Internship } from "./data";
import { usePrefersReducedMotion } from "./ui";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function InternshipCard({ it, score }: { it: Internship; score: number }) {
  const gap = it.need - score;
  const state = gap <= 0 ? "open" : gap <= 15 ? "close" : "locked";
  return (
    <article className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 transition ${state === "open" ? "border-black/10 shadow-card hover:-translate-y-1 hover:shadow-glow" : "border-black/[0.06] opacity-80"}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl text-[1rem] font-bold text-white" style={{ background: it.tone }}>{it.company[0]}</span>
          <span>
            <span className="block text-[0.98rem] font-semibold leading-tight text-ink">{it.title}</span>
            <span className="block text-[0.82rem] text-ink-4">{it.company} · {it.place}</span>
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-emerald-700">✓ Verified</span>
      </div>
      <div className="mb-3 flex items-end justify-between">
        <span className="font-serif text-[2rem] leading-none text-ink">{inr(it.stipend)}<span className="font-sans text-[0.78rem] text-ink-4">/mo</span></span>
        <span className="text-[0.8rem] text-ink-4">{it.weeks} weeks</span>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {it.skills.map((s) => (<span key={s} className="rounded-full bg-cream-2 px-2.5 py-1 text-[0.72rem] font-semibold text-ink-3">{s}</span>))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
        <span className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold text-ink-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6A2F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
          First month in escrow
        </span>
        {state === "open" && <a href={SCORE_URL} className="inline-flex min-h-[40px] shrink-0 items-center whitespace-nowrap rounded-full bg-ink px-4 text-[0.82rem] font-bold text-white transition hover:bg-orange">View &amp; apply</a>}
        {state === "close" && <span className="rounded-full bg-amber-50 px-3 py-2 text-[0.76rem] font-bold text-amber-800">+{gap} pts to unlock</span>}
        {state === "locked" && <span className="rounded-full bg-black/[0.05] px-3 py-2 text-[0.76rem] font-bold text-ink-4">Build skills first</span>}
      </div>
    </article>
  );
}

/** The live internship board: drag your QR Score and watch roles unlock. */
export default function InternshipBoard({ initial = 72, showSlider = true }: { initial?: number; showSlider?: boolean }) {
  const [score, setScore] = useState(initial);
  const [filter, setFilter] = useState<"all" | "remote" | "onsite">("all");
  const reduce = usePrefersReducedMotion();
  const list = useMemo(() => {
    const f = INTERNSHIPS.filter((i) => (filter === "all" ? true : filter === "remote" ? i.remote : !i.remote));
    return [...f].sort((a, b) => Number(a.need > score) - Number(b.need > score) || b.stipend - a.stipend);
  }, [score, filter]);
  const open = INTERNSHIPS.filter((i) => i.need <= score).length;
  return (
    <div>
      {showSlider && (
        <div className="mb-6 grid gap-4 rounded-3xl border border-black/10 bg-white p-5 shadow-card md:grid-cols-[1fr,auto] md:items-center md:p-6">
          <div>
            <label htmlFor="ho-score" className="mb-2 flex items-baseline justify-between text-[0.8rem] font-bold uppercase tracking-[0.14em] text-ink-4">
              <span>Your QR Score</span>
              <span className="font-serif text-[2rem] normal-case tracking-normal text-orange">{score}</span>
            </label>
            <input id="ho-score" type="range" min={30} max={95} value={score} onChange={(e) => setScore(+e.target.value)} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-[#FFD9C2] to-orange accent-orange" aria-valuetext={`${score} out of 100`} />
            <p className="mt-2 text-[0.88rem] text-ink-3">Drag to see how a higher score unlocks better-paid roles. <strong className="text-ink">{open} of {INTERNSHIPS.length}</strong> open at {score}.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter roles">
            {([["all", "All"], ["remote", "Remote"], ["onsite", "On-site"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k} className={`min-h-[44px] rounded-full border px-5 text-[0.88rem] font-semibold transition ${filter === k ? "border-ink bg-ink text-white" : "border-black/10 bg-cream hover:border-orange"}`}>{l}</button>
            ))}
          </div>
        </div>
      )}
      <motion.ul layout={!reduce} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((it) => (
            <motion.li key={it.id} layout={!reduce} initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}>
              <InternshipCard it={it} score={score} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

/** Two counter-scrolling rows of roles (Option B). */
export function InternshipMarquee() {
  const row = (rev: boolean) => (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="ho-marq-track gap-4 pr-4" style={{ animationDirection: rev ? "reverse" : "normal", animationDuration: "55s" }}>
        {[0, 1].map((r) => (
          <div key={r} className="flex gap-4">
            {(rev ? [...INTERNSHIPS].reverse() : INTERNSHIPS).map((it) => (
              <div key={it.id + r} className="w-[290px] shrink-0"><InternshipCard it={it} score={100} /></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
  return <div className="grid gap-4">{row(false)}{row(true)}</div>;
}
