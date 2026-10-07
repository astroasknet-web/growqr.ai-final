"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { agents } from "@/lib/data";
import { AgentName } from "@/components/ui/AgentName";
import { Eyebrow } from "@/components/home/SectionHeader";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";
import { trackAppCta } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

const textVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const byName = Object.fromEntries(agents.map((a) => [a.name, a]));
const roleLabel = (r: string) => r.replace(/^The\s+/, "");

/** hex -> rgba, so one brand color drives the soft panel tint + accents. */
const tint = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Shared visual shell — soft brand-tinted panel wrapping a clean white card,
   led by the agent's portrait (BFP) so every visual reads as "this agent, here".
   ═══════════════════════════════════════════════════════════════════════════ */
function Panel({ agent, children }: { agent: string; children: ReactNode }) {
  const a = byName[agent];
  const color = a?.color ?? "#FF6A2F";
  return (
    <div
      className="relative rounded-[28px] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] sm:p-6 md:p-7"
      style={{
        background: `linear-gradient(135deg, ${tint(color, 0.16)} 0%, #FBF7F1 58%, ${tint(color, 0.1)} 100%)`,
      }}
    >
      <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] sm:p-6">
        {/* Agent badge — large portrait + name + role */}
        <div className="flex items-center gap-4">
          <span
            className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/[0.06] md:h-[76px] md:w-[76px]"
            style={{ backgroundColor: tint(color, 0.12) }}
          >
            {a?.image && (
              <Image
                src={a.image}
                alt={a.name}
                fill
                sizes="76px"
                className="object-cover object-top"
              />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[16px] font-bold tracking-[-0.01em] text-ink">
              <AgentName name={agent} />
            </p>
            <p className="text-[12.5px] font-semibold text-ink-4">
              {a ? roleLabel(a.role) : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-black/[0.06] pt-5">{children}</div>
      </div>
    </div>
  );
}

/** Small status pill — green reserved for positive/relevant states. */
function Pill({ tone, children }: { tone: "green" | "amber" | "neutral"; children: ReactNode }) {
  const styles = {
    green: "bg-[#16A34A]/12 text-[#16A34A] ring-1 ring-[#16A34A]/25",
    amber: "bg-[#D97706]/12 text-[#D97706] ring-1 ring-[#D97706]/25",
    neutral: "bg-black/[0.04] text-ink-3 ring-1 ring-black/[0.06]",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${styles}`}>
      {children}
    </span>
  );
}

/* ── Nova — positioning, content themes, visibility ────────────────────────── */
function NovaVisual() {
  return (
    <Panel agent="RQ-Nova">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Positioning</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Pill tone="neutral">Bold</Pill>
            <Pill tone="neutral">Clear</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Content themes</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Pill tone="neutral">Product</Pill>
            <Pill tone="neutral">Culture</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Visibility</span>
          <Pill tone="green">Growing</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Scout — many signals filtered into a few relevant opportunities ──────── */
function ScoutVisual() {
  const opps = ["Partnership", "Accelerator program", "Warm prospect"];
  return (
    <Panel agent="RQ-Scout">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">120 signals scanned</span>
        <span className="text-orange">3 worth pursuing</span>
      </div>
      <div className="mt-3 space-y-2">
        {opps.map((o) => (
          <div
            key={o}
            className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5"
          >
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden />
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{o}</span>
            <Pill tone="green">Relevant</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Eva — onboarding journey progressing toward retention ────────────────── */
function EvaVisual() {
  const milestones = [
    { label: "Structured onboarding", state: "done" as const },
    { label: "Buddy & mentor assigned", state: "done" as const },
    { label: "30-day check-in", state: "active" as const },
    { label: "Attrition risk review", state: "upcoming" as const },
  ];
  return (
    <Panel agent="RQ-Eva">
      <span className="text-[12px] font-semibold text-ink-4">New hire journey</span>
      <div className="mt-3 flex flex-col">
        {milestones.map((m, i, arr) => (
          <div key={m.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`h-3 w-3 flex-shrink-0 rounded-full ${
                  m.state === "done"
                    ? "bg-[#16A34A]"
                    : m.state === "active"
                      ? "bg-orange ring-4 ring-orange/15"
                      : "bg-black/[0.12]"
                }`}
                aria-hidden
              />
              {i < arr.length - 1 && <span className="w-px flex-1 bg-black/[0.10]" />}
            </div>
            <span
              className={`pb-5 text-[13.5px] font-semibold ${
                m.state === "upcoming" ? "text-ink-4" : "text-ink"
              }`}
            >
              {m.label}
              {m.state === "active" && (
                <span className="ml-2 rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Now
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Rohan — team signals becoming a few clear next moves ──────────────────── */
function RohanVisual() {
  return (
    <Panel agent="RQ-Rohan">
      <span className="text-[12px] font-semibold text-ink-4">Team signals</span>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Hiring pace steady</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#D97706]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Engineering capability gap</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next move</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Prioritize a senior engineer</p>
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Journey step data + row
   ═══════════════════════════════════════════════════════════════════════════ */
type Step = {
  number: string;
  stage: string;
  agent: string;
  role: string;
  heading: string;
  copy: string;
  visual: ReactNode;
  /** true -> visual sits on the LEFT, content on the RIGHT. */
  reverse: boolean;
};

const STEPS: Step[] = [
  {
    number: "01",
    stage: "Brand",
    agent: "RQ-Nova",
    role: "Brand Builder",
    heading: "Be Remembered.",
    copy: "Launch with a brand people recognize before they become customers. Nova builds your market presence through branding, content, and founder thought leadership.",
    visual: <NovaVisual />,
    reverse: true,
  },
  {
    number: "02",
    stage: "Grow",
    agent: "RQ-Scout",
    role: "Opportunity Finder",
    heading: "Find What's Next.",
    copy: "Discover customers, investors, partners, grants, and opportunities that fuel growth. Scout connects your start-up to the people and opportunities that matter most.",
    visual: <ScoutVisual />,
    reverse: false,
  },
  {
    number: "03",
    stage: "Keep",
    agent: "RQ-Eva",
    role: "Capability Builder",
    heading: "Build a Team That Stays.",
    copy: "Great start-ups don't just hire well, they keep great people. Eva strengthens onboarding, develops talent, and helps reduce unwanted attrition.",
    visual: <EvaVisual />,
    reverse: true,
  },
  {
    number: "04",
    stage: "Decide",
    agent: "RQ-Rohan",
    role: "Workforce Analyst",
    heading: "Turn Data Into Direction.",
    copy: "Build on insight, not instinct. Rohan transforms business metrics into actionable insights that move your start-up forward.",
    visual: <RohanVisual />,
    reverse: false,
  },
];

function JourneyRow({ step }: { step: Step }) {
  const reduce = useReducedMotion();
  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-6 py-14 md:px-14 md:py-20 lg:grid-cols-2 lg:gap-16">
        {/* TEXT */}
        <motion.div
          variants={reduce ? undefined : textVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-100px" }}
          className={`lg:max-w-[540px] ${step.reverse ? "lg:order-2 lg:ml-auto" : "lg:order-1"}`}
        >
          {/* business stage */}
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-orange-deep">
              {step.stage}
            </span>
          </div>

          {/* agent name + role */}
          <div className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-ink-3">
            <AgentName name={step.agent} className="text-ink" />
            <span aria-hidden className="text-ink-5">
              ·
            </span>
            <span>{step.role}</span>
          </div>

          <h3 className="mt-3 text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-[32px] md:text-[40px]">
            {step.heading}
          </h3>
          <p className="mt-4 max-w-[460px] text-[16px] leading-[1.7] text-ink-2 md:text-[17px]">
            {step.copy}
          </p>
        </motion.div>

        {/* VISUAL */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className={`mx-auto w-full max-w-[440px] lg:max-w-none ${step.reverse ? "lg:order-1" : "lg:order-2"}`}
        >
          {step.visual}
        </motion.div>
      </div>
    </div>
  );
}

export default function StartupJourney() {
  const contact = useEnterpriseContact();
  return (
    <section aria-label="Build and grow with more focus">
      {/* Section header */}
      <div className="bg-white px-6 pb-4 pt-16 text-center md:px-14 md:pt-24">
        <Eyebrow center>The Startup Journey</Eyebrow>
        <h2 className="mt-3 text-[30px] font-medium leading-[1.05] tracking-[-0.03em] text-[#1a1a1a] md:text-[42px] md:tracking-[-0.04em]">
          Build and Grow with More <span className="text-orange">Focus</span>
        </h2>
      </div>

      {/* Alternating zigzag journey rows */}
      {STEPS.map((step) => (
        <JourneyRow key={step.number} step={step} />
      ))}

      {/* Closing CTA — opens the shared enquiry modal */}
      {contact.enabled && (
        <div className="bg-white px-6 pb-16 text-center md:px-14 md:pb-24">
          <button
            type="button"
            onClick={() => {
              trackAppCta({ ctaLabel: "Book a Call", ctaLocation: "startup-journey-cta", ctaAction: "modal" });
              contact.openContact();
            }}
            className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
          >
            Book a Call
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
