"use client";

import { motion } from "framer-motion";
import {
  Star,
  Clock,
  Compass,
  PlayCircle,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentShowcase, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Lyra — the Learning Curator. Visual showcase config + its UI mockups.
   Marketing mockups: one example, one large focal element per card. */

const LYRA = "#D85A30";
const eio = [0.22, 1, 0.36, 1] as const;

function SetGoalMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="text-[12px] font-medium text-ink-4">I want to…</div>
      <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-black/10 px-4 py-3.5">
        <Compass className="h-5 w-5" style={{ color: LYRA }} />
        <span className="text-[16px] font-semibold text-ink">Become a Data Analyst</span>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-full bg-cream-2/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 ring-1 ring-black/[0.05]">Beginner</span>
        <span className="rounded-full bg-cream-2/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 ring-1 ring-black/[0.05]">5 hrs / week</span>
      </div>
    </div>
  );
}

function CuratedPathMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5" style={{ borderColor: `${LYRA}55`, background: `${LYRA}0D` }}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[16px] font-bold text-white" style={{ background: LYRA }}>
          1
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[14.5px] font-bold text-ink">SQL Basics</div>
          <div className="text-[11.5px] font-medium" style={{ color: LYRA }}>5h · start here</div>
        </div>
        <PlayCircle className="h-6 w-6 shrink-0" style={{ color: LYRA }} />
      </div>
      <span className="rounded-full bg-cream-2/70 px-3 py-1 text-[11px] font-semibold text-ink-4 ring-1 ring-black/[0.05]">
        +7 more in your path
      </span>
    </div>
  );
}

function ResourcesMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <span className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${LYRA}1A` }}>
        <GraduationCap className="h-7 w-7" style={{ color: LYRA }} />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">Google Data Analytics</div>
        <div className="mt-1 flex items-center justify-center gap-2 text-[12px] text-ink-4">
          <span>Coursera</span>
          <span className="inline-flex items-center gap-0.5 font-bold text-ink-2">
            <Star className="h-3.5 w-3.5 text-amber-400" fill="#FBBF24" /> 4.8
          </span>
        </div>
      </div>
      <span className="rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white" style={{ background: LYRA }}>
        Best fit for your goal
      </span>
    </div>
  );
}

function FocusedProgressMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center gap-3 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink">Your progress</span>
        <span className="text-[13px] font-bold text-ink">3 <span className="font-medium text-ink-4">/ 8 done</span></span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: LYRA }}
          initial={{ width: 0 }}
          whileInView={{ width: "37%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: eio }}
        />
      </div>
      <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: `${LYRA}0F` }}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: LYRA }}>
          <PlayCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-4">Next up</div>
          <div className="truncate text-[13.5px] font-semibold text-ink">Data Visualization</div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={2.5} />
      </div>
    </div>
  );
}

export function LyraSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Lyra",
    valueProp:
      "RQ-Lyra cuts thousands of courses down to the handful that move you forward, sequenced into one focused path with zero busywork.",
    chips: [
      { icon: Compass, label: "Curated Path" },
      { icon: Star, label: "Hand-picked" },
      { icon: Clock, label: "No Wasted Time" },
    ],
    steps: [
      { n: 1, title: "Set Your Goal", caption: "Tell RQ-Lyra the outcome you're after.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <SetGoalMockup /> },
      { n: 2, title: "Curated Path", caption: "Only what's worth your time, in order.", bg: "from-[#CFE0F7] to-[#A7C4ED]", mockup: <CuratedPathMockup /> },
      { n: 3, title: "Hand-picked Resources", caption: "The best course for each step.", bg: "from-[#D9D6F5] to-[#B3ADE6]", mockup: <ResourcesMockup /> },
      { n: 4, title: "Focused Progress", caption: "Move forward faster, without the noise.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <FocusedProgressMockup /> },
    ],
  };

  return <AgentShowcase config={config} />;
}
