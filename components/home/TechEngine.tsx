"use client";

import React from "react";
import { Eyebrow, SectionHeading } from "./SectionHeader";
import Reveal from "@/components/ui/Reveal";

const ORANGE = "#FF6A2F";
const ORANGE_DEEP = "#9C3A11";

type TechTileData = {
  id: string;
  label: string;
  tagline: string;
  explanation: string;
  illustration: React.ReactNode;
};

/**
 * Finalised tile copy. Each tile carries four fields:
 *   - `category` : short category label (UNIFIED QR, RQ-SCORE, etc.)
 *   - `label`    : headline (the hook)
 *   - `tagline`  : one-line sub-phrase in orange
 *   - `explanation`: 1-2 line body paragraph
 */
type Tile = TechTileData & { category: string };

const tiles: Tile[] = [
  {
    id: "qr",
    category: "Unified QR",
    label: "One QR for everything you are.",
    tagline: "Your career in a single scan",
    explanation:
      "Every skill, score, and achievement lives in a single QR code that stays with you. Scan it anywhere — in an interview, on LinkedIn, on your business card.",
    illustration: <QRIllustration />,
  },
  {
    id: "score",
    category: "RQ-Score",
    label: "A score that actually matters",
    tagline: "25 signals. One number.",
    explanation:
      "Your career readiness measured across 25 dimensions and refreshed every month. Not a credit score — a career one.",
    illustration: <MeterIllustration />,
  },
  {
    id: "ai",
    category: "Personalised AI",
    label: "AI that knows you",
    tagline: "Your agents learn as you grow.",
    explanation:
      "Every agent tailors its work to your role, your goals, and your history. Nobody else's experience. Just yours.",
    illustration: <NetworkIllustration />,
  },
  {
    id: "blockchain",
    category: "Blockchain",
    label: "Achievements that can't be faked.",
    tagline: "Verified. Permanent. Yours.",
    explanation:
      "Your credentials are written to a public blockchain — verifiable by any employer, any time, with no middleman and no expiry.",
    illustration: <ChainIllustration />,
  },
  {
    id: "deep-matching",
    category: "Deep Matching",
    label: "Matching at the speed of thought.",
    tagline: "Millions of signals, instant clarity",
    explanation:
      "Our adaptive match engine processes thousands of career paths, skills, and opportunities in seconds to surface the ones that actually fit you.",
    illustration: <AtomIllustration />,
  },
  {
    id: "humans",
    category: "Human Intel",
    label: "Real people, when AI isn't enough.",
    tagline: "Coaches, mentors, experts— on demand",
    explanation:
      "A curated network of humans ready to step in for the moments that need judgment, not just throughput.",
    illustration: <PeopleIllustration />,
  },
];

/**
 * Tech Stack section — compact 3×2 grid.
 *
 * Deliberately tighter than the Problem / Use Cases / Humans+Agents
 * sections: smaller tiles, shorter section padding, no sub-paragraph.
 * The page has already done the heavy lifting by this point; this
 * section's job is to enumerate capabilities without stealing focus.
 */
