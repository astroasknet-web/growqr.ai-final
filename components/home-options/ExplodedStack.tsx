"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { INTERNSHIPS, PASSPORT, SCORE_URL, type AgentKey } from "./data";
import { QrArt, WaitlistButton } from "./shared";
import { AgentAvatar, ScoreDial } from "./ui";

/* ---------------- plate faces (responsive squares) ---------------- */
function Bar({ w, s }: { w: string; s?: boolean }) { return <i className={`block h-[6px] rounded-full ${s ? "bg-ink/25" : "bg-ink/10"}`} style={{ width: w }} />; }

function ResumePlate() {
  return (
    <div className="flex h-full flex-col gap-2.5 p-5">
      <div className="flex items-center gap-3"><span className="h-11 w-11 rounded-full bg-gradient-to-br from-orange-light to-orange/40" /><div className="grid flex-1 gap-1.5"><Bar w="60%" s /><Bar w="38%" /></div></div>
      {["Education", "Experience", "Skills", "Projects", "Impact"].map((t, i) => (
        <div key={t} className="grid gap-1.5"><p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-orange-dark">{t}</p><Bar w={`${88 - i * 6}%`} /><Bar w={`${60 + (i % 3) * 10}%`} /></div>
      ))}
      <span className="absolute right-5 top-[46%] rounded-lg border border-orange/30 bg-orange-lighter px-2 py-1 text-[0.62rem] font-semibold text-orange-deep">Impact isn&apos;t quantified</span>
    </div>
  );
}
function ScorePlate() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-5">
      <ScoreDial value={85} size={190} grade="Strong" />
      <div className="flex flex-wrap justify-center gap-1.5">{["Education", "Experience", "Skills", "Projects", "Impact"].map((t) => (<span key={t} className="rounded-full bg-orange-light px-2.5 py-1 text-[0.62rem] font-bold text-orange-deep">{t}</span>))}</div>
    </div>
  );
}
function AgentsPlate() {
  const a: AgentKey[] = ["mira", "sage", "vera", "scout", "lyra", "kai"];
  const n = ["Mira", "Sage", "Vera", "Scout", "Lyra", "Kai"];
  return (
    <div className="grid h-full grid-cols-3 place-content-center gap-3 p-5">
      {a.map((k, i) => (<div key={k} className="flex flex-col items-center gap-1.5"><AgentAvatar k={k} size={64} /><span className="text-[0.7rem] font-bold">RQ-{n[i]}</span></div>))}
    </div>
  );
}
function PassportPlate() {
  return (
    <div className="flex h-full flex-col gap-3 bg-gradient-to-br from-ink to-[#3b1d0e] p-5 text-white">
      <div className="flex items-center gap-3"><div className="w-[84px] shrink-0 rounded-xl bg-white p-1.5"><QrArt seed={44} fg="#1A1A1A" /></div><div><p className="font-serif text-[1.3rem] leading-none">Sachin Sharma</p><p className="mt-1 text-[0.62rem] text-emerald-300">● Verified passport</p></div></div>
      <div className="grid gap-2">{PASSPORT.map((p) => (<div key={p.key} className="grid grid-cols-[66px,1fr,20px] items-center gap-2 text-[0.62rem] font-semibold text-white/85">{p.key}<i className="h-1.5 overflow-hidden rounded-full bg-white/15"><i className="block h-full rounded-full bg-gradient-to-r from-orange to-[#FFB020]" style={{ width: `${p.v}%` }} /></i><span className="text-right">{p.v}</span></div>))}</div>
    </div>
  );
}
function RolesPlate() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-5">
      {INTERNSHIPS.slice(0, 3).map((it) => (
        <div key={it.id} className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold text-white" style={{ background: it.tone }}>{it.company[0]}</span>
          <span className="min-w-0 flex-1 text-[0.72rem] font-bold leading-tight">{it.title}<span className="block truncate font-normal text-ink-4">{it.company}</span></span>
          <span className="text-right text-[0.78rem] font-bold">₹{it.stipend.toLocaleString("en-IN")}<span className="block text-[0.55rem] font-semibold text-emerald-600">🛡 escrow</span></span>
        </div>
      ))}
    </div>
  );
}

