"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MdOutlineQrCode2 } from "react-icons/md";

/** Returns a ref — attach to a DOM element to get a boolean that's true
 *  while the element is intersecting the viewport. */
function useIsVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "100px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

/** Full oscillation period in ms — score climbs from min→max→min continuously. */
const OSCILLATION_MS = 5200;

/**
 * GrowQR "Unified QR" product tile.
 *
 * A bright-orange card with a dot-grid texture, a "UNIFIED QR" pill,
 * an organic rounded QR-style illustration, a RQ-SCORE readout, and a
 * sparkline bar chart. Matches the in-product identity art.
 *
 * Pass `scores` to cycle the number through a list on a timer — each
 * value slides up and out while the next slides in from below, matching
 * the rotating word treatment used in the hero headline.
 */
export default function QRMark({
  size = 232,
  score = 70,
  scores,
  animate = true,
  animateSparkline = true,
  label = "Unified QR",
}: {
  size?: number;
  score?: number;
  /** Optional list of scores to cycle through. When ≥ 2 values, the
   *  displayed number animates between entries every `cycleMs`. */
  scores?: number[];
  animate?: boolean;
  animateSparkline?: boolean;
  label?: string;
}) {
  // Continuous sine-wave oscillation between min and max of the scores
  // array. The score glides up to the peak, back down, and repeats —
  // no snaps, no pauses, no direction reversals.
  const cycling = animateSparkline && Array.isArray(scores) && scores.length > 1;
  const scoreMin = cycling ? Math.min(...scores!) : score;
  const scoreMax = cycling ? Math.max(...scores!) : score;
  const rafRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState(cycling ? scoreMin : score);
  const { ref: visibilityRef, visible } = useIsVisible<HTMLDivElement>();

  useEffect(() => {
    if (!cycling || !visible) return;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((now - start) % OSCILLATION_MS) / OSCILLATION_MS;
      // Smooth sine: 0→1→0 over one period, starting at the bottom
      const t = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
      setDisplayValue(Math.round(scoreMin + (scoreMax - scoreMin) * t));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [cycling, scoreMin, scoreMax, visible]);

  const displayScore = cycling ? displayValue : score;
  // aspect ~ 10:13 (w:h) — taller so QR + RQ-SCORE + sparkline don't collide
  const w = size;
  const h = Math.round(size * 1.3);
  const qrWidth = Math.round(w * 0.68);
  const qrHeight = Math.round(qrWidth * (124 / 200));

  const content = (
    <>
      {/* Soft outer glow */}
        <div
          className="absolute rounded-[44px] pointer-events-none"
        style={{
          width: w * 1.2,
          height: h * 1.15,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,106,47,0.55) 0%, rgba(255,106,47,0.18) 45%, rgba(255,106,47,0) 75%)",
          filter: "blur(30px)",
        }}
        aria-hidden
      />

      {/* Outer bright ring */}
        <div
          className="absolute rounded-[36px]"
        style={{
          width: w + 16,
          height: h + 16,
          background: "#FF7A3F",
          boxShadow: "0 30px 80px -20px rgba(255,106,47,0.55)",
        }}
        aria-hidden
      />

      {/* Tile */}
        <div
          className="relative rounded-[30px] overflow-hidden"
        style={{
          width: w,
          height: h,
          background:
            "linear-gradient(170deg, #FF8A4E 0%, #FF6A2F 45%, #F25518 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -24px 40px rgba(180,60,10,0.25)",
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.22) 1px, rgba(255,255,255,0) 1.4px)",
            backgroundSize: "9px 9px",
            mixBlendMode: "soft-light",
            opacity: 0.9,
          }}
          aria-hidden
        />

        {/* Top highlight */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "35%",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
          }}
          aria-hidden
        />

        {/* Organic QR illustration */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: Math.round(h * 0.08),
            width: qrWidth,
            height: qrHeight,
          }}
        >
          <MdOutlineQrCode2 className="h-full w-full text-white/95" />
        </div>

        {/* RQ-SCORE + number */}
        <div
          className="absolute inset-x-0 text-center"
          style={{ bottom: Math.round(h * 0.16) }}
        >
          <div
            className="text-white/85 font-bold uppercase"
            style={{
              fontSize: "clamp(7.5px, 1.9vw, 10.5px)",
              letterSpacing: "0.2em",
            }}
          >
            RQ-Score
          </div>
          <div
            className="text-white font-extrabold tracking-[-0.04em] leading-none mt-1"
            style={{ fontSize: "clamp(22px, 6.2vw, 44px)" }}
          >
            {/* Plain span — the count-up tween updates `displayScore`
                integer-by-integer, so the number visibly climbs rather
                than flipping between discrete values. */}
            <span className="tabular-nums">{displayScore}</span>
          </div>
        </div>

        {/* Sparkline */}
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{ bottom: Math.round(h * 0.055) }}
        >
          <Sparkline width={Math.round(w * 0.42)} animate={animateSparkline} visible={visible} />
        </div>
      </div>
    </>
  );

  if (!animate) {
    return (
      <div
        ref={visibilityRef}
        className="relative flex items-center justify-center"
        style={{ width: w + 60, height: h + 60 }}
      >
        {content}
      </div>
    );
  }

  return (
    <motion.div
      ref={visibilityRef}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative flex items-center justify-center"
      style={{ width: w + 60, height: h + 60 }}
    >
      {content}
    </motion.div>
  );
}

/* ------- Animated equalizer bars ------- */
// Each bar has a unique frequency + phase so they never move in lockstep.
const BAR_COUNT = 15;
const BAR_PROFILES = Array.from({ length: BAR_COUNT }, (_, i) => ({
  freq:  0.00022 + (i * 0.000038) + (i % 3) * 0.000055,
  phase: (i * 1.37) % (2 * Math.PI),
  // base height as fraction of maxH — keeps short bars short, tall bars tall
  base:  0.25 + 0.55 * Math.abs(Math.sin(i * 0.72)),
}));

function Sparkline({ width, animate = true, visible = true }: { width: number; animate?: boolean; visible?: boolean }) {
  const barW = 2.2;
  const gap  = 2;
  const maxH = 16;
  const totalW = BAR_COUNT * (barW + gap);

  const [heights, setHeights] = useState<number[]>(() =>
    BAR_PROFILES.map((p) => p.base * maxH),
  );

  useEffect(() => {
    if (!animate || !visible) return;
    let raf: number;
    const tick = (now: number) => {
      setHeights(
        BAR_PROFILES.map((p) => {
          // Sine oscillation around the bar's base height
          const swing = 0.5 - 0.5 * Math.cos(2 * Math.PI * p.freq * now + p.phase);
          // Floor at 15% so no bar ever fully disappears
          return Math.max(maxH * 0.15, p.base * maxH * (0.55 + 0.9 * swing));
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, visible]);

  return (
    <svg
      width={width}
      height={maxH + 2}
      viewBox={`0 0 ${totalW} ${maxH + 2}`}
      aria-hidden
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * (barW + gap)}
          y={maxH - h + 1}
          width={barW}
          height={h}
          rx={barW / 2}
          fill="rgba(255,255,255,0.85)"
        />
      ))}
    </svg>
  );
}
