"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { SCORE_URL } from "./data";


/* ------------------------------------------------------------------ */
/* Reveal: hides below-the-fold [data-rv] blocks only after hydration  */
/* ------------------------------------------------------------------ */
export function RevealRoot({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-rv]"));
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("rv-pre");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("rv-pre");
        io.observe(el);
      }
    });
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`ho ${className ?? ""}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Counter                                                             */
/* ------------------------------------------------------------------ */
export function Count({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min((t - t0) / 1400, 1);
          setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        setV(0);
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref}>
      {prefix}
      {v.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* 3D tilt                                                             */
/* ------------------------------------------------------------------ */
export function Tilt({ children, max = 10, className }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform .25s ease-out" }}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Waitlist CTA (reuses the site's existing modal)                     */
/* ------------------------------------------------------------------ */
export function WaitlistButton({ source, className, children }: { source: string; className?: string; children: ReactNode }) {
  const { openWaitlist } = useSeekerWaitlist();
  return (
    <button type="button" className={className} onClick={() => openWaitlist(source)}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Decorative QR (not a scannable code)                                */
/* ------------------------------------------------------------------ */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function QrArt({ seed = 7, fg = "#1A1A1A", bg = "#fff", label = "Sample GrowQR skill passport QR code" }: { seed?: number; fg?: string; bg?: string; label?: string }) {
  const n = 25;
  const r = rng(seed);
  const cells: ReactNode[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      const inLogo = x > 9 && x < 15 && y > 9 && y < 15;
      if (inF || inLogo) continue;
      if (r() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fg} />);
    }
  const finder = (ox: number, oy: number, k: string) => (
    <g key={k}>
      <rect x={ox} y={oy} width={7} height={7} fill={fg} />
      <rect x={ox + 1} y={oy + 1} width={5} height={5} fill={bg} />
      <rect x={ox + 2} y={oy + 2} width={3} height={3} fill={fg} />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} className="block h-auto w-full">
      <rect width={n} height={n} fill={bg} />
      {cells}
      {finder(0, 0, "f1")}
      {finder(n - 7, 0, "f2")}
      {finder(0, n - 7, "f3")}
      <rect x={9.6} y={9.6} width={5.8} height={5.8} rx={1.4} fill="#FF6A2F" />
      <path d="M11.4 12.5l1.1 1.1 2-2.2" stroke="#fff" strokeWidth={0.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive QR Score demo                                           */
/* ------------------------------------------------------------------ */
const ITEMS = [
  { key: "cgpa", label: "Degree & CGPA", w: 15, on: true, gap: ["Degree and CGPA are missing", "Add them first. Recruiters scan education in seconds.", "https://app.growqr.ai/signup"] },
  { key: "skills", label: "Skills section", w: 15, on: true, gap: ["No skills section", "List tools you can prove. GrowQR links 121 courses to close skill gaps.", SCORE_URL] },
  { key: "intern", label: "Internship", w: 20, on: false, gap: ["No internship or work experience", "The biggest single gap. GrowQR matches you to verified, paid roles.", SCORE_URL] },
  { key: "projects", label: "2+ projects", w: 15, on: false, gap: ["Fewer than two projects", "Build two small ones. A 10 to 40 hour micro-gig counts, and it pays.", SCORE_URL] },
  { key: "certs", label: "Certifications", w: 10, on: false, gap: ["No certifications", "Finish a GrowQR course and the certificate lands on your passport.", SCORE_URL] },
  { key: "ach", label: "Measurable results", w: 15, on: false, gap: ["No measurable achievements", "Swap duties for numbers: 'cut load time 40%', 'ranked 12 of 800'.", SCORE_URL] },
  { key: "fmt", label: "Clean one-pager", w: 10, on: true, gap: ["Format is cluttering the content", "One page, one column, no photo. Machines and humans read it faster.", SCORE_URL] },
] as const;

export function ScoreDemo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(ITEMS.map((i) => [i.key, i.on])));
  const score = ITEMS.reduce((s, i) => s + (on[i.key] ? i.w : 0), 0);
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  useEffect(() => {
    const from = shownRef.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - t0) / 700, 1);
      const v = Math.round(from + (score - from) * p);
      shownRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const missing = ITEMS.filter((i) => !on[i.key]).sort((a, b) => b.w - a.w)[0];
  const color = score >= 75 ? "#12E27A" : score >= 45 ? "#FFB020" : "#FF5A4F";
  const dark = tone === "dark";
  const vars = {
    "--qsd-c": color,
    "--qsd-track": dark ? "rgba(255,255,255,.14)" : "rgba(26,26,26,.1)",
    "--qsd-line": dark ? "rgba(255,255,255,.3)" : "rgba(26,26,26,.3)",
    "--qsd-on": dark ? "rgba(255,106,47,.2)" : "rgba(255,106,47,.12)",
  } as React.CSSProperties;

  return (
    <div className="qsd" style={vars}>
      <div className="qsd-ring" role="img" aria-label={`Sample QR Score ${shown} out of 100`}>
        <svg viewBox="0 0 120 120" aria-hidden>
          <circle className="bg" cx="60" cy="60" r="52" />
          <circle className="fg" cx="60" cy="60" r="52" style={{ strokeDashoffset: 326.7 * (1 - score / 100) }} />
        </svg>
        <div className="qsd-num">
          <b>{shown}</b>
          <small>QR Score</small>
        </div>
      </div>
      <div>
        <p className="mb-1 font-serif text-[1.6rem] leading-tight text-current">Build a sample resume. Watch the score move.</p>
        <div className="qsd-chips" role="group" aria-label="Resume contents">
          {ITEMS.map((i) => (
            <label key={i.key}>
              <input type="checkbox" checked={!!on[i.key]} onChange={(e) => setOn((p) => ({ ...p, [i.key]: e.target.checked }))} />
              {i.label}
            </label>
          ))}
        </div>
        <p className="mb-4 min-h-[3.4em] text-[1rem] leading-relaxed text-current" aria-live="polite">
          {missing ? (
            <>
              <strong>Biggest gap: {missing.gap[0]}.</strong> {missing.gap[1]}
            </>
          ) : (
            <strong>Nothing left to fix in this sample. Now see how your real resume scores.</strong>
          )}
        </p>
        <a className="ho-btn ho-btn-pri" href={SCORE_URL}>
          Score my real resume, free
        </a>
        <p className="mt-3 text-[0.8rem] text-current opacity-70">Illustrative demo. The real scorer reads your actual resume.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Option switcher (client review only)                                */
/* ------------------------------------------------------------------ */
export function Switcher({ active }: { active: string }) {
  const opts = ["a", "b", "c", "d", "e", "f"];
  return (
    <nav className="ho-switch" aria-label="Homepage design options">
      {opts.map((k) => (
        <Link key={k} href={"/home-options/" + k} className={active === k ? "on" : ""} aria-current={active === k ? "page" : undefined}>
          <span className="hidden sm:inline">Option&nbsp;</span>{k.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
