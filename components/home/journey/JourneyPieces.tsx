"use client";

import { motion } from "framer-motion";
import { Flag, Sparkles, Star } from "lucide-react";
import type { ComponentType } from "react";
import { ACCENT_FG, type Accent, type Feature } from "./journeyData";
import { useSvgInView } from "@/lib/useSvgInView";

const ease = [0.22, 1, 0.36, 1] as const;

/** Soft glassmorphism surface shared by every floating card. */
export const GLASS =
  "border border-white/60 bg-white/70 shadow-[0_18px_50px_-22px_rgba(20,20,20,0.25)] backdrop-blur-xl";

type IconType = ComponentType<{ className?: string }>;

/** Fade + slight rise on scroll — the section's standard reveal. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Solid accent-coloured rounded tile with a white glyph; floats gently. */
export function IconTile({
  Icon,
  color,
  size = "md",
  delay = 0,
}: {
  Icon: IconType;
  color: string;
  size?: "sm" | "md" | "lg";
  delay?: number;
}) {
  const tile =
    size === "lg" ? "h-14 w-14" : size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const glyph =
    size === "lg" ? "h-7 w-7" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-xl ${tile}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 12px 24px -10px ${color}80`,
        animationDelay: `${delay}s`,
      }}
    >
      <Icon className={`${glyph} text-white`} />
    </div>
  );
}

/** Soft, curved golden beam that arcs from a rail icon toward the road/tree.
 *  Left-rail icons beam to the right; right-rail icons beam to the left. The
 *  stroke fades toward the tree end and carries a warm drop-shadow glow. */
function GoldenBeam({
  side,
  delay = 0,
}: {
  side: "left" | "right";
  delay?: number;
}) {
  const isLeft = side === "left";
  // Icon end anchored at the viewBox vertical centre (y=18); the curve bows
  // upward as it reaches toward the tree, loosely following a branch.
  const d = isLeft ? "M2 18 C 40 18, 62 8, 98 6" : "M98 18 C 60 18, 38 8, 2 6";
  const gradId = isLeft ? "goldBeamL" : "goldBeamR";
  // Observed on the HTML wrapper — a `whileInView` on the <path>s themselves
  // never fires in Safari (see lib/useSvgInView.ts).
  const [beamRef, inView] = useSvgInView<HTMLSpanElement>({ amount: 0.4 });
  return (
    <span
      ref={beamRef}
      aria-hidden
      className={`pointer-events-none absolute top-5 z-[-1] w-28 -translate-y-1/2 lg:w-44 ${
        isLeft ? "left-[58%]" : "right-[58%]"
      }`}
    >
      <svg
        viewBox="0 0 100 36"
        fill="none"
        className="h-auto w-full overflow-visible"
        style={{ filter: "drop-shadow(0 0 4px rgba(255,165,70,0.4))" }}
      >
        <defs>
          <linearGradient
            id={gradId}
            gradientUnits="userSpaceOnUse"
            x1={isLeft ? "0" : "100"}
            y1="0"
            x2={isLeft ? "100" : "0"}
            y2="0"
          >
            <stop offset="0%" stopColor="#FFB45A" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#FFA041" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#FF9637" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Base beam — faint static arc, draws in once on view. */}
        <motion.path
          d={d}
          stroke={`url(#${gradId})`}
          strokeWidth={1.75}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.8, ease, delay: delay + 0.2 }}
        />
        {/* Travelling light pulse — a bright glint that glides from the tree
            into the icon on a gentle loop, giving the beam a living, premium feel. */}
        <motion.path
          d={d}
          stroke="#FFE0A3"
          strokeWidth={2}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="0.16 0.84"
          initial={{ strokeDashoffset: 1, opacity: 0 }}
          animate={
            inView
              ? { strokeDashoffset: [1, 0], opacity: [0, 1, 1, 0] }
              : undefined
          }
          transition={{
            duration: 2.4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1.4,
            delay: delay + 1,
            times: [0, 0.12, 0.82, 1],
          }}
        />
      </svg>
    </span>
  );
}

/** Icon on top with the label underneath — same shape as the opportunity
 *  tiles, so every feature reads consistently. */
export function FeatureBlock({
  feature,
  delay = 0,
  beamSide,
}: {
  feature: Feature;
  delay?: number;
  /** When set, a soft golden beam arcs from the icon toward the road —
   *  "left" rail icons beam to the right, "right" rail icons beam to the left. */
  beamSide?: "left" | "right";
}) {
  const fg = ACCENT_FG[feature.accent];
  return (
    <div className="relative flex w-[96px] flex-col items-center gap-2 text-center">
      {beamSide && <GoldenBeam side={beamSide} delay={delay} />}
      <IconTile Icon={feature.icon} color={fg} size="sm" delay={delay} />
      <h4
        className="text-[12.5px] font-semibold leading-tight tracking-[-0.01em]"
        style={{ color: fg }}
      >
        {feature.title}
      </h4>
    </div>
  );
}

/** Thin, elegant, slightly transparent dotted connector that draws in and
 *  points from a side feature toward the road. */
