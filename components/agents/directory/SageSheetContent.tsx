"use client";

import { motion } from "framer-motion";
import {
  Check,
  Gauge,
  Target,
  TrendingUp,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentShowcase, Ring, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Sage — the Skill Trainer. Visual showcase config + its UI mockups.
   Marketing mockups: one example, one large focal element per card. */

const SAGE = "#BA7517";
const eio = [0.22, 1, 0.36, 1] as const;

function QuickAssessmentMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-ink-4">Question 4 of 10</span>
        <span style={{ color: SAGE }}>40%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
        <div className="h-full rounded-full" style={{ width: "40%", background: SAGE }} />
      </div>
      <div className="mt-3 text-[13.5px] font-semibold text-ink">
        Which metric best tracks retention?
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        {["Churn rate", "Daily active users"].map((o, i) => (
          <div
            key={o}
            className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5"
            style={i === 0 ? { borderColor: SAGE, boxShadow: `0 0 0 1px ${SAGE}` } : { borderColor: "#0000000F" }}
          >
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
              style={i === 0 ? { background: SAGE } : { boxShadow: "inset 0 0 0 1.5px #00000022" }}
            >
              {i === 0 && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
            </span>
            <span className="text-[13px] font-semibold text-ink">{o}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillGapMapMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center gap-3 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex items-end justify-between">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">SQL &amp; Analytics</span>
        <span className="text-[22px] font-bold leading-none tracking-[-0.02em]" style={{ color: SAGE }}>45%</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-black/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: SAGE }}
          initial={{ width: 0 }}
          whileInView={{ width: "45%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: eio }}
        />
        <span className="absolute top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-ink/40" style={{ left: "85%" }} />
      </div>
      <div className="flex items-center justify-between text-[11.5px] font-semibold">
        <span style={{ color: SAGE }}>Your level</span>
        <span className="text-ink-4">Target 85%</span>
      </div>
    </div>
  );
}

function TargetedPlanMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 ring-1" style={{ background: `${SAGE}0D`, borderColor: `${SAGE}55` }}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[16px] font-bold text-white" style={{ background: SAGE }}>
          1
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[14.5px] font-bold text-ink">SQL Fundamentals</div>
          <div className="text-[11.5px] font-medium" style={{ color: SAGE }}>2h · start here</div>
        </div>
      </div>
      <span className="rounded-full bg-cream-2/70 px-3 py-1 text-[11px] font-semibold text-ink-4 ring-1 ring-black/[0.05]">
        +5 more in your plan
      </span>
    </div>
  );
}

function TrackProgressMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="relative">
        <Ring value={38} size={74} stroke={7} color={SAGE} />
        <span className="absolute inset-0 grid place-items-center text-[18px] font-bold text-ink">38%</span>
      </div>
      <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">3 of 8 modules</div>
      <div className="text-[12.5px] font-medium text-ink-4">Next up: Metrics &amp; Analytics</div>
    </div>
  );
}

export function SageSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Sage",
    valueProp:
      "RQ-Sage pinpoints exactly which skills are holding you back, builds a focused training plan, and tracks every step until the gap closes.",
    chips: [
      { icon: Gauge, label: "Gap Analysis" },
      { icon: Target, label: "Targeted Plan" },
      { icon: TrendingUp, label: "Progress Tracking" },
    ],
    steps: [
      { n: 1, title: "Quick Assessment", caption: "A short check of where you stand.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <QuickAssessmentMockup /> },
      { n: 2, title: "Skill Gap Map", caption: "See the gaps holding you back.", bg: "from-[#FBE3B4] to-[#F5C887]", mockup: <SkillGapMapMockup /> },
      { n: 3, title: "Targeted Plan", caption: "Weakest skill first, in order.", bg: "from-[#CFE0F7] to-[#A7C4ED]", mockup: <TargetedPlanMockup /> },
      { n: 4, title: "Track Progress", caption: "Watch every gap close over time.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <TrackProgressMockup /> },
    ],
  };

  return <AgentShowcase config={config} />;
}
