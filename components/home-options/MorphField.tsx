"use client";

import { useEffect, useRef, useState } from "react";
import { LAND } from "./data";
import { SCORE_URL } from "./data";
import { WaitlistButton } from "./shared";

/* ------------------------------------------------------------------ */
/* Formations: arrays of normalised points in [-1,1]                   */
/* ------------------------------------------------------------------ */
type T = { x: number; y: number; a: number };
const D2R = Math.PI / 180;

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function qrFormation(): T[] {
  const n = 25, r = mulberry(21), out: T[] = [];
  const on: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    const logo = x > 9 && x < 15 && y > 9 && y < 15;
    if (!f && !logo && r() > 0.52) on[y][x] = true;
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const ring = x === 0 || x === 6 || y === 0 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      if (ring || core) on[oy + y][ox + x] = true;
    }
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!on[y][x]) continue;
    for (let k = 0; k < 4; k++) out.push({ x: ((x + (k % 2) * 0.5 + 0.25) / n) * 2 - 1, y: ((y + Math.floor(k / 2) * 0.5 + 0.25) / n) * 2 - 1, a: 1 });
  }
  // orange logo block in the centre
  for (let k = 0; k < 40; k++) out.push({ x: (r() - 0.5) * 0.2, y: (r() - 0.5) * 0.2, a: 1 });
  return out.map((p) => ({ x: p.x * 0.9, y: p.y * 0.9, a: p.a }));
}

function textFormation(text: string, w: number, h: number, font: string): T[] {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  if (!g) return [];
  g.fillStyle = "#000";
  g.font = font;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, w / 2, h / 2 + h * 0.04);
  const d = g.getImageData(0, 0, w, h).data;
  const out: T[] = [];
  const step = 4;
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 128) out.push({ x: (x / w) * 2 - 1, y: ((y / h) * 2 - 1) * (h / w), a: 1 });
  return out;
}

function resumeFormation(): T[] {
  const r = mulberry(5), out: T[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number, n: number, a = 1) => { for (let i = 0; i < n; i++) { const t = r(); out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t + (r() - 0.5) * 0.012, a }); } };
  const W = 0.58, H = 0.86;
  line(-W, -H, W, -H, 90); line(-W, H, W, H, 90); line(-W, -H, -W, H, 130); line(W, -H, W, H, 130);
  for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.1; out.push({ x: -0.38 + Math.cos(a) * rr, y: -0.64 + Math.sin(a) * rr, a: 1 }); }
  line(-0.2, -0.68, 0.38, -0.68, 60); line(-0.2, -0.6, 0.18, -0.6, 36);
  const sections = [[-0.42, 0.44, 0.9], [-0.18, 0.5, 0.55], [0.06, 0.4, 0.8], [0.3, 0.46, 0.6], [0.54, 0.5, 0.75]];
  sections.forEach(([y, len, thick], i) => { line(-0.45, y, -0.45 + 0.34, y, 50, 1); for (let k = 1; k <= 2; k++) line(-0.45, y + k * 0.065, -0.45 + len * (k === 2 ? 1.5 : 2), y + k * 0.065, 70, 0.6 + thick * 0.3); void i; });
  return out;
}

function globeSource(): { lat: number; lon: number }[] {
  const pts: { lat: number; lon: number }[] = [];
  for (let lat = -58; lat <= 78; lat += 2) {
    const step = 2 / Math.max(Math.cos(lat * D2R), 0.2);
    for (let lon = -180; lon < 180; lon += step) {
      const spans = LAND[Math.floor(lat / 10) * 10];
      if (spans && spans.some(([a, b]) => lon >= a && lon <= b)) pts.push({ lat, lon });
    }
  }
  return pts;
}

function verifiedFormation(): T[] {
  const r = mulberry(9), out: T[] = [];
  for (let i = 0; i < 760; i++) { const a = (i / 760) * Math.PI * 2; out.push({ x: Math.cos(a) * 0.74, y: Math.sin(a) * 0.74, a: 1 }); }
  const seg = (x1: number, y1: number, x2: number, y2: number, n: number) => { for (let i = 0; i < n; i++) { const t = r(); out.push({ x: x1 + (x2 - x1) * t + (r() - 0.5) * 0.07, y: y1 + (y2 - y1) * t + (r() - 0.5) * 0.07, a: 1 }); } };
  seg(-0.36, 0.02, -0.1, 0.28, 220); seg(-0.1, 0.28, 0.4, -0.28, 360);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.2; for (let i = 0; i < 36; i++) { const rr = Math.sqrt(r()) * 0.06; const b = r() * 6.28; out.push({ x: Math.cos(a) * 0.95 + Math.cos(b) * rr, y: Math.sin(a) * 0.95 + Math.sin(b) * rr, a: 0.9 }); } }
  return out;
}