export function Connector({
  side,
  accent,
}: {
  side: "left" | "right";
  accent: Accent;
}) {
  const color = ACCENT_FG[accent];
  const d =
    side === "left"
      ? "M2 16 C 80 16, 110 60, 196 60"
      : "M198 16 C 120 16, 90 60, 4 60";
  const arrow =
    side === "left" ? "M189 55 L197 60 L189 65" : "M11 55 L3 60 L11 65";
  // Observed on the root <svg>, which WebKit does report on — a `whileInView`
  // on the <path>s never fires in Safari (see lib/useSvgInView.ts).
  const [svgRef, inView] = useSvgInView<SVGSVGElement>({ amount: 0.4 });
  return (
    <svg ref={svgRef} width="200" height="76" viewBox="0 0 200 76" fill="none" className="overflow-visible">
      <motion.path
        d={d}
        stroke={color}
        strokeOpacity={0.55}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1.5 7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.9, ease }}
      />
      <motion.path
        d={arrow}
        stroke={color}
        strokeOpacity={0.7}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3, delay: 0.85 }}
      />
    </svg>
  );
}

/** Small horizontal dotted link between the top stat cards and the destination. */
export function HConnector({ flip = false }: { flip?: boolean }) {
  const color = ACCENT_FG.orange;
  return (
    <svg
      width="64"
      height="20"
      viewBox="0 0 64 20"
      fill="none"
      className={flip ? "rotate-180" : ""}
    >
      <line
        x1="4"
        y1="10"
        x2="52"
        y2="10"
        stroke={color}
        strokeOpacity={0.6}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1.5 6"
      />
      <path
        d="M52 5 L60 10 L52 15"
        stroke={color}
        strokeOpacity={0.7}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Destination card — the final outcome, styled as an "achievement unlocked"
 *  moment: a gradient flag medallion, warm glass surface, gradient wordmark
 *  and a small star rating to reward reaching the end of the journey. */
export function DestinationCard() {
  return (
    <div className="relative mx-auto w-fit [perspective:680px]">
      {/* Tilt the whole badge back into the road's receding plane for depth. */}
      <div
        className="relative [transform-style:preserve-3d]"
        style={{ transform: "rotateX(24deg)", transformOrigin: "center bottom" }}
      >
      {/* soft contact shadow that grounds the badge on the road */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-2 left-1/2 h-4 w-[78%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-md"
      />
      {/* Flag medallion — golden gradient fill, white ring + warm glow. */}
      <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
        <div className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#F2C14B] to-[#C8861B] shadow-[0_8px_18px_-8px_rgba(200,134,27,0.75)] ring-[2.5px] ring-white">
          <Flag className="h-3 w-3 text-white" fill="currentColor" />
          <span
            aria-hidden
            className="absolute -inset-1 -z-10 rounded-full bg-[#E5A434]/40 blur-md"
          />
        </div>
      </div>

      {/* Circular surface */}
      <div className="relative grid h-[116px] w-[116px] place-items-center overflow-hidden rounded-full border border-white/70 bg-white/85 text-center shadow-[0_14px_34px_-20px_rgba(20,20,20,0.22)] ring-1 ring-black/[0.04] backdrop-blur-xl">
        {/* corner sparkles */}
        <Sparkles aria-hidden className="absolute right-5 top-4 h-2.5 w-2.5 text-[#D99B2B]/55" />
        <Sparkles aria-hidden className="absolute bottom-5 left-5 h-1.5 w-1.5 text-[#D99B2B]/35" />

        <div className="relative px-3.5">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#9A6510]/85">
            Destination
          </span>
          <p className="mt-1 bg-gradient-to-r from-[#E5A434] to-[#C8861B] bg-clip-text text-[18px] font-extrabold leading-none tracking-[-0.02em] text-transparent">
            Unlocked
          </p>
          <div className="mt-1.5 flex items-center justify-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <Star key={i} className="h-2.5 w-2.5 text-[#E5A434]" fill="#E5A434" />
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

/** Small achievement / stat card (the two flanking the destination). */
export function StatCard({
  Icon,
  title,
  sub,
}: {
  Icon: IconType;
  title: string;
  sub: string;
}) {
  return (
    <div className={`w-[160px] rounded-2xl px-5 py-5 text-center ${GLASS}`}>
      <Icon className="mx-auto h-7 w-7 text-orange" />
      <p className="mt-2 text-[15px] font-semibold text-orange">{title}</p>
      <p className="mt-0.5 text-[12px] text-ink-4">{sub}</p>
    </div>
  );
}

/** The section's centre label — rendered as warm light glowing on the road so
 *  it reads as part of the path rather than a card floating over it. */
export function EcosystemLabel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative select-none text-center ${className}`}>
      {/* warm glow that seats the text in the road's light */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,160,70,0.55), rgba(255,160,70,0) 70%)",
        }}
      />
      <h3
        className="whitespace-nowrap text-[17px] font-bold tracking-[0.015em] text-white"
        style={{
          textShadow:
            "0 0 5px rgba(255,255,255,0.85), 0 0 14px rgba(255,150,60,0.95), 0 0 28px rgba(255,110,35,0.75), 0 1px 2px rgba(90,35,5,0.55)",
        }}
      >
        The GrowQR Ecosystem
      </h3>
    </div>
  );
}
