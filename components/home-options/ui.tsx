"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { QrArt } from "./shared";
import { AGENT, PASSPORT, type AgentKey } from "./data";

export function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const f = () => setR(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/** Tween a number toward a target (smooth count-up/down). */
export function useTween(target: number, ms = 900) {
  const [v, setV] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - t0) / ms, 1);
      const e = 1 - Math.pow(1 - p, 3);
      ref.current = from + (target - from) * e;
      setV(Math.round(ref.current));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ------------------------------------------------------------------ */
export function AgentAvatar({ k, size = 40, ring = true, className = "" }: { k: AgentKey; size?: number; ring?: boolean; className?: string }) {
  const a = AGENT[k];
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-orange-light ${className}`}
      style={{ width: size, height: size, boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${a.color}55` : undefined }}
    >
      <Image src={a.image} alt={`${a.name}, ${a.role}`} width={size * 2} height={size * 2} className="h-full w-full object-cover object-top" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/** Gradient score dial with tick ring. */
export function ScoreDial({ value, size = 200, label = "QR Score", grade, dark = false }: { value: number; size?: number; label?: string; grade?: string; dark?: boolean }) {
  const shown = useTween(value, 1100);
  const R = 52;
  const C = 2 * Math.PI * R;
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  const id = "qd" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const f = (n: number) => Number(n.toFixed(3));
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label} ${shown} out of 100`}>
      <svg viewBox="0 0 130 130" className="h-full w-full">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFB020" />
            <stop offset="0.55" stopColor="#FF6A2F" />
            <stop offset="1" stopColor="#FF3D6E" />
          </linearGradient>
        </defs>
        {ticks.map((i) => {
          const a = (i / 60) * Math.PI * 2;
          const on = i / 60 <= shown / 100;
          const r1 = 60, r2 = i % 5 === 0 ? 55.5 : 57.5;
          return <line key={i} x1={f(65 + Math.sin(a) * r1)} y1={f(65 - Math.cos(a) * r1)} x2={f(65 + Math.sin(a) * r2)} y2={f(65 - Math.cos(a) * r2)} stroke={on ? "#FF6A2F" : dark ? "rgba(255,255,255,.2)" : "rgba(26,26,26,.15)"} strokeWidth={i % 5 === 0 ? 1.6 : 0.9} strokeLinecap="round" />;
        })}
        <g transform="rotate(-90 65 65)">
          <circle cx="65" cy="65" r={R} fill="none" stroke={dark ? "rgba(255,255,255,.1)" : "rgba(26,26,26,.07)"} strokeWidth="9" />
          <circle cx="65" cy="65" r={R} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} style={{ filter: "drop-shadow(0 0 6px rgba(255,106,47,.55))" }} />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-serif leading-none" style={{ fontSize: size * 0.3 }}>{shown}</span>
        <span className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] opacity-60">{label}</span>
        {grade && <span className="mt-1 rounded-full bg-orange px-2 py-0.5 text-[0.65rem] font-bold text-white">{grade}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export type Pin = { top: string; left: string; title: string; agent: AgentKey; gain: number };

/** A resume page mock with a scanning laser and annotation pins. */
export function ResumeDoc({ scanning, visible, fixed, pins }: { scanning: boolean; visible: number; fixed: number; pins: Pin[] }) {
  const bar = (w: string, strong = false) => <i className={`block h-[5px] rounded-full ${strong ? "bg-ink/25" : "bg-ink/10"}`} style={{ width: w }} />;
  const sec = (t: string) => <p className="mb-1.5 mt-3 text-[0.5rem] font-bold uppercase tracking-[0.18em] text-orange-dark">{t}</p>;
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-[330px] rounded-xl border border-black/10 bg-white p-4 shadow-[0_24px_60px_-24px_rgba(26,26,26,0.35)]">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-light to-orange/40" />
        <div className="grid flex-1 gap-1.5">{bar("55%", true)}{bar("35%")}</div>
      </div>
      {sec("Education")}
      <div className="grid gap-1.5">{bar("90%")}{bar("62%")}</div>
      {sec("Experience")}
      <div className="grid gap-1.5">{bar("95%")}{bar("88%")}{bar("70%")}</div>
      {sec("Skills")}
      <div className="grid gap-1.5">{bar("80%")}{bar("48%")}</div>
      {sec("Projects")}
      <div className="grid gap-1.5">{bar("92%")}{bar("66%")}</div>
      {sec("Impact")}
      <div className="grid gap-1.5">{bar("84%")}{bar("40%")}</div>

      {scanning && <span aria-hidden className="ho-scanline" />}

      {pins.map((p, i) => {
        const shown = i < visible;
        const done = i < fixed;
        return (
          <div key={p.title} className="absolute z-10 transition-all duration-500" style={{ top: p.top, left: p.left, opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.6)" }}>
            <span className={`absolute -left-2 -top-2 h-4 w-4 rounded-full ${done ? "bg-emerald-500" : "bg-orange"}`}>
              <span className={`absolute inset-0 animate-ping rounded-full ${done ? "bg-emerald-400/60" : "bg-orange/50"}`} />
            </span>
            <span className={`absolute left-4 top-[-14px] whitespace-nowrap rounded-lg border px-2 py-1 text-[0.66rem] font-semibold shadow-sm ${done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-orange/30 bg-orange-lighter text-orange-deep"}`}>
              {done ? "✓ Fixed" : p.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[min(300px,80vw)] rounded-[2.6rem] border-[10px] border-ink bg-ink shadow-[0_50px_100px_-30px_rgba(255,106,47,0.45)] ${className}`}>
      <span aria-hidden className="absolute left-1/2 top-1.5 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-cream">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** Flip card: QR passport on the front, the five verified sections on the back. */
export function PassportCard({ autoFlip = true, name = "Sachin Sharma", className = "" }: { autoFlip?: boolean; name?: string; className?: string }) {
  const [flip, setFlip] = useState(false);
  const reduce = usePrefersReducedMotion();
  const paused = useRef(false);
  useEffect(() => {
    if (!autoFlip || reduce) return;
    const t = setInterval(() => { if (!paused.current) setFlip((f) => !f); }, 4200);
    return () => clearInterval(t);
  }, [autoFlip, reduce]);
  const face: CSSProperties = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
  return (
    <button
      type="button"
      onClick={() => setFlip((f) => !f)}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      aria-label="Flip the Skill Passport"
      className={`group relative block aspect-[1.55/1] w-full max-w-[460px] text-left [perspective:1400px] ${className}`}
    >
      <span className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] [transform-style:preserve-3d]" style={{ transform: flip ? "rotateY(180deg)" : "none" }}>
        {/* FRONT */}
        <span style={face} className="absolute inset-0 flex overflow-hidden rounded-[26px] bg-gradient-to-br from-ink via-[#26180f] to-[#3b1d0e] p-5 text-white shadow-[0_40px_80px_-30px_rgba(255,106,47,0.6)]">
          <span aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-orange/40 blur-[60px]" />
          <span aria-hidden className="absolute inset-0 opacity-30 [background:linear-gradient(115deg,transparent_30%,rgba(255,255,255,.35)_48%,transparent_62%)] group-hover:translate-x-[18%] transition-transform duration-700" />
          <span className="relative flex flex-1 flex-col justify-between">
            <span className="flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/70">
              <span>GrowQR · Skill Passport</span>
              <span className="text-emerald-400">● Verified</span>
            </span>
            <span>
              <span className="block font-serif text-[1.9rem] leading-none">{name}</span>
              <span className="mt-1 block text-[0.78rem] text-white/60">EdTech Founder · Full-Stack & AI Developer</span>
              <span className="mt-3 flex gap-1.5">
                {["QR Score 85", "Strong", "5 / 5 sections"].map((c) => (<span key={c} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.66rem] font-semibold">{c}</span>))}
              </span>
            </span>
          </span>
          <span className="relative ml-3 flex w-[34%] max-w-[150px] items-center"><span className="block w-full rounded-xl bg-white p-1.5"><QrArt seed={44} fg="#1A1A1A" /></span></span>
        </span>
        {/* BACK */}
        <span style={{ ...face, transform: "rotateY(180deg)" }} className="absolute inset-0 overflow-hidden rounded-[26px] border border-black/10 bg-white p-5 shadow-[0_40px_80px_-30px_rgba(26,26,26,0.35)]">
          <span className="mb-3 flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink-4">
            <span>What an employer sees</span>
            <span className="text-emerald-600">● Proctored</span>
          </span>
          <span className="grid gap-2.5">
            {PASSPORT.map((p) => (
              <span key={p.key} className="grid grid-cols-[78px,1fr,26px] items-center gap-2 text-[0.74rem] font-semibold text-ink-2">
                {p.key}
                <i className="relative h-1.5 overflow-hidden rounded-full bg-black/[0.07]"><i className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange to-[#FFB020] transition-[width] duration-1000" style={{ width: flip ? `${p.v}%` : "0%" }} /></i>
                <span className="text-right text-ink-3">{p.v}</span>
              </span>
            ))}
          </span>
          <span className="mt-3 block text-[0.7rem] text-ink-4">One scan. Every claim backed by evidence.</span>
        </span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/** Typewriter word for headlines (mirrors the live hero's behaviour). */
export function TypeWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(words[0].length);
  const [del, setDel] = useState(false);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const w = words[i];
    let t: ReturnType<typeof setTimeout>;
    if (!del && n === w.length) t = setTimeout(() => setDel(true), 1800);
    else if (del && n === 0) t = setTimeout(() => { setDel(false); setI((x) => (x + 1) % words.length); }, 280);
    else t = setTimeout(() => setN((x) => x + (del ? -1 : 1)), del ? 35 : 60);
    return () => clearTimeout(t);
  }, [n, del, i, words, reduce]);
  return (
    <span className={className}>
      {words[i].slice(0, n)}
      <span aria-hidden className="ml-1 inline-block w-[3px] translate-y-[0.06em] animate-pulse rounded-sm bg-orange align-middle" style={{ height: "0.85em" }} />
    </span>
  );
}
