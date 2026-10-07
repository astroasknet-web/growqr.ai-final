"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  ScanFace,
  Route,
  BrainCog,
  Bot,
  DoorOpen,
  Building2,
  Users,
  Workflow,
  Megaphone,
  TrendingUp,
  Play,
  X,
  type LucideIcon,
} from "lucide-react";
import { useIsMobile } from "@/lib/useIsMobile";
import { useSvgInView } from "@/lib/useSvgInView";

const EASE = [0.22, 1, 0.36, 1] as const;

/* Lane + icon reveal. Driven from the wrapper's in-view flag rather than a
   per-element `whileInView`, because Safari's IntersectionObserver never fires
   for SVG children — see lib/useSvgInView.ts. */
const laneVariants: Variants = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0 },
};

const laneIconVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

/* ------------------------------------------------------------------ */
/*  Content — data-driven so the same panel can render Individuals /    */
/*  Business by swapping the steps.                                      */
/* ------------------------------------------------------------------ */

export type JourneyStep = {
  id: string;
  title: string;
  Icon: LucideIcon;
};

export type GrowthJourneyProps = {
  qrSrc?: string;
  videoSrc?: string;
  steps?: JourneyStep[];
  /** Text inside the centre emblem, e.g. "Your Growth QR". */
  qrLabel?: ReactNode;
};

const DEFAULT_STEPS: JourneyStep[] = [
  { id: "activate", title: "Activate QR Identity", Icon: ScanFace },
  { id: "pathways", title: "Choose Pathways", Icon: Route },
  { id: "readiness", title: "Readiness Skills", Icon: BrainCog },
  { id: "agents", title: "Human & Personalized Agents", Icon: Bot },
  { id: "opportunities", title: "Unlock Growth Opportunities", Icon: DoorOpen },
];

const DEFAULT_QR_LABEL = (
  <>
    Your <span className="text-orange-deep">Growth</span> QR
  </>
);

const DEFAULT_QR = "/growqrcode.png";
const DEFAULT_VIDEO = "/Web-Seeker-Intro-Vdo-1.mp4";

/* ------------------------------------------------------------------ */
/*  Business variant — same component + layout, business content.       */
/*  Spread onto <GrowthJourney /> for the enterprise page.              */
/* ------------------------------------------------------------------ */

export const BUSINESS_JOURNEY: GrowthJourneyProps = {
  videoSrc: "/enterprise.mp4",
  qrLabel: (
    <>
      Your <span className="text-orange-deep">Business</span> QR
    </>
  ),
  steps: [
    { id: "identity", title: "Activate Business Identity", Icon: Building2 },
    { id: "talent", title: "Talent Management Studio", Icon: Users },
    { id: "automate", title: "Automate Operations", Icon: Workflow },
    { id: "brand", title: "Elevate Your Brand Presence", Icon: Megaphone },
    { id: "scale", title: "Scale Business Growth", Icon: TrendingUp },
  ],
};

/* One flat orange shade across every lane/tile for a minimal, uniform look. */
const LANE_COLORS = ["#DB8035", "#DB8035", "#DB8035", "#DB8035", "#DB8035"];

/* ------------------------------------------------------------------ */
/*  Lane geometry — computed once in the SVG's 1000×620 coordinate      */
/*  space. Each lane is a ribbon whose narrow tail converges behind the  */
/*  circle (left) and flares to a full-width band on the right.          */
/* ------------------------------------------------------------------ */

const VB = { w: 1000, h: 620 };
const CX = 120; // tail origin (hidden behind the circle)
const XTAB = 250; // end of the narrow tail
const XMID = 440; // where the band reaches full width
const XR = 1000; // right edge

const N = 5;
const TAB_TOP0 = 238;
const TAB_STEP = 29;
const TAB_H = 24;

const BAND_PAD = 16;
const BAND_SLOT = (VB.h - BAND_PAD * 2) / N; // 117.6
const BAND_H = 100;

type Lane = {
  i: number;
  points: string;
  color: string;
  centerY: number; // band vertical center, viewBox units
  centerPct: number; // band vertical center as % of height (for HTML overlay)
};

