"use client";

import { useEffect, useState } from "react";
import { AGENT } from "./data";
import { AgentAvatar, ResumeDoc, ScoreDial, usePrefersReducedMotion, type Pin } from "./ui";

const PINS: Pin[] = [
  { top: "58%", left: "52%", title: "Impact isn't quantified", agent: "mira", gain: 8 },
  { top: "40%", left: "50%", title: "Skills not tied to projects", agent: "sage", gain: 8 },
  { top: "78%", left: "40%", title: "No certification on file", agent: "lyra", gain: 12 },
];

const FIX = [
  ["mira", "Rewrote 6 bullets with numbers", "+8"],
  ["sage", "Mapped SQL gap to a 3-week plan", "+8"],
  ["lyra", "Added a Data Analytics certificate", "+12"],
] as const;

type S = { phase: number; score: number; visible: number; fixed: number };
const START: S = { phase: 0, score: 0, visible: 0, fixed: 0 };
const END: S = { phase: 3, score: 85, visible: 3, fixed: 3 };

const STATUS = ["Reading resume…", "Scored · 3 focus areas", "Agents improving", "Matched to a role"];

/** Looping product film: scan → score → agents fix → match. Pure UI, no network. */
export default function HeroConsole() {
  const reduce = usePrefersReducedMotion();
  const [s, setS] = useState<S>(START);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) { setS(END); return; }
    setS(START);
    const T: [number, Partial<S>][] = [
      [2600, { phase: 1, score: 58, visible: 1 }],
      [3200, { visible: 2 }],
      [3800, { visible: 3 }],
      [5600, { phase: 2, fixed: 1, score: 66 }],
      [6900, { fixed: 2, score: 74 }],
      [8200, { fixed: 3, score: 85 }],
      [9800, { phase: 3 }],
    ];
    const ids = T.map(([ms, patch]) => setTimeout(() => setS((p) => ({ ...p, ...patch })), ms));
    const loop = setTimeout(() => setRun((r) => r + 1), 15500);
    return () => { ids.forEach(clearTimeout); clearTimeout(loop); };
  }, [run, reduce]);

  const grade = s.score >= 80 ? "A" : s.score >= 60 ? "B" : s.score > 0 ? "C" : undefined;

  return (
    <div className="relative">
      {/* floating agents */}
      <div className="ho-bob absolute -left-3 top-24 z-20 hidden items-center gap-2 rounded-2xl border border-black/10 bg-white py-2 pl-2 pr-4 shadow-card xl:flex" style={{ opacity: s.phase >= 2 ? 1 : 0, transition: "opacity .5s" }}>
        <AgentAvatar k="mira" size={34} /><span className="text-[0.78rem] font-semibold leading-tight">RQ-Mira<span className="block font-normal text-ink-4">Rewriting your resume</span></span>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-black/10 bg-white/90 shadow-[0_50px_110px_-40px_rgba(255,106,47,0.55)] backdrop-blur">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-black/[0.06] bg-cream px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 hidden rounded-md bg-white px-3 py-1 text-[0.7rem] text-ink-4 sm:block">qrscore · resume.pdf</span>
          <span className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-bold ${s.phase === 3 ? "bg-emerald-100 text-emerald-800" : "bg-orange-light text-orange-deep"}`} aria-live="polite">
            <span className={`h-1.5 w-1.5 rounded-full ${s.phase === 3 ? "bg-emerald-500" : "animate-pulse bg-orange"}`} />{STATUS[s.phase]}
          </span>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[1fr,1.05fr] md:p-6">
          <ResumeDoc scanning={s.phase === 0} visible={s.visible} fixed={s.fixed} pins={PINS} />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-cream/70 p-4">
              <ScoreDial value={s.score} size={132} grade={grade} />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ink-4">Free resume score</p>
                <p className="font-serif text-[1.35rem] leading-tight">{s.phase === 0 ? "Reading your resume" : s.phase === 1 ? "Three things to fix" : s.phase === 2 ? "Climbing fast" : "Internship-ready"}</p>
                <p className="mt-1 text-[0.78rem] text-ink-4">Education · Experience · Skills · Projects · Impact</p>
              </div>
            </div>

            <ul className="grid gap-2" aria-label="Agent fixes">
              {FIX.map(([k, t, g], i) => {
                const done = i < s.fixed;
                const seen = i < s.visible;
                return (
                  <li key={t} className={`flex items-center gap-3 rounded-2xl border p-3 transition-all duration-500 ${done ? "border-emerald-200 bg-emerald-50" : seen ? "border-orange/25 bg-orange-lighter" : "border-black/[0.05] bg-white opacity-50"}`}>
                    <AgentAvatar k={k} size={34} ring={false} />
                    <span className="min-w-0 flex-1 text-[0.8rem] font-semibold leading-tight">
                      {AGENT[k].name}<span className="block truncate font-normal text-ink-4">{done ? t : PINS[i].title}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${done ? "bg-emerald-600 text-white" : "bg-black/[0.06] text-ink-4"}`}>{done ? g : "…"}</span>
                  </li>
                );
              })}
            </ul>

            <div className={`rounded-2xl border p-4 transition-all duration-700 ${s.phase === 3 ? "border-orange/30 bg-gradient-to-br from-orange-lighter to-white opacity-100" : "translate-y-2 border-transparent opacity-0"}`} aria-hidden={s.phase !== 3}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#7F77DD] font-bold text-white">S</span>
                  <span className="text-[0.84rem] font-semibold leading-tight">Machine Learning Intern<span className="block font-normal text-ink-4">Synapse AI · Remote · ₹25,000/mo</span></span>
                </span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[0.72rem] font-bold text-white">92% match</span>
              </div>
                          </div>
          </div>
        </div>
      </div>

      <div className="ho-bob absolute -bottom-5 right-4 z-20 hidden items-center gap-2 rounded-2xl border border-black/10 bg-white py-2 pl-2 pr-4 shadow-card md:flex" style={{ animationDelay: "-2.2s", opacity: s.phase >= 2 ? 1 : 0, transition: "opacity .5s" }}>
        <AgentAvatar k="sage" size={34} /><span className="text-[0.78rem] font-semibold leading-tight">RQ-Sage<span className="block font-normal text-ink-4">Closing your skill gap</span></span>
      </div>
    </div>
  );
}