const LAYERS: { k: string; h: string; d: string; face: ReactNode }[] = [
  { k: "Resume", h: "Start with what you have.", d: "Upload any resume as a PDF, Word file or pasted text. It is read in your browser, and only the text is sent.", face: <ResumePlate /> },
  { k: "Score", h: "A number you can act on.", d: "A score out of 100, a grade, and three plain-language focus areas across education, experience, skills, projects and impact.", face: <ScorePlate /> },
  { k: "Agents", h: "Agents close the gaps.", d: "RQ-Mira rewrites, RQ-Sage plans, RQ-Lyra picks the course. Human experts stay in the loop.", face: <AgentsPlate /> },
  { k: "Passport", h: "Proof, not claims.", d: "A proctored assessment and checked evidence become a Skill Passport that any employer can verify with one scan.", face: <PassportPlate /> },
  { k: "Roles", h: "Verified roles. Protected stipends.", d: "Apply with no fees to screened employers. The first month's stipend is held in escrow before you start.", face: <RolesPlate /> },
];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export default function ExplodedStack() {
  const wrap = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  const act = useRef(-1);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(rm);
    const el = wrap.current, sc = scene.current;
    if (!el || !sc) return;
    if (rm) { sc.style.setProperty("--gap", "112px"); sc.style.setProperty("--p", "0.5"); return; }
    let raf = 0;
    const upd = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight));
      const ex = 1 - Math.pow(1 - clamp(p / 0.2), 3);
      sc.style.setProperty("--gap", `${(6 + ex * 112).toFixed(1)}px`);
      sc.style.setProperty("--p", p.toFixed(3));
      const a = p < 0.2 ? -1 : Math.min(4, Math.floor((p - 0.2) / 0.16));
      if (a !== act.current) { act.current = a; setActive(a); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(upd); };
    upd();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  const L = active >= 0 ? LAYERS[active] : null;

  return (
    <>
      {/* ---------- desktop: pinned exploded 3D stack ---------- */}
      <div ref={wrap} className={`relative hidden lg:block ${reduce ? "" : "h-[560vh]"}`}>
        <div className="sticky top-0 h-screen min-h-[640px] overflow-hidden bg-cream">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(55%_60%_at_68%_52%,rgba(255,106,47,0.2),transparent_65%),radial-gradient(40%_40%_at_8%_92%,rgba(255,176,32,0.14),transparent_60%)]" />
          <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-[0.1]" />

          <div className="relative z-10 mx-auto grid h-full max-w-[1320px] grid-cols-[0.9fr,1.1fr] items-center gap-6 px-14 pt-20">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange/20 bg-white/90 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm"><span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-orange" />GrowQR × QR Score{active >= 0 ? ` · 0${active + 1} / 05` : ""}</p>
              {L ? (
                <div key={active} className="ho-in">
                  <p className="mb-2 text-[0.8rem] font-bold uppercase tracking-[0.18em] text-orange-dark">{L.k}</p>
                  <h1 className="font-sans text-[clamp(2.4rem,4.6vw,4.2rem)] font-extrabold leading-[1.02] text-ink">{L.h}</h1>
                  <p className="mt-5 max-w-[30em] text-[1.14rem] leading-relaxed text-ink-3">{L.d}</p>
                  {active === 4 && (
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="cta-shine inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:bg-orange-dark">Score my resume, free <span aria-hidden>→</span></a>
                      <WaitlistButton source="home-option-f-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ho-in">
                  <h1 className="font-sans text-[clamp(2.8rem,5.6vw,5.2rem)] font-extrabold leading-[0.98] text-ink">The whole career journey,<br /><span className="bg-gradient-to-r from-orange via-[#FF8A4C] to-[#FFB020] bg-clip-text text-transparent">taken apart.</span></h1>
                  <p className="mt-6 max-w-[30em] text-[1.18rem] leading-relaxed text-ink-3">Five layers turn a plain resume into a verified, paid opportunity. Scroll to pull them apart.</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="cta-shine inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:bg-orange-dark">Score my resume, free <span aria-hidden>→</span></a>
                    <WaitlistButton source="home-option-f-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
                  </div>
                </div>
              )}
              <ol className="mt-10 grid gap-1.5" aria-label="Layers">
                {LAYERS.map((l, i) => (<li key={l.k} className={`flex items-center gap-3 text-[0.9rem] font-semibold transition-all duration-500 ${i === active ? "translate-x-2 text-ink" : "text-ink-5"}`}><span className={`h-px transition-all duration-500 ${i === active ? "w-10 bg-orange" : "w-4 bg-black/20"}`} />0{i + 1} {l.k}</li>))}
              </ol>
            </div>

            {/* 3D scene */}
            <div ref={scene} className="relative mx-auto grid h-full w-full place-items-center" style={{ perspective: "2600px", ["--gap" as string]: "6px", ["--p" as string]: "0" }}>
              <div className="relative h-[400px] w-[400px]" style={{ transformStyle: "preserve-3d", transform: "scale(1.2) rotateX(60deg) rotateZ(calc(-40deg + var(--p) * 26deg))" }}>
                {/* ground shadow */}
                <div aria-hidden className="absolute -inset-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgba(255,106,47,0.35),transparent)] blur-xl" style={{ transform: "translateZ(calc(-3 * var(--gap)))" }} />
                {/* cage lines */}
                {[[0, 0], [400, 0], [0, 400], [400, 400]].map(([x, y]) => (
                  <i key={`${x}${y}`} aria-hidden className="absolute w-px origin-top bg-gradient-to-t from-orange/50 to-orange/0" style={{ left: x, top: y, height: "calc(4 * var(--gap))", transform: "translateZ(calc(-2 * var(--gap))) rotateX(-90deg)", transformOrigin: "top" }} />
                ))}
                {LAYERS.map((l, i) => {
                  const on = i === active;
                  return (
                    <div
                      key={l.k}
                      className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/85 shadow-[0_2px_0_rgba(26,26,26,0.06),0_30px_60px_-20px_rgba(26,26,26,0.3)] backdrop-blur-md"
                      style={{
                        transform: `translateZ(calc(${2 - i} * var(--gap)))`,
                        translate: on ? "0 0 34px" : "0 0 0",
                        opacity: active < 0 || on ? 1 : 0.55,
                        transition: "translate .6s cubic-bezier(.2,.7,.2,1), opacity .5s, box-shadow .5s",
                        boxShadow: on ? "0 0 0 3px rgba(255,106,47,0.9), 0 40px 80px -20px rgba(255,106,47,0.6)" : undefined,
                      }}
                      aria-hidden
                    >
                      <span className="absolute left-4 top-3 z-10 rounded-full bg-ink px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.16em] text-white">0{i + 1} · {l.k}</span>
                      <div className="h-full pt-8">{l.face}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- mobile / tablet: flat layers ---------- */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden px-6 pb-12 pt-32">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_40%_at_70%_20%,rgba(255,106,47,0.2),transparent_65%)]" />
          <h1 className="font-sans text-[clamp(2.6rem,11vw,4rem)] font-extrabold leading-[0.98] text-ink">The whole career journey,<br /><span className="bg-gradient-to-r from-orange via-[#FF8A4C] to-[#FFB020] bg-clip-text text-transparent">taken apart.</span></h1>
          <p className="mt-5 text-[1.08rem] leading-relaxed text-ink-3">Five layers turn a plain resume into a verified, paid opportunity.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={SCORE_URL} target="_blank" rel="noopener noreferrer" className="cta-shine inline-flex items-center gap-2 rounded-full bg-orange px-7 py-4 text-[1.02rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)]">Score my resume, free <span aria-hidden>→</span></a>
            <WaitlistButton source="home-option-f-hero-m" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 font-semibold">Join the waitlist</WaitlistButton>
          </div>
        </div>
        <ol className="grid gap-12 px-6 pb-16">
          {LAYERS.map((l, i) => (
            <li key={l.k} data-rv className="mx-auto w-full max-w-[400px]">
              <p className="mb-2 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-orange-dark">0{i + 1} · {l.k}</p>
              <h2 className="mb-2 font-sans text-[1.8rem] font-semibold leading-[1.08] text-ink">{l.h}</h2>
              <p className="mb-4 text-[1rem] leading-relaxed text-ink-3">{l.d}</p>
              <div className="relative aspect-square overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-card"><div className="h-full">{l.face}</div></div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