const LANES: Lane[] = Array.from({ length: N }, (_, i) => {
  const tabTop = TAB_TOP0 + i * TAB_STEP;
  const tabBot = tabTop + TAB_H;
  const bandTop = BAND_PAD + i * BAND_SLOT;
  const bandBot = bandTop + BAND_H;
  const centerY = (bandTop + bandBot) / 2;
  return {
    i,
    points: [
      `${CX},${tabTop}`,
      `${XTAB},${tabTop}`,
      `${XMID},${bandTop}`,
      `${XR},${bandTop}`,
      `${XR},${bandBot}`,
      `${XMID},${bandBot}`,
      `${XTAB},${tabBot}`,
      `${CX},${tabBot}`,
    ].join(" "),
    color: LANE_COLORS[i],
    centerY,
    centerPct: (centerY / VB.h) * 100,
  };
});

const ICON_LEFT_PCT = (475 / VB.w) * 100; // icon column
const LABEL_X = 545; // label baseline x (viewBox)
const NUMBER_X = 940; // ghost number x (viewBox)
const LABEL_FONT_SIZE = 27;
const NUMBER_FONT_SIZE = 50;
// Longer titles must stop short of the ghost number so it never renders
// under the label text — compress via textLength once the estimated
// natural width would cross into the number's space.
const MAX_LABEL_WIDTH = NUMBER_X - 50 - LABEL_X;

/* ------------------------------------------------------------------ */
/*  Left — animated QR identity emblem                                  */
/* ------------------------------------------------------------------ */

