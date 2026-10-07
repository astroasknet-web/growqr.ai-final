"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, LAND } from "./data";

const D2R = Math.PI / 180;

function isLand(lat: number, lon: number) {
  const band = Math.floor(lat / 10) * 10;
  const spans = LAND[band];
  if (!spans) return false;
  return spans.some(([a, b]) => lon >= a && lon <= b);
}

/** Rotating dotted globe with the seven study-abroad destinations pinned. Pure canvas. */
export default function Globe({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hot, setHot] = useState<string | null>(null);
  const hotRef = useRef<string | null>(null);
  hotRef.current = hot;

  const dots = useMemo(() => {
    const out: [number, number][] = [];
    for (let lat = -58; lat <= 78; lat += 2.2) {
      const step = 2.2 / Math.max(Math.cos(lat * D2R), 0.2);
      for (let lon = -180; lon < 180; lon += step) if (isLand(lat, lon)) out.push([lat, lon]);
    }
    return out;
  }, []);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let S = 0, raf = 0, lon0 = 20, last = performance.now();
    const lat0 = 18 * D2R;
    const size = () => {
      const r = cv.getBoundingClientRect();
      S = r.width;
      cv.width = S * dpr;
      cv.height = S * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const proj = (lat: number, lon: number) => {
      const φ = lat * D2R, λ = (lon - lon0) * D2R;
      const x = Math.cos(φ) * Math.sin(λ);
      const y = Math.cos(lat0) * Math.sin(φ) - Math.sin(lat0) * Math.cos(φ) * Math.cos(λ);
      const z = Math.sin(lat0) * Math.sin(φ) + Math.cos(lat0) * Math.cos(φ) * Math.cos(λ);
      return { x, y, z };
    };
    const draw = (t: number) => {
      const dt = Math.min(t - last, 50);
      last = t;
      if (!reduce) lon0 += dt * 0.012;
      const R = S * 0.42, cx = S / 2, cy = S / 2;
      ctx.clearRect(0, 0, S, S);
      // atmosphere + sphere
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 1.25);
      if (dark) { g.addColorStop(0, "rgba(255,150,90,.22)"); g.addColorStop(0.7, "rgba(255,106,47,.06)"); g.addColorStop(1, "rgba(255,106,47,0)"); }
      else { g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.75, "rgba(255,234,219,.9)"); g.addColorStop(1, "rgba(255,106,47,.12)"); }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, 0, 7); ctx.fill();
      ctx.fillStyle = dark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.7)";
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = dark ? "rgba(255,255,255,.14)" : "rgba(26,26,26,.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // land dots
      for (const [lat, lon] of dots) {
        const p = proj(lat, lon);
        if (p.z <= 0) continue;
        const a = 0.25 + p.z * 0.75;
        ctx.fillStyle = dark ? `rgba(255,255,255,${a * 0.85})` : `rgba(26,26,26,${a * 0.5})`;
        ctx.fillRect(cx + p.x * R - 1.1, cy - p.y * R - 1.1, 2.3, 2.3);
      }
      // arcs from the hub (Delhi-ish origin) to each destination
      const origin = { lat: 28.6, lon: 77.2 };
      const o = proj(origin.lat, origin.lon);
      for (const c of COUNTRIES) {
        const p = proj(c.lat, c.lon);
        if (p.z <= 0 || o.z <= 0) continue;
        const mx = (o.x + p.x) / 2, my = (o.y + p.y) / 2;
        ctx.strokeStyle = "rgba(255,106,47,.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + o.x * R, cy - o.y * R);
        ctx.quadraticCurveTo(cx + mx * R * 1.22, cy - my * R * 1.22, cx + p.x * R, cy - p.y * R);
        ctx.stroke();
      }
      // origin
      if (o.z > 0) { ctx.fillStyle = "#12E27A"; ctx.beginPath(); ctx.arc(cx + o.x * R, cy - o.y * R, 3.2, 0, 7); ctx.fill(); }
      // pins
      const pulse = (Math.sin(t / 380) + 1) / 2;
      for (const c of COUNTRIES) {
        const p = proj(c.lat, c.lon);
        if (p.z <= 0.05) continue;
        const px = cx + p.x * R, py = cy - p.y * R;
        const isHot = hotRef.current === c.name;
        ctx.fillStyle = `rgba(255,106,47,${0.25 * (1 - pulse)})`;
        ctx.beginPath(); ctx.arc(px, py, 5 + pulse * 11 + (isHot ? 6 : 0), 0, 7); ctx.fill();
        ctx.fillStyle = "#FF6A2F";
        ctx.beginPath(); ctx.arc(px, py, isHot ? 6 : 4.2, 0, 7); ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6; ctx.stroke();
        if (p.z > 0.3 || isHot) {
          ctx.font = `600 ${Math.max(10, S * 0.026)}px Poppins, system-ui, sans-serif`;
          const label = `${c.name} · ${c.count}`;
          const w = ctx.measureText(label).width + 12;
          const lx = px + 9, ly = py - 10;
          ctx.fillStyle = dark ? "rgba(10,10,10,.85)" : "rgba(255,255,255,.95)";
          ctx.strokeStyle = "rgba(255,106,47,.45)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(lx, ly - 11, w, 20, 10); ctx.fill(); ctx.stroke();
          ctx.fillStyle = dark ? "#fff" : "#1A1A1A";
          ctx.fillText(label, lx + 6, ly + 3);
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    size();
    raf = requestAnimationFrame(draw);
    if (reduce) draw(performance.now());
    const ro = new ResizeObserver(() => { size(); if (reduce) draw(performance.now()); });
    ro.observe(cv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [dark, dots]);

  return (
    <div className={className}>
      <canvas ref={ref} role="img" aria-label="Rotating globe showing study-abroad destinations: USA 9, UK 9, Canada 8, Germany 8, Australia 8, France 9 and UAE 7 universities" className="aspect-square w-full" />
      <ul className="mt-2 flex flex-wrap justify-center gap-2" aria-label="Destinations">
        {COUNTRIES.map((c) => (
          <li key={c.name}>
            <button
              type="button"
              onMouseEnter={() => setHot(c.name)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(c.name)}
              onBlur={() => setHot(null)}
              className={`min-h-[44px] rounded-full border px-4 text-[0.88rem] font-semibold transition ${dark ? "border-white/20 text-white hover:bg-white/10" : "border-black/10 bg-white text-ink hover:border-orange"}`}
            >
              {c.name} <span className="text-orange">{c.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
