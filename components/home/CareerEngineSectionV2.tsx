"use client";

/* ════════════════════════════════════════════════════════════════════════
   "Check Your Career Readiness, Live" — AI Career Report lead-in.

   MARKETING-ONLY. The real analysis engine now lives inside the app's
   onboarding flow, not here. This section exists purely to hook visitors:
   they add a CV + LinkedIn URL (for engagement / intent — nothing is
   uploaded or analyzed on the marketing site) and, on submit, we redirect
   them into the app at `/home`. The app's auth guard takes over from there —
   signed-in visitors land on their home; everyone else is routed to login
   so they can sign up and run the report for real.

   The right column self-plays a looping demo of the analysis pipeline
   (upload CV → skills → LinkedIn → readiness score → AI report) so the
   panel feels alive while the visitor reads the pitch. Every value shown
   there is placeholder demo data.
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { FileUp, Loader2, Building2, Send } from "lucide-react";
import { FaLinkedinIn } from "react-icons/fa";
import { Eyebrow } from "./SectionHeader";
import { useHomeMode } from "@/components/layout/HomeMode";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";
import BrandInputBody from "./CareerEngineBrandInput";
import { trackAppCtaAndNavigate, trackSectionView } from "@/lib/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

// Individual report CTAs hand visitors to the app. The enterprise brand CTA
// uses the shared contact modal until the live brand-analysis flow ships.
const APP_HOME_URL = "https://app.growqr.ai/home";

// Where every individual Career Engine entry point (CV, LinkedIn, Generate)
// sends visitors — nothing is collected on the marketing site, so all three
// are always clickable and hand off straight into the app's real report flow.
// The app doesn't have a dedicated /report route yet, so this points at
// /home for now — swap back to a /report path once that route ships.
const APP_REPORT_URL = APP_HOME_URL;

/* The AI pipeline — drives BOTH the checkpoints and the stage-aware
   visualization for the self-playing demo. */
const PIPELINE = [
  { label: "Upload CV", icon: "solar:document-text-bold-duotone", kind: "resume" },
  { label: "Extracting Skills", icon: "solar:star-bold-duotone", kind: "skills" },
  { label: "Connect LinkedIn", icon: "linkedin", kind: "linkedin" },
  { label: "Career Readiness Score", icon: "solar:chart-2-bold-duotone", kind: "score" },
  { label: "AI Career Report", icon: "solar:document-bold-duotone", kind: "report" },
] as const;

/* Enterprise ("Brand Report") variant of the pipeline — 5 stages, reusing the
   same StageVisual kinds (minus "linkedin", which has no brand analog). */
const PIPELINE_BRAND = [
  { label: "Scanning brand visibility", icon: "solar:document-text-bold-duotone", kind: "resume" },
  { label: "Analyzing positioning", icon: "solar:star-bold-duotone", kind: "skills" },
  { label: "Checking trust signals", icon: "solar:case-minimalistic-bold-duotone", kind: "experience" },
  { label: "Finding brand opportunities", icon: "solar:scale-bold-duotone", kind: "insights" },
  { label: "Calculating brand score", icon: "solar:chart-2-bold-duotone", kind: "score" },
] as const;

const AMBIENT_STEP_MS = 1650; // slow idle auto-loop on the demo panel
const HOLD_MS = 2000;
const SCORE = 82; // demo readiness score shown in the visualization
const BRAND_SCORE = 78; // demo brand score shown in the brand visualization

/* Count-up number (restarts whenever it mounts). */
function Counter({ to, duration = 1.1 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) { setN(to); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, reduce]);
  return <>{n}</>;
}

/* ════════════════════════════════════════════════════════════════════════
   RIGHT — stage-aware visualizations. Each `kind` renders a distinct, lively
   mini-animation so the panel transforms as the demo engine works.
   ════════════════════════════════════════════════════════════════════════ */

const SKILLS = ["UX Research", "Figma", "Prototyping", "Design Systems", "User Testing"];
const EXPERIENCE = [
  { title: "Senior Designer", subtitle: "Acme Corp", meta: "22–Now" },
  { title: "Product Designer", subtitle: "Globex", meta: "19–22" },
  { title: "Junior Designer", subtitle: "Initech", meta: "17–19" },
];
const STRENGTHS = ["Strong UX research depth", "Design systems leadership", "Cross-team collaboration"];
const GAPS = ["Limited data fluency", "Few leadership roles"];