function QrEmblem({
  qrSrc,
  qrLabel,
  onPlay,
  reduce,
}: {
  qrSrc: string;
  qrLabel: ReactNode;
  onPlay: () => void;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      className="relative aspect-square w-full rounded-full border-[10px] border-white"
      style={{
        boxShadow: [
          "0 26px 64px -18px rgba(214,105,40,0.45)",
          "0 10px 24px -10px rgba(0,0,0,0.18)",
          "inset 0 3px 6px rgba(255,255,255,0.7)",
          "inset 0 -10px 24px rgba(180,90,40,0.12)",
        ].join(", "),
      }}
      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
      whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {/* animated background, clipped to the circle */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {/* warm base fill */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(80% 80% at 50% 42%, #FFF3E6 0%, #FFE3CB 48%, #FBD3B4 100%)",
          }}
        />
        {/* slow rotating sunburst rays */}
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            className="h-full w-full rounded-full"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,150,80,0.16) 3deg, rgba(255,255,255,0) 7deg, rgba(255,255,255,0) 18deg)",
              WebkitMaskImage:
                "radial-gradient(circle, #000 0%, #000 34%, transparent 70%)",
              maskImage:
                "radial-gradient(circle, #000 0%, #000 34%, transparent 70%)",
            }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={
              reduce
                ? undefined
                : { duration: 60, ease: "linear", repeat: Infinity }
            }
          />
        </div>
        {/* breathing core glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 44%, rgba(255,255,255,0.7) 0%, rgba(255,210,160,0.25) 45%, transparent 72%)",
          }}
          animate={reduce ? undefined : { scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
          transition={
            reduce
              ? undefined
              : { duration: 6, ease: "easeInOut", repeat: Infinity }
          }
        />
      </div>

      {/* slow-spinning dashed accent ring near the border */}
      <motion.div
        aria-hidden
        className="absolute inset-[6px] rounded-full border-2 border-dashed border-orange/25"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={
          reduce ? undefined : { duration: 40, ease: "linear", repeat: Infinity }
        }
      />

      {/* content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center sm:gap-4">
        <div className="relative">
          {/* QR plate */}
          <div className="flex h-[92px] w-[92px] items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)] sm:h-[118px] sm:w-[118px]">
            <Image
              src={qrSrc}
              alt="Your GrowQR identity code"
              width={140}
              height={140}
              className="h-[86%] w-[86%] select-none object-contain"
              priority={false}
            />
          </div>

          {/* play control overlaid in the middle. Centering lives on the
              static wrapper so the hover scale can't drop the translate and
              shift the button off-center. */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.span
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-full bg-orange/20 blur-[8px]"
              animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [0.94, 1.15, 0.94] }}
              transition={reduce ? undefined : { duration: 2.6, ease: "easeInOut", repeat: Infinity }}
            />

            <motion.svg
              aria-hidden
              viewBox="0 0 100 100"
              className="pointer-events-none absolute -inset-4 h-[calc(100%+32px)] w-[calc(100%+32px)] overflow-visible"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={reduce ? undefined : { duration: 5.8, ease: "linear", repeat: Infinity }}
            >
              <circle
                cx="50"
                cy="50"
                r="43"
                fill="none"
                stroke="#FF7026"
                strokeOpacity="0.72"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="54 28 12 40"
              />
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="#FF9A66"
                strokeOpacity="0.38"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeDasharray="9 46"
              />
            </motion.svg>

            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full border border-orange/45"
              animate={reduce ? undefined : { opacity: [0.5, 0], scale: [1, 1.48] }}
              transition={reduce ? undefined : { duration: 2.4, ease: "easeOut", repeat: Infinity, repeatDelay: 0.25 }}
            />

            <motion.button
              type="button"
              onClick={onPlay}
              aria-label="Play the GrowQR explainer video"
              className="relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-orange shadow-[0_8px_22px_-6px_rgba(255,106,47,0.75)] ring-[5px] ring-white sm:h-14 sm:w-14"
              animate={reduce ? undefined : { scale: [1, 1.045, 1] }}
              transition={reduce ? undefined : { duration: 2.5, ease: "easeInOut", repeat: Infinity }}
              whileHover={reduce ? undefined : { scale: 1.12, transition: { duration: 0.2 } }}
              whileTap={reduce ? undefined : { scale: 0.95, transition: { duration: 0.1 } }}
            >
              {reduce ? null : (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-[-20%] left-[-55%] w-4 -skew-x-12 bg-white/35 blur-[1px]"
                  animate={{ x: [0, 82] }}
                  transition={{ duration: 0.75, ease: EASE, repeat: Infinity, repeatDelay: 2.1 }}
                />
              )}
              <motion.span
                animate={reduce ? undefined : { x: [0, 1.5, 0], scale: [1, 1.06, 1] }}
                transition={reduce ? undefined : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                className="relative z-10"
              >
                <Play
                  className="ml-0.5 h-5 w-5 text-white sm:h-6 sm:w-6"
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
              </motion.span>
            </motion.button>
          </div>
        </div>

        <span className="text-[13px] font-bold leading-none tracking-[-0.01em] text-ink-2 sm:text-[15px]">
          {qrLabel}
        </span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  The funnel graphic (lg+)                                            */
/* ------------------------------------------------------------------ */

function Funnel({
  steps,
  qrSrc,
  qrLabel,
  onPlay,
  reduce,
}: {
  steps: JourneyStep[];
  qrSrc: string;
  qrLabel: ReactNode;
  onPlay: () => void;
  reduce: boolean | null;
}) {
  // One observer on the HTML wrapper drives every lane and icon. Observing the
  // <g> elements directly (via whileInView) leaves them at opacity 0 in Safari.
  const [rootRef, inView] = useSvgInView<HTMLDivElement>({ margin: "-80px" });
  const initialState = reduce ? false : "hidden";
  const animateState = reduce ? undefined : inView ? "show" : "hidden";

  return (
    <div
      ref={rootRef}
      className="relative w-full"
      style={{ aspectRatio: `${VB.w} / ${VB.h}` }}
    >
      {/* Lanes + type live in one SVG so they scale together crisply. */}
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="absolute inset-0 h-full w-full font-sans"
        fill="none"
      >
        <defs>
          <filter id="laneShadow" x="-10%" y="-30%" width="120%" height="160%">
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="9"
              floodColor="#2A2E2C"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        {LANES.map((lane) => {
          const step = steps[lane.i];
          return (
            <motion.g
              key={lane.i}
              variants={laneVariants}
              initial={initialState}
              animate={animateState}
              transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : lane.i * 0.08 }}
              className="[transition:filter_.3s_ease] hover:[filter:brightness(1.05)]"
            >
              <polygon points={lane.points} fill={lane.color} filter="url(#laneShadow)" />
              {/* subtle lit top edge for a premium sheen */}
              <polyline
                points={`${XMID},${lane.centerY - BAND_H / 2} ${XR},${lane.centerY - BAND_H / 2}`}
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="1.5"
              />
              {/* label — drawn first so the ghost number always sits in front of it */}
              <text
                x={LABEL_X}
                y={lane.centerY}
                dominantBaseline="central"
                fontSize={LABEL_FONT_SIZE}
                fontWeight={700}
                fill="#ffffff"
                letterSpacing="-0.3"
                textLength={
                  (step?.title.length ?? 0) * LABEL_FONT_SIZE * 0.55 > MAX_LABEL_WIDTH
                    ? MAX_LABEL_WIDTH
                    : undefined
                }
                lengthAdjust="spacingAndGlyphs"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.18)" }}
              >
                {step?.title}
              </text>
              {/* big ghost number */}
              <text
                x={NUMBER_X}
                y={lane.centerY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={NUMBER_FONT_SIZE}
                fontWeight={800}
                fill="#ffffff"
                fillOpacity={0.22}
              >
                {lane.i + 1}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Lucide icons — HTML overlay positioned by %, exact because the wrapper
          keeps the SVG's aspect ratio. */}
      {LANES.map((lane) => {
        const step = steps[lane.i];
        if (!step) return null;
        const { Icon } = step;
        return (
          <motion.div
            key={lane.i}
            className="absolute flex aspect-square w-[3.4%] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white"
            style={{ left: `${ICON_LEFT_PCT}%`, top: `${lane.centerPct}%` }}
            variants={laneIconVariants}
            initial={initialState}
            animate={animateState}
            transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : 0.15 + lane.i * 0.08 }}
          >
            <Icon className="h-full w-full" strokeWidth={1.9} aria-hidden />
          </motion.div>
        );
      })}

      {/* Circle emblem — sits on top of the lane convergence (left). */}
      <div className="absolute left-0 top-1/2 z-10 w-[30%] -translate-y-1/2">
        <QrEmblem qrSrc={qrSrc} qrLabel={qrLabel} onPlay={onPlay} reduce={reduce} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stacked fallback (below lg)                                        */
/* ------------------------------------------------------------------ */

function StackedJourney({
  steps,
  qrSrc,
  qrLabel,
  onPlay,
  reduce,
}: {
  steps: JourneyStep[];
  qrSrc: string;
  qrLabel: ReactNode;
  onPlay: () => void;
  reduce: boolean | null;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="w-[240px]">
        <QrEmblem qrSrc={qrSrc} qrLabel={qrLabel} onPlay={onPlay} reduce={reduce} />
      </div>

      <div className="flex w-full max-w-[460px] flex-col gap-3">
        {steps.map((step, i) => {
          const { Icon } = step;
          return (
            <motion.div
              key={step.id}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, ease: EASE, delay: reduce ? 0 : i * 0.06 }}
              className="relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-white shadow-card"
              style={{ backgroundColor: LANE_COLORS[i] }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 text-[68px] font-extrabold leading-none text-white/20"
              >
                {i + 1}
              </span>
              <Icon className="h-6 w-6 shrink-0" strokeWidth={1.9} aria-hidden />
              <span className="relative text-[17px] font-semibold tracking-[-0.01em]">
                {step.title}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Explainer-video lightbox                                           */
/* ------------------------------------------------------------------ */

function VideoLightbox({
  open,
  onClose,
  src,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="GrowQR explainer video"
        >
          <div
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            style={{ WebkitBackdropFilter: "blur(4px)" }}
          />
          <motion.div
            className="relative w-full max-w-[960px] overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
            style={{ aspectRatio: "16 / 9" }}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.3, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              key={open ? "on" : "off"}
              src={src}
              className="h-full w-full"
              controls
              autoPlay
              playsInline
              controlsList="nodownload"
            />
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/*  Growth Journey                                                     */
/* ------------------------------------------------------------------ */

export default function GrowthJourney({
  qrSrc = DEFAULT_QR,
  videoSrc = DEFAULT_VIDEO,
  steps = DEFAULT_STEPS,
  qrLabel = DEFAULT_QR_LABEL,
}: GrowthJourneyProps) {
  const reduce = useReducedMotion();
  const belowLg = useIsMobile(1024);
  const [videoOpen, setVideoOpen] = useState(false);
  const onPlay = () => setVideoOpen(true);

  return (
    <div className="mx-auto w-full max-w-[782px]">
      {belowLg ? (
        <StackedJourney steps={steps} qrSrc={qrSrc} qrLabel={qrLabel} onPlay={onPlay} reduce={reduce} />
      ) : (
        <Funnel steps={steps} qrSrc={qrSrc} qrLabel={qrLabel} onPlay={onPlay} reduce={reduce} />
      )}

      <VideoLightbox open={videoOpen} onClose={() => setVideoOpen(false)} src={videoSrc} />
    </div>
  );
}
