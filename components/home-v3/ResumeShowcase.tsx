"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { portal } from "./data";

const STYLES = [
  { id: "classic", label: "Classic", accent: "#0b1020", head: "serif" },
  { id: "modern", label: "Modern", accent: "#7857ff", head: "sans" },
  { id: "compact", label: "Compact", accent: "#0f9fbf", head: "sans" },
] as const;

const FEATURES = ["Professional templates", "Guided resume creation", "Live resume scoring", "ATS-aware formatting"];

/** `templateCount` comes from lib/studio/templates (server side), so the number is never hand-typed. */
export default function ResumeShowcase({ templateCount }: { templateCount: number }) {
  const [style, setStyle] = useState<(typeof STYLES)[number]>(STYLES[1]);
  return (
    <section id="resume" className="scroll-mt-24 bg-[var(--hx-soft)] px-6 py-24 md:px-14 md:py-32" aria-labelledby="hx-resume">
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-2">
        <div className="hx-v-resume">
          <p data-rv className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[var(--v)]">Resume Studio</p>
          <h2 data-rv id="hx-resume" className="text-[clamp(2rem,4.2vw,3.2rem)] font-semibold leading-[1.07] tracking-tight text-[var(--hx-text)]">Your Experience Deserves a <span className="hx-grad-text">Better Story.</span></h2>
          <p data-rv className="mt-4 max-w-[34em] text-[1.05rem] leading-relaxed text-[var(--hx-muted)]">Choose from {templateCount} template and style combinations, edit with live scoring, and export when it reads the way you want.</p>
          <ul data-rv className="mt-6 grid gap-2.5">
            {FEATURES.map((f) => <li key={f} className="flex items-center gap-2.5 text-[0.96rem] text-[var(--hx-text)]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--v)] text-white"><Check className="h-3 w-3" aria-hidden /></span>{f}</li>)}
          </ul>
          <p data-rv className="mt-5 text-[0.84rem] text-[var(--hx-muted)]">Cover letters, portfolios and video resumes are not part of Resume Studio yet.</p>
          <div data-rv className="mt-8 flex flex-wrap gap-3">
            <Link href={portal("/studio")} className="hx-btn hx-btn-dark">Create Your Resume <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <Link href={portal("/resume-score")} className="hx-btn hx-btn-line">Explore Resume Tools</Link>
          </div>
        </div>

        <div data-rv style={{ ["--d" as string]: ".1s" }}>
          <div role="tablist" aria-label="Preview template style" className="mb-4 flex gap-2">
            {STYLES.map((s) => (
              <button key={s.id} role="tab" type="button" aria-selected={s.id === style.id} onClick={() => setStyle(s)}
                className={`min-h-[44px] rounded-full px-5 text-[0.9rem] font-semibold transition ${s.id === style.id ? "bg-[var(--hx-navy)] text-white" : "bg-white text-[var(--hx-text)] ring-1 ring-slate-200 hover:ring-[var(--hx-violet)]"}`}>{s.label}</button>
            ))}
          </div>
          <div className="relative rounded-[28px] bg-gradient-to-br from-[#171b3a] to-[#0b1020] p-6 md:p-8">
            <div className="mx-auto aspect-[1/1.3] w-full max-w-[380px] rounded-lg bg-white p-6 shadow-2xl transition-all" aria-label={`${style.label} resume preview with sample content`}>
              <div className="border-b-2 pb-3" style={{ borderColor: style.accent }}>
                <p className={`text-[1.35rem] font-bold ${style.head === "serif" ? "font-serif" : ""}`} style={{ color: style.accent }}>Aarav Sharma</p>
                <p className="text-[0.7rem] text-slate-500">Frontend Developer · Hyderabad</p>
              </div>
              {["Experience", "Education", "Skills"].map((h, i) => (
                <div key={h} className="mt-4">
                  <p className="text-[0.66rem] font-bold uppercase tracking-wider" style={{ color: style.accent }}>{h}</p>
                  <div className="mt-1.5 space-y-1.5">{Array.from({ length: i === 0 ? 4 : 2 }).map((_, j) => <span key={j} className="block h-1.5 rounded bg-slate-200" style={{ width: `${95 - j * 12}%` }} />)}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[0.74rem] text-white/50">Sample content for illustration</p>
          </div>
        </div>
      </div>
    </section>
  );
}
