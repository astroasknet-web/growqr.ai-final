"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PASSPORT, type AgentKey } from "./data";
import { QrArt } from "./shared";
import { AgentAvatar, PhoneFrame, usePrefersReducedMotion } from "./ui";

/* ------------------------------------------------------------------ */
/** Agents revolving around the passport (each avatar counter-rotates to stay upright). */
export function AgentOrbit({ children }: { children: ReactNode }) {
  const ring: AgentKey[] = ["mira", "sage", "vera", "scout", "lyra", "kai", "nova", "atlas"];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[780px]">
      <span aria-hidden className="absolute inset-[3%] rounded-full border border-orange/25" />
      <span aria-hidden className="absolute inset-[14%] rounded-full border border-dashed border-orange/35" />
      <span aria-hidden className="absolute inset-[26%] rounded-full bg-orange/[0.12] blur-3xl" />
      <div className="ho-spin absolute inset-[3%]">
        {ring.map((k, i) => {
          const a = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <span key={k} className="absolute" style={{ left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%`, transform: "translate(-50%,-50%)" }}>
              <span className="ho-spin-r block"><AgentAvatar k={k} size={56} /></span>
            </span>
          );
        })}
      </div>
      <div className="absolute left-1/2 top-1/2 w-[50%] -translate-x-1/2 -translate-y-1/2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const EVIDENCE: { t: string; d: string; ev: ReactNode }[] = [
  {
    t: "Education, checked at the source",
    d: "Certificates are matched to the platform that issued them. Recruiters see a tick, not a claim.",
    ev: (<div className="grid gap-2 text-[0.88rem]">{[["Google Data Analytics (Coursera)", "2021"], ["Data Science, Johns Hopkins (Coursera)", "2021"], ["Self-taught engineer", "since 2012"]].map(([a, v]) => (<div key={a} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3.5 py-2.5 font-semibold">{a}<span className="shrink-0 text-emerald-600">✓ {v}</span></div>))}</div>),
  },
  {
    t: "Experience you can click through",
    d: "A role counts for more when it left something behind: a live product, a documented outcome.",
    ev: (<div className="flex items-center gap-3 rounded-2xl bg-cream p-3.5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange font-bold text-white">V</span><span className="text-[0.92rem] font-semibold leading-tight">Founder &amp; Full-Stack Developer<span className="block text-[0.8rem] font-normal text-ink-4">Vidaara.org · 2023 to now</span></span><span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-700">✓ Live site</span></div>),
  },
  {
    t: "Skills, scored by the engine",
    d: "Every tool you list is matched against evidence in your roles and projects, then scored.",
    ev: (<div className="grid gap-2">{["Node.js · Express · MySQL", "Flutter · Dart", "Claude · ChatGPT · RAG", "LaTeX · KaTeX"].map((s) => (<div key={s} className="flex items-center justify-between rounded-xl bg-cream px-3.5 py-2.5 text-[0.88rem] font-semibold">{s}<span className="text-[0.74rem] text-emerald-600">✓ Evidenced</span></div>))}<p className="mt-1 rounded-xl bg-emerald-50 px-3 py-2 text-[0.8rem] font-semibold text-emerald-800">Skills &amp; Competencies · 93%</p></div>),
  },
  {
    t: "Projects, with products that run",
    d: "A portfolio is something an employer can open, use and judge for themselves.",
    ev: (<div className="grid gap-2">{["Vidaara e-learning portal", "Vidaara Classroom (SaaS LMS)", "Ganak, Ankora, Kridora, WOV"].map((p) => (<div key={p} className="flex items-center justify-between rounded-xl bg-cream px-3.5 py-2.5 text-[0.88rem] font-semibold">{p}<span className="text-[0.74rem] text-emerald-600">✓ Built</span></div>))}</div>),
  },
  {
    t: "Impact, in numbers",
    d: "Results are quantified and cross-checked. This is the section most resumes leave thin.",
    ev: (<div className="flex flex-wrap gap-2">{["66,000+ practice questions", "4,000+ learning pages", "40+ students supported", "5 products built solo"].map((m) => (<span key={m} className="rounded-full border border-orange/25 bg-orange-lighter px-3.5 py-2 text-[0.84rem] font-semibold text-orange-deep">{m}</span>))}</div>),
  },
];

/** The passport on the left fills in as each evidence step scrolls into view. */
export function PassportBuilder() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);
  const done = reduce ? 4 : active;
  return (
    <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[430px,1fr] lg:gap-16">
      <div className="relative order-1 hidden lg:order-none lg:block">
        <div className="sticky top-24 lg:top-[calc(50vh-250px)]">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink via-[#26180f] to-[#3b1d0e] p-6 text-white shadow-[0_40px_90px_-30px_rgba(255,106,47,0.6)]">
            <span aria-hidden className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-orange/40 blur-[70px]" />
            <div className="relative mb-5 flex items-center justify-between text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/70"><span>GrowQR · Skill Passport</span><span className={done === 4 ? "text-emerald-400" : "text-white/40"}>{done === 4 ? "● Verified" : "○ Building"}</span></div>
            <div className="relative mb-5 flex items-center gap-4">
              <div className="w-[96px] shrink-0 rounded-xl bg-white p-1.5 transition-opacity duration-700" style={{ opacity: 0.25 + done * 0.1875 }}><QrArt seed={44} fg="#1A1A1A" /></div>
              <div><p className="font-serif text-[1.7rem] leading-none">Sachin Sharma</p><p className="mt-1 text-[0.8rem] text-white/60">EdTech Founder · Developer</p></div>
            </div>
            <div className="relative grid gap-3">
              {PASSPORT.map((p, i) => (
                <div key={p.key} className={`grid grid-cols-[84px,1fr,28px] items-center gap-2 text-[0.8rem] font-semibold transition-opacity duration-500 ${i <= done ? "opacity-100" : "opacity-35"}`}>
                  {p.key}
                  <i className="h-2 overflow-hidden rounded-full bg-white/15"><i className="block h-full rounded-full bg-gradient-to-r from-orange to-[#FFB020] transition-[width] duration-[1100ms] ease-out" style={{ width: i <= done ? `${p.v}%` : "0%" }} /></i>
                  <span className="text-right text-white/80">{i <= done ? p.v : "–"}</span>
                </div>
              ))}
            </div>
            <span aria-hidden className={`absolute bottom-5 right-5 rotate-[-12deg] rounded-xl border-2 border-emerald-400 px-3 py-1 text-[0.8rem] font-extrabold uppercase tracking-widest text-emerald-400 transition-all duration-500 ${done === 4 ? "scale-100 opacity-100" : "scale-150 opacity-0"}`}>Verified</span>
          </div>
        </div>
      </div>
      <div className="order-2 lg:order-none">
      <div className="sticky top-[64px] z-20 -mx-6 mb-2 flex gap-1.5 overflow-x-auto bg-cream/90 px-6 py-3 backdrop-blur lg:hidden" aria-hidden>{PASSPORT.map((p,i)=>(<span key={p.key} className={`shrink-0 rounded-full border px-3 py-1 text-[0.72rem] font-bold transition ${i<=done?"border-orange bg-orange text-white":"border-black/10 bg-white text-ink-4"}`}>{i<=done?"✓ ":""}{p.key}</span>))}</div>
      <ol>
        {EVIDENCE.map((s, i) => (
          <li key={s.t} ref={(el) => { refs.current[i] = el; }} data-i={i} className="flex flex-col justify-center py-8 lg:min-h-[72vh] lg:py-0">
            <span className={`mb-3 inline-flex w-fit rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] transition ${i <= done ? "border-orange bg-orange text-white" : "border-black/10 bg-white text-ink-4"}`}>{PASSPORT[i].key}</span>
            <h3 className="mb-3 max-w-[18ch] font-sans text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-[1.1]">{s.t}</h3>
            <p className="mb-5 max-w-[32em] text-[1.04rem] leading-relaxed text-ink-3">{s.d}</p>
            <div className="max-w-[460px] rounded-3xl border border-black/10 bg-white p-4 shadow-card">{s.ev}</div>
          </li>
        ))}
      </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/** An employer's phone scanning the passport QR, then the verified result. */
export function ScanPhone() {
  const [phase, setPhase] = useState<0 | 1>(0);
  const [n, setN] = useState(0);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    if (reduce) { setPhase(1); setN(5); return; }
    let ids: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setPhase(0); setN(0);
      ids.push(setTimeout(() => setPhase(1), 2800));
      PASSPORT.forEach((_, i) => ids.push(setTimeout(() => setN(i + 1), 3300 + i * 550)));
      ids.push(setTimeout(cycle, 10500));
    };
    cycle();
    return () => ids.forEach(clearTimeout);
  }, [reduce]);
  return (
    <PhoneFrame>
      {phase === 0 ? (
        <div className="relative flex h-full flex-col items-center justify-center bg-ink px-6 text-white">
          <p className="absolute top-10 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/60">Scan a passport</p>
          <div className="relative w-[70%] rounded-2xl bg-white p-2.5"><QrArt seed={44} fg="#1A1A1A" /><span className="ho-scanline" aria-hidden /></div>
          <span aria-hidden className="absolute left-[10%] right-[10%] top-[28%] bottom-[28%] rounded-3xl border-2 border-orange/70" />
          <p className="mt-6 text-[0.7rem] text-white/60">Hold steady…</p>
        </div>
      ) : (
        <div className="ho-in flex h-full flex-col gap-2.5 bg-cream px-3.5 pb-4 pt-9 text-ink">
          <p className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-800">✓ Passport verified</p>
          <p className="font-serif text-[1.35rem] leading-none">Sachin Sharma</p>
          <p className="-mt-1 text-[0.6rem] text-ink-4">EdTech Founder · Full-Stack &amp; AI Developer</p>
          <div className="grid gap-1.5">
            {PASSPORT.map((p, i) => (
              <div key={p.key} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[0.62rem] font-semibold transition-all duration-500 ${i < n ? "border-emerald-200 bg-white" : "border-transparent bg-white/40 opacity-40"}`}>
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[0.5rem] ${i < n ? "bg-emerald-500 text-white" : "bg-black/10"}`}>{i < n ? "✓" : ""}</span>
                {p.key}<span className="ml-auto text-ink-3">{p.v}</span>
              </div>
            ))}
          </div>
          <div className={`mt-auto rounded-xl bg-ink py-2.5 text-center text-[0.68rem] font-bold text-white transition-opacity duration-500 ${n === 5 ? "opacity-100" : "opacity-0"}`}>Shortlist candidate</div>
        </div>
      )}
    </PhoneFrame>
  );
}