// Brand-flavored content for the enterprise pipeline's reused visuals.
const BRAND_POSITIONING = ["Market Positioning", "Visual Identity", "Messaging Clarity", "Differentiation"];
const BRAND_TRUST_SIGNALS = [
  { title: "Website Security", subtitle: "SSL verified", meta: "✓" },
  { title: "Customer Reviews", subtitle: "4.6 average", meta: "✓" },
  { title: "Case Studies", subtitle: "Published", meta: "✓" },
];
const BRAND_STRENGTHS = ["Strong visual identity", "Clear website messaging", "Active social presence"];
const BRAND_GAPS = ["Inconsistent brand voice", "Low content cadence"];

function ResumeVisual({ brand = false }: { brand?: boolean }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative w-[128px] rounded-xl border border-black/[0.08] bg-white p-3.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.25)]">
        <div className="mb-2.5 flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded bg-orange-lighter">
            <Icon icon="solar:document-text-bold" className="text-orange" width={12} height={12} aria-hidden />
          </span>
          <div className="h-1.5 w-12 rounded bg-black/15" />
        </div>
        {[100, 82, 92, 68, 88, 74].map((w, i) => (
          <motion.div
            key={i}
            className="mb-1.5 h-1.5 origin-left rounded bg-black/[0.08]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease }}
            style={{ width: `${w}%` }}
          />
        ))}
        {!brand && (
          <motion.div
            className="pointer-events-none absolute inset-x-2.5 top-2 h-6 rounded bg-gradient-to-b from-transparent via-orange/35 to-transparent"
            animate={{ y: [0, 88] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

/* Step 1 — both inputs coming in. The résumé confirms uploaded, then the
   LinkedIn profile confirms connected: two clean source cards that settle
   in sequence with a soft check pop. Premium and unhurried. */
function SourceCard({
  delay,
  tile,
  icon,
  title,
  status,
}: {
  delay: number;
  tile: string;
  icon: ReactNode;
  title: string;
  status: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.55, ease }}
      className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-white px-3.5 py-3 shadow-[0_12px_26px_-16px_rgba(0,0,0,0.25)]"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tile}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-semibold text-ink">{title}</p>
        <p className="text-[10.5px] text-ink-4">{status}</p>
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.55, type: "spring", stiffness: 380, damping: 17 }}
      >
        <Icon icon="solar:check-circle-bold" className="text-emerald-500" width={20} height={20} aria-hidden />
      </motion.span>
    </motion.div>
  );
}

function UploadCVVisual() {
  return (
    <div className="flex h-full items-center justify-center px-3">
      <div className="flex w-[252px] flex-col items-center gap-2">
        <SourceCard
          delay={0.1}
          tile="bg-orange-lighter"
          icon={<Icon icon="solar:file-text-bold-duotone" className="text-orange" width={22} height={22} aria-hidden />}
          title="James_CV.pdf"
          status="Resume uploaded"
        />
        <motion.span
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3, ease }}
          className="h-3.5 w-px origin-top bg-gradient-to-b from-black/20 to-transparent"
          aria-hidden
        />
        <SourceCard
          delay={0.85}
          tile="bg-[#EBF4FF]"
          icon={<FaLinkedinIn className="h-[18px] w-[18px] text-[#0A66C2]" />}
          title="in/james-carter"
          status="LinkedIn connected"
        />
      </div>
    </div>
  );
}

/* Source document on one side, skills landing as they're found on the
   other — shows the extraction happening rather than just the result. */
