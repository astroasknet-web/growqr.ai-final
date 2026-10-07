"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AGENT, type AgentKey } from "./data";

export const ROWS = [
  { k: "Education", claim: "Google Data Analytics, Data Science", proof: "Coursera certificates, 2021 (Google, Johns Hopkins)", tag: "Credential" },
  { k: "Experience", claim: "Founder and full-stack developer", proof: "Vidaara.org live since 2023, 66,000+ questions", tag: "Live site" },
  { k: "Skills", claim: "Node.js, MySQL, Flutter, AI tools", proof: "Skills section scored 93% by the engine", tag: "Scored" },
  { k: "Projects", claim: "Built an e-learning platform", proof: "5 products built solo, with live links", tag: "Linked" },
  { k: "Impact", claim: "Helped many students", proof: "40+ hearing-impaired students supported", tag: "Documented" },
  { k: "Recognition", claim: "Received awards", proof: "Dr. A.P.J. Abdul Kalam Award, 2017", tag: "Award" },
] as const;

function Doc({ mode }: { mode: "claim" | "proof" }) {
  const proof = mode === "proof";
  return (
    <div className={`h-full w-full p-5 md:p-7 ${proof ? "bg-white" : "bg-[#EDEBE6]"}`}>
      <div className="mb-4 flex items-center gap-4">
        <span className={`grid h-14 w-14 place-items-center rounded-full font-serif text-[1.5rem] ${proof ? "bg-gradient-to-br from-orange to-[#FFB020] text-white" : "bg-black/10 text-ink-4"}`}>S</span>
        <div className="min-w-0 flex-1">
          <p className={`font-serif text-[1.7rem] leading-none ${proof ? "text-ink" : "text-ink-4"}`}>Sachin Sharma</p>
          <p className={`mt-1 text-[0.82rem] ${proof ? "text-ink-3" : "text-ink-5"}`}>EdTech Founder · Full-Stack &amp; AI Developer</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider ${proof ? "bg-emerald-50 text-emerald-700" : "border border-dashed border-ink-5 text-ink-4"}`}>{proof ? "✓ QR Score 85" : "Resume.pdf"}</span>
      </div>
      <ul className="grid gap-2">
        {ROWS.map((r) => (
          <li key={r.k} className={`flex h-[62px] items-center gap-3 rounded-2xl border px-3.5 md:h-[66px] ${proof ? "border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 to-white" : "border-black/[0.06] bg-white/50"}`}>
            <span className={`w-[86px] shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.14em] md:w-[104px] ${proof ? "text-orange-dark" : "text-ink-5"}`}>{r.k}</span>
            <span className={`min-w-0 flex-1 text-[0.86rem] font-semibold leading-snug md:text-[0.95rem] ${proof ? "text-ink" : "text-ink-4 underline decoration-dotted decoration-ink-5 underline-offset-4"}`}>{proof ? r.proof : r.claim}</span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.64rem] font-bold ${proof ? "bg-emerald-600 text-white" : "border border-ink-5 text-ink-4"}`}>{proof ? `✓ ${r.tag}` : "?"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A resume where the cursor is a scanner: the circle reveals the verified layer beneath the claims. */
export function LensDoc() {
  const box = useRef<HTMLDivElement>(null);
  const proof = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const el = box.current, pl = proof.current, ln = lens.current;
    if (!el || !pl || !ln) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = el.clientWidth, h = el.clientHeight;
    let R = w < 520 ? 92 : 128;
    let tx = w / 2, ty = h / 2, x = tx, y = ty, last = -1e9, raf = 0;
    const apply = () => {
      const m = `radial-gradient(circle ${R}px at ${x}px ${y}px, #000 ${R - 3}px, transparent ${R}px)`;
      pl.style.maskImage = m; pl.style.webkitMaskImage = m;
      ln.style.transform = `translate(${x - R}px, ${y - R}px)`;
      ln.style.width = ln.style.height = `${R * 2}px`;
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top; last = performance.now(); setHint(false);
    };
    const loop = (t: number) => {
      if (t - last > 3200) { tx = w * (0.5 + 0.32 * Math.sin(t / 1700)); ty = h * (0.5 + 0.4 * Math.sin(t / 1150 + 1)); }
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      apply();
      raf = requestAnimationFrame(loop);
    };
    const ro = new ResizeObserver(() => { w = el.clientWidth; h = el.clientHeight; R = w < 520 ? 92 : 128; });
    ro.observe(el);
    el.addEventListener("pointermove", move);
    if (reduce) apply(); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener("pointermove", move); };
  }, []);

  return (
    <div ref={box} className="relative w-full max-w-[720px] touch-pan-y overflow-hidden rounded-[30px] border border-black/10 shadow-[0_50px_110px_-40px_rgba(255,106,47,0.5)]" style={{ cursor: "none" }}>
      <div className="[filter:grayscale(1)]"><Doc mode="claim" /></div>
      <div ref={proof} className="absolute inset-0" aria-hidden><Doc mode="proof" /></div>
      <div ref={lens} aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full border-2 border-orange shadow-[0_0_0_6px_rgba(255,106,47,0.15),0_0_40px_rgba(255,106,47,0.45)]">
        <span className="absolute left-1/2 top-[-12px] h-[22px] w-px -translate-x-1/2 bg-orange" /><span className="absolute bottom-[-12px] left-1/2 h-[22px] w-px -translate-x-1/2 bg-orange" />
        <span className="absolute left-[-12px] top-1/2 h-px w-[22px] -translate-y-1/2 bg-orange" /><span className="absolute right-[-12px] top-1/2 h-px w-[22px] -translate-y-1/2 bg-orange" />
        <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white">● Scanning</span>
      </div>
      <p className={`pointer-events-none absolute bottom-3 right-4 rounded-full bg-ink/85 px-3 py-1 text-[0.68rem] font-semibold text-white transition-opacity ${hint ? "opacity-100" : "opacity-0"}`}>Move across the resume to scan it</p>
      <span className="sr-only">Illustration: a resume whose claims are verified when scanned. Education, experience, skills, projects, impact and communication each show verified evidence.</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** Drag to compare: what a resume says vs what GrowQR can prove. */
export function CompareSlider() {
  const [pos, setPos] = useState(52);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const set = useCallback((cx: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(4, Math.min(96, ((cx - r.left) / r.width) * 100)));
  }, []);
  return (
    <div
      ref={box}
      className="relative mx-auto h-[470px] w-full max-w-[1000px] touch-pan-y select-none overflow-hidden rounded-[32px] border border-black/10 shadow-[0_40px_90px_-40px_rgba(26,26,26,0.4)] md:h-[480px]"
      onPointerDown={(e) => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => { if (drag.current) set(e.clientX); }}
      onPointerUp={() => { drag.current = false; }}
    >
      {/* base: claims */}
      <div className="absolute inset-0 bg-[#EDEBE6] p-5 md:p-9">
        <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-ink-4">What the resume says</p>
        <ul className="grid gap-2.5">{ROWS.map((r) => (<li key={r.k} className="flex h-[58px] items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 text-ink-4"><span className="text-[0.95rem] font-semibold">{r.claim}</span><span className="rounded-full border border-ink-5 px-2 py-0.5 text-[0.7rem] font-bold">?</span></li>))}</ul>
      </div>
      {/* top: proof */}
      <div className="absolute inset-0 bg-ink p-5 text-white md:p-9" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <p className="mb-4 text-right text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#FFB380]">What GrowQR proves</p>
        <ul className="grid gap-2.5">{ROWS.map((r) => (<li key={r.k} className="flex h-[58px] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4"><span className="text-[0.95rem] font-semibold">{r.proof}</span><span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[0.7rem] font-bold">✓ {r.tag}</span></li>))}</ul>
      </div>
      {/* handle */}
      <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-orange" style={{ left: `${pos}%` }}>
        <button
          type="button"
          role="slider"
          aria-label="Compare resume claims with verified proof"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => { if (e.key === "ArrowLeft") setPos((p) => Math.max(4, p - 4)); if (e.key === "ArrowRight") setPos((p) => Math.min(96, p + 4)); }}
          className="pointer-events-auto absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-4 border-white bg-orange text-white shadow-[0_10px_30px_rgba(255,106,47,0.6)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ffb380]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const LINES: Record<AgentKey, string> = {
  mira: "Rewrites bullets until they carry numbers.",
  sage: "Finds the exact gap, builds the plan.",
  vera: "Mock interviews with honest feedback.",
  scout: "Matches you to roles while you sleep.",
  lyra: "Picks only the courses worth your time.",
  kai: "Practises the hard conversations with you.",
  nova: "Makes you impossible to ignore online.",
  atlas: "Maps your options at every stage.",
};

/** Agent cards with a cursor-following spotlight. */
export function AgentSpotlight() {
  const keys = Object.keys(AGENT) as AgentKey[];
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {keys.map((k) => {
        const a = AGENT[k];
        return (
          <li
            key={k}
            className="group relative overflow-hidden rounded-[26px] border border-black/10 bg-white transition-transform duration-300 hover:-translate-y-1.5"
            style={{ ["--mx" as string]: "50%", ["--my" as string]: "30%" }}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
            }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(260px circle at var(--mx) var(--my), ${a.color}33, transparent 70%)` }} />
            <div className="relative aspect-[4/4.2] overflow-hidden" style={{ background: `linear-gradient(160deg, ${a.color}22, #FFF5EE)` }}>
              <Image src={a.image} alt={`${a.name}, ${a.role}`} fill sizes="(min-width:1024px) 280px, 50vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.05]" />
            </div>
            <div className="relative z-20 p-4">
              <p className="font-sans text-[1.05rem] font-bold text-ink">{a.name}</p>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em]" style={{ color: a.color }}>{a.role}</p>
              <p className="mt-2 text-[0.9rem] leading-snug text-ink-3">{LINES[k]}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
