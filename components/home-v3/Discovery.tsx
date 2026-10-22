"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { GOALS, VERTICALS } from "./data";

/** Rules-based guide: each goal maps to one fixed recommendation. Not AI, and the copy says so. */
export default function Discovery() {
  const [id, setId] = useState<string>(GOALS[0].id);
  const goal = GOALS.find((g) => g.id === id)!;
  const vertical = VERTICALS.find((v) => v.key === goal.vertical)!;
  const Icon = vertical.icon;
  const cta = goal.external
    ? <a href={goal.href} target="_blank" rel="noopener noreferrer" className="hx-btn hx-btn-dark mt-8">{goal.cta} <ArrowRight className="h-4 w-4" aria-hidden /></a>
    : <Link href={goal.href} className="hx-btn hx-btn-dark mt-8">{goal.cta} <ArrowRight className="h-4 w-4" aria-hidden /></Link>;

  return (
    <section id="journey" className="scroll-mt-24 bg-white px-6 py-24 md:px-14 md:py-32" aria-labelledby="hx-journey">
      <div className="mx-auto grid max-w-[1180px] items-start gap-12 lg:grid-cols-[0.9fr,1.1fr]">
        <div>
          <h2 data-rv id="hx-journey" className="text-[clamp(2rem,4.2vw,3.2rem)] font-semibold leading-[1.07] tracking-tight text-[var(--hx-text)]">Your Journey. Your Goals. <span className="hx-grad-text">Your Next Step.</span></h2>
          <p data-rv className="mt-4 text-[1.05rem] leading-relaxed text-[var(--hx-muted)]">Tell us what you want to do. This is a simple guide, not an AI: each goal points you to the part of GrowQR built for it.</p>
          <div data-rv role="radiogroup" aria-label="Choose your goal" className="mt-8 grid gap-2.5">
            {GOALS.map((g) => {
              const on = g.id === id;
              return (
                <button key={g.id} type="button" role="radio" aria-checked={on} onClick={() => setId(g.id)}
                  className={`flex min-h-[52px] items-center justify-between rounded-2xl border px-5 text-left text-[0.98rem] font-medium transition ${on ? "border-[var(--hx-violet)] bg-[var(--hx-violet)]/[0.07] text-[var(--hx-text)] shadow-[0_8px_30px_-14px_rgba(120,87,255,.6)]" : "border-slate-200 bg-white text-[var(--hx-text)] hover:border-[var(--hx-violet)]/50"}`}>
                  {g.label}
                  <span aria-hidden className={`grid h-5 w-5 place-items-center rounded-full border ${on ? "border-[var(--hx-violet)] bg-[var(--hx-violet)] text-white" : "border-slate-300"}`}>{on && <Check className="h-3 w-3" />}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div data-rv style={{ ["--d" as string]: ".1s" }} aria-live="polite" className={`hx-v-${goal.vertical} relative overflow-hidden rounded-[32px] bg-[var(--hx-navy)] p-8 text-white md:p-10`}>
          <span aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-[70px]" style={{ background: "var(--v)" }} />
          <div className="relative">
            <span className="hx-chip"><Icon className="h-5 w-5" aria-hidden /></span>
            <p className="mt-5 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-white/55">Recommended: {vertical.name}</p>
            <h3 className="mt-2 text-[1.7rem] font-semibold leading-tight text-white">{goal.title}</h3>
            <p className="mt-3 max-w-[32em] text-white/75">{goal.why}</p>
            <ol className="mt-6 space-y-3">
              {goal.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-[0.96rem]">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[0.78rem] font-semibold">{i + 1}</span>{s}
                </li>
              ))}
            </ol>
            {cta}
          </div>
        </div>
      </div>
    </section>
  );
}
