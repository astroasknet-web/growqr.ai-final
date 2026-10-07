"use client";

import {
  Check,
  Search,
  MapPin,
  Briefcase,
  Building2,
  Send,
  Moon,
  Target,
  SlidersHorizontal,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentShowcase, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Scout — the Opportunity Finder. Visual showcase config + its UI mockups.
   Marketing mockups: one example, one large focal element per card. */

const SCOUT = "#16A34A";

function SetFiltersMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="text-[12px] font-medium text-ink-4">Target role</div>
      <div className="mt-1.5 flex items-center gap-2.5 rounded-xl border border-black/10 px-4 py-3.5">
        <Search className="h-5 w-5 text-ink-4" />
        <span className="text-[16px] font-semibold text-ink">Product Manager</span>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-2/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 ring-1 ring-black/[0.05]">
          <MapPin className="h-3.5 w-3.5" style={{ color: SCOUT }} /> Remote
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-2/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-2 ring-1 ring-black/[0.05]">
          <Briefcase className="h-3.5 w-3.5" style={{ color: SCOUT }} /> Senior
        </span>
      </div>
    </div>
  );
}

function MatchedRoleMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream-2 ring-1 ring-black/[0.05]">
        <Building2 className="h-7 w-7 text-ink-3" />
      </span>
      <div className="leading-tight">
        <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">Senior Product Manager</div>
        <div className="text-[12.5px] text-ink-4">Stripe</div>
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-bold text-white"
        style={{ background: SCOUT }}
      >
        <Target className="h-4 w-4" /> 94% match
      </span>
    </div>
  );
}

function AutoScreenMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <span className="grid h-16 w-16 place-items-center rounded-full text-white" style={{ background: SCOUT }}>
        <Check className="h-9 w-9" strokeWidth={3} />
      </span>
      <div className="text-[18px] font-bold tracking-[-0.01em] text-ink">Strong fit</div>
      <div className="text-[13px] font-medium text-ink-4">9 of 10 skills matched</div>
    </div>
  );
}

function AutoApplyMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-2 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <span className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: SCOUT }}>
        <Send className="h-6 w-6" />
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">12</span>
        <span className="text-[15px] font-semibold text-ink-2">applications</span>
      </div>
      <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-4">
        <Moon className="h-3.5 w-3.5" /> sent while you slept
      </div>
    </div>
  );
}

export function ScoutSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Scout",
    valueProp:
      "Tell RQ-Scout what you're after, then it hunts the market, screens every role for fit, and applies to the best matches while you sleep.",
    chips: [
      { icon: Target, label: "Smart Matching" },
      { icon: SlidersHorizontal, label: "Auto-Screen" },
      { icon: Send, label: "Auto-Apply" },
    ],
    steps: [
      { n: 1, title: "Set Your Filters", caption: "Role, location & the bar you want.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <SetFiltersMockup /> },
      { n: 2, title: "Matched Roles", caption: "Ranked by how well they fit you.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <MatchedRoleMockup /> },
      { n: 3, title: "Auto-Screen", caption: "Every role checked against your fit.", bg: "from-[#CFE0F7] to-[#A7C4ED]", mockup: <AutoScreenMockup /> },
      { n: 4, title: "Auto-Apply", caption: "RQ-Scout applies to the best matches.", bg: "from-[#FBE3B4] to-[#F5C887]", mockup: <AutoApplyMockup /> },
    ],
  };

  return <AgentShowcase config={config} />;
}