function SkillsVisual({ chips = SKILLS }: { chips?: string[] }) {
  const lineWidths = [100, 78, 92, 64, 88, 70, 82, 60];
  return (
    <div className="flex h-full items-center justify-center gap-5 px-2">
      <div className="relative h-[204px] w-[132px] shrink-0 overflow-hidden rounded-lg border border-black/[0.08] bg-white p-3.5 shadow-[0_14px_28px_-16px_rgba(0,0,0,0.28)]">
        <div className="mb-2.5 flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded bg-orange-lighter">
            <Icon icon="solar:document-text-bold" className="text-orange" width={12} height={12} aria-hidden />
          </span>
          <div className="h-1.5 w-12 rounded bg-black/15" />
        </div>
        {lineWidths.map((w, i) => (
          <motion.div
            key={i}
            className={`mb-1.5 h-1.5 origin-left rounded ${i % 3 === 1 ? "bg-orange/45" : "bg-black/[0.08]"}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.09, duration: 0.35, ease }}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {chips.slice(0, 5).map((s, i) => (
          <motion.span
            key={s}
            initial={{ opacity: 0, x: -16, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.14, type: "spring", stiffness: 320, damping: 20 }}
            className="whitespace-nowrap rounded-full border border-orange/20 bg-orange-lighter px-3 py-1.5 text-[12px] font-semibold text-orange-deep"
          >
            {s}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function ExperienceVisual({
  rows = EXPERIENCE,
}: {
  rows?: { title: string; subtitle: string; meta: string }[];
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-1">
      {rows.map((e, i) => (
        <motion.div
          key={e.title}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.16, ease }}
          className="flex items-center gap-2.5"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-orange" />
          <div className="flex-1 rounded-lg border border-black/[0.07] bg-white px-3 py-2 shadow-[0_4px_10px_-8px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold text-ink">{e.title}</span>
              <span className="text-[10.5px] text-ink-4">{e.meta}</span>
            </div>
            <span className="text-[11px] text-ink-4">{e.subtitle}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* Step 3 — the LinkedIn profile being pulled in. A proper profile card
   (banner, avatar, identity, sections streaming in, connected) rather than
   three bare bars. */
const LINKEDIN_ROWS = [
  { icon: "solar:case-minimalistic-bold", w: 92 },
  { icon: "solar:medal-ribbon-star-bold", w: 74 },
  { icon: "solar:users-group-rounded-bold", w: 86 },
] as const;

function LinkedInVisual() {
  return (
    <div className="flex h-full items-center justify-center px-2">
      <div className="w-[242px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_16px_34px_-18px_rgba(0,0,0,0.3)]">
        <div className="relative h-10 bg-gradient-to-r from-[#0A66C2] to-[#4593E0]">
          <span className="absolute right-3 top-2.5 grid h-5 w-5 place-items-center rounded bg-white/95">
            <FaLinkedinIn className="h-3 w-3 text-[#0A66C2]" />
          </span>
        </div>
        <div className="px-4 pb-4">
          <div className="-mt-5 flex items-center gap-2.5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-cream-2">
              <Image src="/report-sample/james.png" alt="" fill sizes="48px" className="object-cover" />
            </div>
            <div className="mt-4 min-w-0">
              <p className="truncate text-[13px] font-bold text-ink">James Carter</p>
              <p className="truncate text-[10.5px] text-ink-4">Product Designer</p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-col gap-2">
            {LINKEDIN_ROWS.map((row, i) => (
              <motion.div
                key={row.icon}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.18, ease }}
                className="flex items-center gap-2"
              >
                <Icon icon={row.icon} className="shrink-0 text-[#0A66C2]" width={13} height={13} aria-hidden />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#0A66C2]/10">
                  <motion.div
                    className="h-full rounded-full bg-[#0A66C2]/50"
                    initial={{ width: 0 }}
                    animate={{ width: `${row.w}%` }}
                    transition={{ delay: 0.3 + i * 0.18, duration: 0.6, ease }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, ease }}
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0A66C2]/[0.08] py-1.5 text-[11px] font-semibold text-[#0A66C2]"
          >
            <Icon icon="solar:check-circle-bold" width={13} height={13} aria-hidden /> Profile connected
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function InsightsVisual({
  strengths = STRENGTHS,
  gaps = GAPS,
}: {
  strengths?: string[];
  gaps?: string[];
}) {
  const groups = [
    {
      title: "Strengths",
      items: strengths,
      icon: "solar:check-circle-bold",
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      chip: "border-emerald-500/20 bg-emerald-50",
    },
    {
      title: "Gaps",
      items: gaps,
      icon: "solar:danger-triangle-bold",
      dot: "bg-orange",
      text: "text-orange-deep",
      chip: "border-orange/20 bg-orange-lighter",
    },
  ];
  let n = 0;
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-1.5">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${g.text}`}>
            <Icon icon={g.icon} width={12} height={12} aria-hidden />
            {g.title}
          </span>
          {g.items.map((item) => {
            const delay = 0.1 + n++ * 0.13;
            return (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay, ease }}
                className={`flex items-center gap-2 rounded-lg border ${g.chip} px-2.5 py-1.5`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${g.dot}`} />
                <span className="text-[11.5px] font-medium text-ink-2">{item}</span>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ScoreVisual({
  score = SCORE,
  label = "Career potential",
}: {
  score?: number;
  label?: string;
}) {
  const R = 44;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex h-full items-center justify-center gap-4">
      <div className="relative h-[112px] w-[112px]">
        <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" fill="none">
          <circle cx="56" cy="56" r={R} stroke="#F0EEEA" strokeWidth="9" />
          <motion.circle
            cx="56" cy="56" r={R} stroke="url(#scoreGrad)" strokeWidth="9" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - score / 100) }}
            transition={{ duration: 1.1, ease }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6A2F" />
              <stop offset="100%" stopColor="#FF9A6C" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-bold leading-none text-ink tabular-nums">
            <Counter to={score} />
          </span>
          <span className="text-[10px] text-ink-4">/ 100</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">{label}</span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
          <Icon icon="solar:arrow-up-bold" width={12} height={12} aria-hidden /> High
        </span>
      </div>
    </div>
  );
}

/* Step 4 — the generated Career Readiness Score. Real report page on one
   side, the animated readiness ring on the other — proof + payoff together,
   not another abstract loading card. */
function ScoreRevealVisual() {
  const R = 36;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex h-full items-center justify-center gap-5 px-2">
      <motion.div
        initial={{ opacity: 0, x: -14, rotate: -3 }}
        animate={{ opacity: 1, x: 0, rotate: -2 }}
        transition={{ duration: 0.4, ease }}
        className="relative h-[220px] w-[155px] shrink-0 overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_16px_32px_-16px_rgba(0,0,0,0.32)]"
      >
        <Image src="/report-sample/1.png" alt="" fill sizes="155px" className="object-cover object-top" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease }}
        className="flex flex-col items-center gap-2"
      >
        <div className="relative h-[92px] w-[92px]">
          <svg viewBox="0 0 92 92" className="h-full w-full -rotate-90" fill="none">
            <circle cx="46" cy="46" r={R} stroke="#F0EEEA" strokeWidth="7" />
            <motion.circle
              cx="46" cy="46" r={R} stroke="url(#readinessGrad)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - SCORE / 100) }}
              transition={{ duration: 1.1, ease }}
            />
            <defs>
              <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6A2F" />
                <stop offset="100%" stopColor="#FF9A6C" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold leading-none text-ink tabular-nums">
              <Counter to={SCORE} />
            </span>
            <span className="text-[9px] text-ink-4">/ 100</span>
          </div>
        </div>
        <span className="text-center text-[14px] font-bold leading-tight text-ink">Career Readiness</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
          <Icon icon="solar:arrow-up-bold" width={11} height={11} aria-hidden /> Excellent
        </span>
      </motion.div>
    </div>
  );
}

/* Step 5 — the generated AI Career Report. A second real report page paired
   with a bold, oversized line lifted straight from that page — the report
   speaking for itself. One statement only, no subheading underneath it. */
function ReportRevealVisual() {
  return (
    <div className="flex h-full items-center justify-center gap-5 px-2">
      <motion.div
        initial={{ opacity: 0, x: -14, y: 6 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className="flex max-w-[188px] flex-col gap-3 rounded-2xl border border-black/[0.07] bg-white px-4 py-4 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.2)]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-lighter">
          <Icon icon="solar:magnifer-bold-duotone" className="text-orange" width={16} height={16} aria-hidden />
        </span>
        <p className="text-balance text-[19px] font-bold leading-[1.2] tracking-[-0.015em] text-ink">
          Your foundation is strong.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 14, rotate: 3 }}
        animate={{ opacity: 1, x: 0, rotate: 2 }}
        transition={{ delay: 0.15, duration: 0.4, ease }}
        className="relative h-[220px] w-[155px] shrink-0 overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_16px_32px_-16px_rgba(0,0,0,0.32)]"
      >
        <Image src="/report-sample/2.jpg" alt="" fill sizes="155px" className="object-cover object-top" />
      </motion.div>
    </div>
  );
}

function StageVisual({ kind, brand = false }: { kind: string; brand?: boolean }) {
  switch (kind) {
    case "resume": return brand ? <ResumeVisual brand /> : <UploadCVVisual />;
    case "skills": return <SkillsVisual chips={brand ? BRAND_POSITIONING : SKILLS} />;
    case "experience": return <ExperienceVisual rows={brand ? BRAND_TRUST_SIGNALS : EXPERIENCE} />;
    case "linkedin": return <LinkedInVisual />;
    case "insights":
      return brand ? (
        <InsightsVisual strengths={BRAND_STRENGTHS} gaps={BRAND_GAPS} />
      ) : (
        <InsightsVisual />
      );
    case "score":
      return brand ? (
        <ScoreVisual score={BRAND_SCORE} label="Brand potential" />
      ) : (
        <ScoreRevealVisual />
      );
    case "report":
      return <ReportRevealVisual />;
    default: return <ResumeVisual />;
  }
}

/* The finale — both real report pages brought together as a small stacked
   pair, echoing steps 4–5's image + text pattern instead of breaking to a
   generic icon card. Brand keeps the simpler original "done" card since it
   has no report screenshots of its own. */
const READY_PAGES = [
  { src: "/report-sample/2.jpg", rotate: -6, x: -16, y: 10, z: 10 },
  { src: "/report-sample/1.png", rotate: 4, x: 16, y: -8, z: 20 },
] as const;

function ReadyMini({ brand = false }: { brand?: boolean }) {
  if (brand) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2.5">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-lighter">
          <Icon icon="solar:document-bold-duotone" className="text-orange" width={26} height={26} aria-hidden />
        </span>
        <p className="text-[13.5px] font-bold text-ink">Report ready</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-emerald-600">
          <Icon icon="solar:check-circle-bold" width={13} height={13} aria-hidden /> Generated
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center gap-5 px-2">
      <div className="relative h-[220px] w-[176px] shrink-0">
        {READY_PAGES.map((p, i) => (
          <motion.div
            key={p.src}
            className="absolute left-1/2 top-1/2 h-[196px] w-[138px] overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_16px_32px_-16px_rgba(0,0,0,0.3)]"
            style={{ zIndex: p.z }}
            initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 14px)", rotate: p.rotate * 0.4 }}
            animate={{
              opacity: 1,
              x: `calc(-50% + ${p.x}px)`,
              y: `calc(-50% + ${p.y}px)`,
              rotate: p.rotate,
            }}
            transition={{ delay: i * 0.12, duration: 0.4, ease }}
          >
            <Image src={p.src} alt="" fill sizes="138px" className="object-cover object-top" />
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50">
          <Icon icon="solar:check-circle-bold" className="text-emerald-600" width={26} height={26} aria-hidden />
        </span>
        <p className="text-[16px] font-bold leading-tight text-ink">Report Ready</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-semibold text-orange-deep">
          {SCORE}/100 · Excellent
        </span>
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, ease }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600"
        >
          <motion.span
            className="inline-flex"
            animate={{ x: [0, 3, 0], y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Send className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </motion.span>
          Sent to your inbox
        </motion.span>
      </motion.div>
    </div>
  );
}

type PipelineStage = { label: string; icon: string; kind: string };

/* ── The demo engine card ── */
function EngineCard({
  stage,
  pipeline,
  brand = false,
}: {
  stage: number;
  pipeline: readonly PipelineStage[];
  brand?: boolean;
}) {
  const reduce = useReducedMotion();
  const total = pipeline.length;
  const allDone = stage >= total;
  const idx = Math.min(stage, total - 1);
  const kind = pipeline[idx].kind;
  const label = allDone ? "Report ready" : pipeline[idx].label;
  const ringPct = Math.min(stage / total, 1);
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_2px_1px_rgba(255,255,255,0.9)_inset,0_36px_70px_-28px_rgba(18,18,18,0.22)]">
      {/* Header — focal profile + current stage */}
      <div className="flex items-center gap-3.5 px-6 pt-7">
        <div className="relative h-[80px] w-[80px] shrink-0">
          <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="40" cy="40" r={R} fill="none" stroke="#F0EEEA" strokeWidth="4" />
            <motion.circle
              cx="40" cy="40" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={C}
              initial={false}
              animate={{ strokeDashoffset: C * (1 - ringPct) }}
              transition={{ duration: 0.6, ease }}
            />
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6A2F" />
                <stop offset="100%" stopColor="#FF9A6C" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-[7px] overflow-hidden rounded-full bg-cream-2">
            {brand ? (
              <div className="flex h-full w-full items-center justify-center bg-orange-lighter">
                <Building2 className="h-8 w-8 text-orange" strokeWidth={1.75} aria-hidden />
              </div>
            ) : (
              <Image src="/report-sample/james.png" alt="" fill sizes="80px" className="object-cover" />
            )}
            {!allDone && !reduce && (
              <motion.span
                className="pointer-events-none absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-orange/45 to-transparent"
                animate={{ y: ["-24px", "66px"] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ink">
              {brand ? "Acme Corp" : "James Carter"}
            </h3>
            <Icon icon="solar:verified-check-bold" className="text-orange" width={16} height={16} aria-hidden />
          </div>
          <p className="mt-0.5 text-[13px] font-medium text-ink-3">
            {brand ? "yourcompany.com" : "Product Designer"}
          </p>
          <AnimatePresence mode="wait">
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease }}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-orange-deep"
            >
              {allDone ? (
                <Icon icon="solar:check-circle-bold" width={13} height={13} aria-hidden />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Work area — transforms per stage. No inner card here on purpose:
          content sits straight on the panel so it reads at full size. */}
      <div className="px-6 pt-6">
        <div className="relative h-[236px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={allDone ? "ready" : kind}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease }}
              className="h-full"
            >
              {allDone ? <ReadyMini brand={brand} /> : <StageVisual kind={kind} brand={brand} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pipeline progress dots */}
      <div className="flex items-center justify-center gap-1.5 px-6 py-6">
        {pipeline.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < stage ? "w-4 bg-orange" : i === stage && !allDone ? "w-4 bg-orange/55" : "w-1.5 bg-black/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* Right column — the self-playing demo engine. Loops the pipeline forever
   (or shows the finished state when reduced motion is preferred). */
function ProfileAnalysisStage({ brand = false }: { brand?: boolean }) {
  const reduce = useReducedMotion();
  const [ambient, setAmbient] = useState(0);
  const pipeline = brand ? PIPELINE_BRAND : PIPELINE;
  const total = pipeline.length;

  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    // Step 1 (upload CV + connect LinkedIn) and the score/report payoff steps
    // get more room than the fast middle checkpoints. Career flow only; brand
    // keeps a snappier intro since its step 1 is just a document scan.
    const firstStepMs = brand ? 900 : 2200;
    const stepDelay = (n: number) => {
      if (n === 0) return firstStepMs;
      if (!brand && n === total - 2) return 2200; // Career Readiness Score
      if (!brand && n === total - 1) return 2600; // AI Career Report
      return AMBIENT_STEP_MS;
    };
    const run = (n: number) => {
      if (cancelled) return;
      if (n > total) {
        t = setTimeout(() => run(0), HOLD_MS);
        return;
      }
      setAmbient(n);
      t = setTimeout(() => run(n + 1), stepDelay(n));
    };
    setAmbient(0);
    t = setTimeout(() => run(1), firstStepMs);
    return () => { cancelled = true; clearTimeout(t); };
  }, [reduce, total, brand]);

  const stage = reduce ? total : ambient;

  return (
    <div
      className="relative w-full max-w-[506px]"
      style={{ transform: "rotate(-1.25deg)", transformOrigin: "center top" }}
    >
      <div className="absolute inset-0 translate-y-6 scale-[0.94] rounded-[26px] bg-orange/[0.10] blur-3xl" aria-hidden />
      <div className="relative">
        <EngineCard stage={stage} pipeline={pipeline} brand={brand} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   LEFT — the input. Nothing is collected or stored on the marketing site;
   every entry point (CV row, LinkedIn row, Generate) sends the visitor
   straight into the app's real report flow at APP_REPORT_URL.
   ════════════════════════════════════════════════════════════════════════ */

function InputBody() {
  const goToReport = (ctaLabel: string, ctaLocation: string) => {
    trackAppCtaAndNavigate({
      ctaLabel,
      ctaLocation,
      destinationUrl: APP_REPORT_URL,
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        {/* CV upload — hands off to the app, where the real upload happens. */}
        <button
          type="button"
          onClick={() =>
            goToReport("Upload your CV", "career_readiness_live_cv")
          }
          className="group flex w-full items-center gap-4 rounded-xl border border-black/[0.08] bg-white px-5 py-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-orange/30 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-lighter">
            <FileUp className="h-5 w-5 text-orange" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">Upload your CV</p>
            <p className="mt-0.5 text-[13px] text-ink-4">PDF, DOC or DOCX</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-orange/25 bg-orange-lighter px-3 py-2 text-[13px] font-semibold text-orange transition-colors group-hover:border-orange/40">
            Continue
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </button>

        {/* LinkedIn — same hand-off, the app reads the public profile. */}
        <button
          type="button"
          onClick={() =>
            goToReport(
              "Connect your LinkedIn",
              "career_readiness_live_linkedin",
            )
          }
          className="group flex w-full items-center gap-4 rounded-xl border border-black/[0.08] bg-white px-5 py-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-orange/30 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FF]">
            <FaLinkedinIn className="h-5 w-5 text-[#0A66C2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">Connect your LinkedIn</p>
            <p className="mt-0.5 text-[13px] text-ink-4">We read your public profile</p>
          </div>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() =>
            goToReport(
              "Generate My Report",
              "career_readiness_live_generate_report",
            )
          }
          className="group flex w-full items-center justify-center gap-3 rounded-xl bg-orange px-6 py-[18px] text-[18px] font-semibold text-white shadow-none transition-all hover:bg-orange-dark hover:shadow-[0_14px_32px_-10px_rgba(255,106,47,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 md:text-[19px]"
        >
          Generate My Report
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-[15px] transition-transform group-hover:translate-x-0.5">→</span>
        </button>
        <p className="text-center text-[13px] font-medium text-ink-4">
          🔒 Your data is encrypted and processed securely.{" "}
          <Link
            href="/privacy-policy"
            className="font-semibold text-ink-3 underline underline-offset-2 transition-colors hover:text-orange"
          >
            Read our Privacy Policy.
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════════ */
export default function CareerEngineSectionV2() {
  const { mode } = useHomeMode();
  const { openContact } = useEnterpriseContact();
  const brand = mode === "enterprise";

  // Fire once when the section first scrolls into view — the top of the
  // hero-view → CTA-click → generate_lead funnel for this section.
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackSectionView("career_readiness_live");
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="career-engine"
      ref={sectionRef}
      className="relative overflow-hidden border-y border-black/5 bg-cream px-6 py-10 md:px-14 md:py-14 lg:py-16"
    >
      <div className="relative mx-auto max-w-[1440px]">
        {/* Header — centered above the two-column flow */}
        <div className="mx-auto mb-10 max-w-[1000px] text-center md:mb-14">
          <Eyebrow center>{brand ? "AI Brand Report" : "AI Career Report"}</Eyebrow>
          <h2 className="text-[clamp(40px,5vw,62px)] font-medium leading-[0.95] md:leading-[0.92] tracking-[-0.04em] md:tracking-[-0.05em] text-ink">
            {brand ? (
              <>Check Your Brand Standing, <span className="text-orange">Live</span></>
            ) : (
              <>Check Your Career Readiness, <span className="text-orange">Live</span></>
            )}
          </h2>
        </div>

        <div className="flex flex-col gap-6 md:gap-9 lg:min-h-[520px] lg:flex-row lg:items-center lg:gap-10">
          {/* ── Left ── */}
          <div className="flex w-full flex-col gap-10 lg:gap-12 lg:w-[45%] lg:pl-10">
            {brand ? (
              <BrandInputBody onContact={openContact} />
            ) : (
              <InputBody />
            )}
          </div>

          {/* Mobile-only flow connector — reads the two cards as one story:
              your input → the live analysis result. Hidden on lg where the
              columns sit side-by-side. */}
          <div
            aria-hidden
            className="flex flex-col items-center gap-1.5 lg:hidden"
          >
            <span className="h-6 w-px bg-gradient-to-b from-transparent to-orange/40" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-lighter text-orange ring-1 ring-orange/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">
              Live analysis
            </span>
          </div>

          {/* ── Right ── */}
          <div className="flex w-full items-center justify-center lg:w-[55%] lg:justify-end lg:pr-16">
            <ProfileAnalysisStage brand={brand} />
          </div>
        </div>
      </div>
    </section>
  );
}