export const TechEngine: React.FC = () => {
  return (
    <section
      id="tech-stack"
      className="relative border-y border-black/5 bg-cream px-5 py-12 sm:px-6 md:px-14 md:py-20"
    >
      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="mx-auto mb-7 text-center sm:mb-8 md:mb-10">
          <Reveal direction="left" offset={60}>
            <Eyebrow center>The Tech Stack</Eyebrow>
            <SectionHeading className="mx-auto max-w-[340px] !text-[34px] !leading-[1] sm:max-w-[520px] sm:!text-[40px] md:max-w-none md:whitespace-nowrap md:!text-[52px] md:!leading-[0.92] xl:!text-[64px]">
              <span className="block md:inline">Powered by</span>{" "}
              <span className="text-orange">Adaptive</span>{" "}Intelligence
              <span className="text-orange">.</span>
            </SectionHeading>
          </Reveal>
        </div>

        {/* Mobile uses one readable column; the compact multi-column grid begins
            once each tile has enough width for its hierarchy to breathe. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {tiles.map((t) => (
            <TechTile key={t.id} tile={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

function TechTile({ tile }: { tile: Tile }) {
  return (
    <article className="group relative flex flex-col gap-3 rounded-xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-orange-light hover:shadow-[0_6px_16px_-6px_rgba(255,106,47,0.18)] sm:p-5">
      {/* Header row — illustration + category pill. */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          {tile.illustration}
        </div>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: ORANGE_DEEP }}
        >
          {tile.category}
        </span>
      </div>

      {/* Headline + one-line tagline — the explanation paragraph used
          to sit below these. It's been dropped so the grid reads
          lighter; the tagline already carries the hook. */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[17px] font-bold leading-[1.3] text-[#333333] sm:text-[15px]">
          {tile.label}
        </h3>
        <p className="text-[14px] font-medium leading-[1.45] sm:text-[12.5px]" style={{ color: ORANGE_DEEP }}>
          {tile.tagline}
        </p>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Placeholder illustrations — simple orange geometric shapes.
   Replace with final artwork by swapping the component bodies only;
   their public surface (40×40 wrapper) stays the same.
   ───────────────────────────────────────────────────────────────────── */

function QRIllustration() {
  // 3×3 matrix of rounded squares — QR-ish feel without being a literal QR.
  const cells = [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="6"
        fill="#FFF5EE"
        stroke={ORANGE}
        strokeWidth="1.4"
        strokeOpacity="0.35"
      />
      {cells.map((row, r) =>
        row.map((on, c) => {
          if (!on) return null;
          const size = 7.5;
          const gap = 2.2;
          const start = 8;
          return (
            <rect
              key={`${r}-${c}`}
              x={start + c * (size + gap)}
              y={start + r * (size + gap)}
              width={size}
              height={size}
              rx="1.6"
              fill={ORANGE}
            />
          );
        })
      )}
    </svg>
  );
}

function MeterIllustration() {
  // Circular ring with a 3/4 arc — "score" meter reference.
  const size = 40;
  const r = 14;
  const cx = size / 2;
  const cy = size / 2;
  // 270° arc starting at -225deg
  const circumference = 2 * Math.PI * r;
  const arcLen = circumference * 0.68;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ORANGE} strokeOpacity="0.2" strokeWidth="3" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={ORANGE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`}
        transform={`rotate(-110 ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r="3" fill={ORANGE} />
    </svg>
  );
}

function NetworkIllustration() {
  // Central node with 4 satellites connected by lines.
  const edges = [
    [20, 20, 6, 10],
    [20, 20, 34, 10],
    [20, 20, 6, 30],
    [20, 20, 34, 30],
  ];
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      {edges.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={ORANGE}
          strokeOpacity="0.4"
          strokeWidth="1.2"
        />
      ))}
      <circle cx="6" cy="10" r="3" fill={ORANGE} opacity="0.85" />
      <circle cx="34" cy="10" r="3" fill={ORANGE} opacity="0.85" />
      <circle cx="6" cy="30" r="3" fill={ORANGE} opacity="0.85" />
      <circle cx="34" cy="30" r="3" fill={ORANGE} opacity="0.85" />
      <circle cx="20" cy="20" r="5" fill={ORANGE} />
    </svg>
  );
}

function ChainIllustration() {
  // Three interlocking rounded rectangles — chain-link feel.
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <rect
        x="4"
        y="14"
        width="16"
        height="12"
        rx="6"
        fill="none"
        stroke={ORANGE}
        strokeWidth="2"
      />
      <rect
        x="14"
        y="8"
        width="16"
        height="12"
        rx="6"
        fill="none"
        stroke={ORANGE}
        strokeWidth="2"
        opacity="0.75"
      />
      <rect
        x="20"
        y="20"
        width="16"
        height="12"
        rx="6"
        fill="none"
        stroke={ORANGE}
        strokeWidth="2"
      />
    </svg>
  );
}

function AtomIllustration() {
  // Three crossed ellipses around a nucleus — atomic/quantum reference.
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <ellipse
        cx="20"
        cy="20"
        rx="16"
        ry="6"
        fill="none"
        stroke={ORANGE}
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="16"
        ry="6"
        fill="none"
        stroke={ORANGE}
        strokeOpacity="0.55"
        strokeWidth="1.4"
        transform="rotate(60 20 20)"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="16"
        ry="6"
        fill="none"
        stroke={ORANGE}
        strokeOpacity="0.55"
        strokeWidth="1.4"
        transform="rotate(-60 20 20)"
      />
      <circle cx="20" cy="20" r="3" fill={ORANGE} />
    </svg>
  );
}

function PeopleIllustration() {
  // Three overlapping person silhouettes — coach network cue.
  const person = (x: number, opacity = 1) => (
    <g key={x} opacity={opacity}>
      <circle cx={x} cy="14" r="3.2" fill={ORANGE} />
      <path
        d={`M ${x - 6} 32 Q ${x} 22 ${x + 6} 32 Z`}
        fill={ORANGE}
      />
    </g>
  );
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      {person(10, 0.55)}
      {person(30, 0.55)}
      {person(20, 1)}
    </svg>
  );
}