/* ------------------------------------------------------------------ */
const STAGES = [
  { k: "01", h: "One QR.", s: "One identity.", p: "Every skill, score and credential you earn lives behind a single code that anyone can verify." },
  { k: "02", h: "Your score,", s: "out of 100.", p: "Upload a resume and get a free QR Score with three plain-language focus areas. No sign-up, no fee." },
  { k: "03", h: "Your resume,", s: "finally read.", p: "Agents rewrite the bullets, close the skill gap and pick the course. Every fix moves the number." },
  { k: "04", h: "58 universities.", s: "Seven countries.", p: "From USA to UAE, requirements and fit are mapped against your own passport." },
  { k: "05", h: "Verified.", s: "Yours.", p: "A proctored Skill Passport that employers scan, then verified internships from screened employers." },
] as const;

export default function MorphField() {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(0.9999, -r.top / (r.height - window.innerHeight)));
      const s = Math.floor(p * STAGES.length);
      if (s !== stageRef.current) { stageRef.current = s; setStage(s); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(rm);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mobile = window.innerWidth < 900;
    const N = mobile ? 1300 : 2100;
    const fam = getComputedStyle(document.body).fontFamily || "sans-serif";

    const forms: T[][] = [
      qrFormation(),
      textFormation("85", 520, 340, `800 330px ${fam}`),
      resumeFormation(),
      [], // globe: live
      verifiedFormation(),
    ];
    const globeSrc = globeSource();
    const perm = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);
    const gperm = Array.from({ length: globeSrc.length }, (_, i) => i).sort(() => Math.random() - 0.5);

    type P = { x: number; y: number; vx: number; vy: number; k: number; d: number; c: number; a: number; s: number };
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    const ps: P[] = [];
    const rnd = mulberry(77);
    let mx = -9999, my = -9999, raf = 0, lon0 = 20, last = performance.now();

    const layout = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wide = W >= 900;
      cx = wide ? W * 0.7 : W / 2;
      cy = wide ? H * 0.52 : H * 0.27;
      R = wide ? Math.min(W * 0.27, H * 0.4) : Math.min(W * 0.38, H * 0.22);
    };
    layout();
    for (let i = 0; i < N; i++) {
      const c = rnd();
      ps.push({ x: cx + (rnd() - 0.5) * W, y: cy + (rnd() - 0.5) * H, vx: 0, vy: 0, k: 0.035 + rnd() * 0.05, d: 0.78 + rnd() * 0.12, c: c > 0.86 ? 2 : c > 0.5 ? 1 : 0, a: 1, s: 2.4 + rnd() * 2.2 });
    }
    const COLORS = ["#FF6A2F", "#FF9A5C", "#1A1A1A"];

    const target = (i: number, st: number): T => {
      if (st === 3) {
        const g = globeSrc[gperm[i % globeSrc.length]];
        const φ = g.lat * D2R, λ = (g.lon - lon0) * D2R, lat0 = 18 * D2R;
        const x = Math.cos(φ) * Math.sin(λ);
        const y = Math.cos(lat0) * Math.sin(φ) - Math.sin(lat0) * Math.cos(φ) * Math.cos(λ);
        const z = Math.sin(lat0) * Math.sin(φ) + Math.cos(lat0) * Math.cos(φ) * Math.cos(λ);
        return { x: x * 0.92, y: -y * 0.92, a: z > 0 ? 1 : 0.18 };
      }
      const f = forms[st];
      const t = f[Math.min(f.length - 1, Math.floor((perm[i] / N) * f.length))];
      return t;
    };

    const draw = (now: number) => {
      const dt = Math.min(now - last, 40) / 16.7;
      last = now;
      lon0 += 0.18 * dt;
      const st = stageRef.current;
      ctx.clearRect(0, 0, W, H);
      const bins: P[][] = [[], [], []];
      for (let i = 0; i < N; i++) {
        const p = ps[i];
        const t = target(i, st);
        const tx = cx + t.x * R, ty = cy + t.y * R;
        // breathing + spring
        const wob = Math.sin(now / 900 + i) * 0.6;
        p.vx += (tx + wob - p.x) * p.k * dt;
        p.vy += (ty - p.y) * p.k * dt;
        const dx = p.x - mx, dy = p.y - my, dd = dx * dx + dy * dy;
        if (dd < 110 * 110) { const f = (1 - Math.sqrt(dd) / 110) * 4.2; const m = Math.sqrt(dd) || 1; p.vx += (dx / m) * f; p.vy += (dy / m) * f; }
        p.vx *= Math.pow(p.d, dt); p.vy *= Math.pow(p.d, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.a += (t.a - p.a) * 0.12;
        bins[p.c].push(p);
      }
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = COLORS[b];
        for (const p of bins[b]) {
          ctx.globalAlpha = p.a * (b === 2 ? 0.85 : 1);
          const sz = p.s * Math.max(0.9, Math.min(1.5, R / 200)); ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
        }
      }
      ctx.globalAlpha = 1;
      if (!rm) raf = requestAnimationFrame(draw);
    };

    if (rm) { // jump straight to the QR formation, draw once
      for (let i = 0; i < N; i++) { const t = target(i, 0); ps[i].x = cx + t.x * R; ps[i].y = cy + t.y * R; }
      draw(performance.now());
    } else raf = requestAnimationFrame(draw);

    const onMove = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    const onLeave = () => { mx = my = -9999; };
    const onResize = () => { layout(); };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); window.removeEventListener("resize", onResize); };
  }, []);

  const S = STAGES[stage];
  return (
    <div ref={wrap} className={reduce ? "" : "h-[560vh]"} style={reduce ? undefined : { position: "relative" }}>
      <div className="sticky top-0 h-screen min-h-[560px] overflow-hidden bg-cream">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_72%_50%,rgba(255,106,47,0.18),transparent_65%),radial-gradient(40%_40%_at_10%_90%,rgba(255,176,32,0.14),transparent_60%)]" />
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-[0.1]" />
        <canvas ref={cv} aria-hidden className="absolute inset-0 h-full w-full touch-pan-y" />

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-[1320px] flex-col justify-end px-6 pb-20 pt-28 md:justify-center md:px-14 md:pb-0 md:pt-24"><div aria-hidden className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-cream from-45% to-transparent md:hidden" /><div className="relative">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-orange/20 bg-white/90 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-orange-dark shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-orange" />GrowQR × QR Score · {S.k} / 05
          </p>
          <div key={stage} className="ho-in max-w-[560px]">
            <h1 className="font-sans text-[clamp(2.6rem,6.2vw,5.6rem)] font-extrabold leading-[0.98] text-ink">
              {S.h}<br /><span className="bg-gradient-to-r from-orange via-[#FF8A4C] to-[#FFB020] bg-clip-text text-transparent">{S.s}</span>
            </h1>
            <p className="mt-5 max-w-[30em] text-[clamp(1rem,1.5vw,1.2rem)] leading-relaxed text-ink-3">{S.p}</p>
            <div className={`pointer-events-auto mt-7 flex flex-wrap gap-3 transition-opacity duration-500 ${stage === 0 || stage === 4 ? "opacity-100" : "opacity-0"}`}>
              <a href={SCORE_URL} className="cta-shine group inline-flex items-center gap-2 rounded-full bg-orange px-8 py-4 text-[1.05rem] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)] transition hover:scale-[1.015] hover:bg-orange-dark" tabIndex={stage === 0 || stage === 4 ? 0 : -1}>Score my resume, free <span aria-hidden>→</span></a>
              <WaitlistButton source="home-option-d-hero" className="inline-flex min-h-[56px] items-center rounded-full border border-black/15 bg-white/80 px-7 text-[1.02rem] font-semibold backdrop-blur transition hover:border-orange">Join the waitlist</WaitlistButton>
            </div>
          </div>
        </div></div>

        {/* progress rail */}
        <ol className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-auto md:left-auto md:right-8 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col" aria-label="Story progress">
          {STAGES.map((s, i) => (<li key={s.k} className={`h-1.5 rounded-full transition-all duration-500 md:h-auto md:w-1.5 ${i === stage ? "w-8 bg-orange md:h-8 md:w-1.5" : "w-1.5 bg-black/20 md:h-1.5"}`} aria-current={i === stage ? "step" : undefined} />))}
        </ol>
        <p className={`absolute bottom-6 left-6 z-10 hidden text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-ink-4 transition-opacity md:block ${stage === 0 ? "opacity-100" : "opacity-0"}`}>Scroll · move your cursor through the code</p>
      </div>
    </div>
  );
}
