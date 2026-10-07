"use client";

import { motion } from "framer-motion";
import {
  Check,
  Handshake,
  Drama,
  Sparkles,
  Gauge,
  Mic,
  Lightbulb,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentShowcase, Ring, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Kai — the Roleplay Coach. Visual showcase config + its UI mockups.
   Marketing mockups: one example, one large focal element per card. */

const KAI = "#378ADD";

function ChooseScenarioMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <span className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: `${KAI}1A` }}>
        <Handshake className="h-8 w-8" style={{ color: KAI }} />
      </span>
      <div className="leading-tight">
        <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">Salary Negotiation</div>
        <div className="text-[12px] text-ink-4">Push for the offer you deserve</div>
      </div>
      <span className="rounded-full bg-cream-2/70 px-3 py-1 text-[11px] font-semibold text-ink-4 ring-1 ring-black/[0.05]">
        1 of 6 scenarios
      </span>
    </div>
  );
}

function SetStakesMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="text-[12px] font-medium text-ink-4">You&apos;re facing</div>
      <span className="grid h-16 w-16 place-items-center rounded-full text-[18px] font-bold text-white" style={{ background: KAI }}>
        HM
      </span>
      <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">Hiring Manager</div>
      <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold text-white" style={{ background: KAI }}>
        Hard mode
      </span>
    </div>
  );
}

function RoleplayLiveMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: KAI }}>K</span>
        <div className="rounded-2xl rounded-bl-sm bg-cream-2/80 px-3 py-1.5 text-[12.5px] font-medium text-ink-2 ring-1 ring-black/[0.04]">
          So, why should we pay more?
        </div>
      </div>
      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-cream-2/50 px-4 py-3 ring-1 ring-black/[0.05]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{ background: KAI }}>
          <Mic className="h-5 w-5" />
        </span>
        <div className="flex flex-1 items-center gap-[3px]">
          {[14, 22, 11, 26, 16, 24, 12, 20, 10, 18, 13].map((h, i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full"
              style={{ background: KAI, opacity: 0.55 }}
              animate={{ height: [h * 0.5, h, h * 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold text-ink-4">Listening…</span>
      </div>
    </div>
  );
}

function CoachFeedbackMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="relative">
        <Ring value={86} size={68} stroke={7} color={KAI} />
        <span className="absolute inset-0 grid place-items-center text-[18px] font-bold text-ink">86</span>
      </div>
      <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">Strong delivery</div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-3 py-1.5 text-[11.5px] font-semibold text-orange-deep">
        <Lightbulb className="h-3.5 w-3.5 shrink-0" /> Lead with impact, then ask.
      </div>
    </div>
  );
}

export function KaiSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Kai",
    valueProp:
      "RQ-Kai plays the other side of your toughest conversations, pushes back like the real thing, and coaches you after every line.",
    chips: [
      { icon: Drama, label: "Real Scenarios" },
      { icon: Sparkles, label: "Live Coaching" },
      { icon: Gauge, label: "Confidence Score" },
    ],
    steps: [
      { n: 1, title: "Choose Scenario", caption: "Negotiation, feedback, a big pitch.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <ChooseScenarioMockup /> },
      { n: 2, title: "Set the Stakes", caption: "Pick who you face & how hard.", bg: "from-[#CFE0F7] to-[#A7C4ED]", mockup: <SetStakesMockup /> },
      { n: 3, title: "Roleplay Live", caption: "Practise it out loud, in the moment.", bg: "from-[#D9D6F5] to-[#B3ADE6]", mockup: <RoleplayLiveMockup /> },
      { n: 4, title: "Get Coached", caption: "A score plus the one fix to make.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <CoachFeedbackMockup /> },
    ],
  };

  return <AgentShowcase config={config} />;
}
