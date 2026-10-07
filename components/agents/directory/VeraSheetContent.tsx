"use client";

import Image from "next/image";
import {
  Check,
  ChevronDown,
  Mic,
  AudioLines,
  TrendingUp,
  Gauge,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentName } from "@/components/ui/AgentName";
import { AgentShowcase, Ring, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Vera — the Interviewer. Visual showcase config + its UI mockups.
   Marketing mockups: one example, one large focal element per card. */

const VERA = "#D4537E";

function ChooseRoleMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="text-[12px] font-medium text-ink-4">Job role</div>
      <div className="mt-1.5 rounded-xl border border-black/10 px-4 py-3.5 text-[16px] font-semibold text-ink">
        Senior Software Developer
      </div>
      <div className="mt-3">
        <div className="text-[12px] font-medium text-ink-4">Company</div>
        <div className="mt-1.5 flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 text-[13px] text-ink-4">
          Select company <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function InterviewSessionMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col gap-2.5 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      {/* Interviewer identity + live status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative inline-flex">
            <Image
              src="/agents/roadmaps/veera-interview.png"
              alt="RQ-Vera"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover ring-2 ring-white"
              style={{ boxShadow: `0 0 0 1.5px ${VERA}` }}
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div className="leading-tight">
            <div className="text-[13px] font-bold tracking-[-0.01em] text-ink"><AgentName name="RQ-Vera" /></div>
            <div className="text-[10px] font-medium text-ink-4">Interviewer</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${VERA}14`, color: VERA }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: VERA }} /> Live
        </span>
      </div>
      {/* Question — a speech bubble from RQ-Vera */}
      <div className="flex flex-1 items-center">
        <div className="relative rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13.5px] font-semibold leading-snug text-ink" style={{ background: `${VERA}12` }}>
          Tell me about a time you led under pressure.
        </div>
      </div>
      {/* Candidate recording with a live waveform */}
      <div className="flex items-center gap-3 rounded-2xl bg-cream-2/50 px-3.5 py-2.5 ring-1 ring-black/[0.05]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white" style={{ background: VERA }}>
          <Mic className="h-4 w-4" />
        </span>
        <div className="flex flex-1 items-center gap-[3px]">
          {[10, 16, 22, 14, 20, 11, 18, 24, 13, 19, 9, 15, 21, 12].map((h, i) => (
            <span key={i} className="w-[3px] rounded-full" style={{ height: h, background: VERA, opacity: 0.35 + (h / 24) * 0.55 }} />
          ))}
        </div>
        <span className="shrink-0 text-[11.5px] font-bold text-ink-4">0:12</span>
      </div>
    </div>
  );
}

function AnalysisMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="relative">
        <Ring value={97} size={74} stroke={7} color="#16A34A" />
        <span className="absolute inset-0 grid place-items-center text-[18px] font-bold text-ink">97%</span>
      </div>
      <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">You aced it</div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-600">
        <Check className="h-3.5 w-3.5" strokeWidth={3} /> Clear, structured answers
      </span>
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      {/* Interview Score — this session's result */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="relative">
          <Ring value={86} size={78} stroke={7} color="#16A34A" />
          <span className="absolute inset-0 grid place-items-center text-[20px] font-bold text-ink">86</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-4">Interview Score</div>
      </div>
      {/* divider */}
      <span className="h-20 w-px shrink-0 bg-black/[0.07]" />
      {/* RQ-Score — the living, branded score that increments */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">RQ-Score</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[34px] font-bold leading-none tracking-[-0.02em] text-orange">74</span>
          <span className="text-[15px] font-semibold text-ink-4">/100</span>
          <span className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-orange-lighter px-2 py-0.5 text-[12px] font-bold text-orange-deep">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.6} /> +12
          </span>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
          <Check className="h-3.5 w-3.5" strokeWidth={3} /> Interview Ready
        </span>
      </div>
    </div>
  );
}

export function VeraSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Vera",
    valueProp:
      "Sit a real interview before the real one. RQ-Vera asks, listens, and scores you like a hiring panel, so you walk in calm, sharp, and ready.",
    chips: [
      { icon: MessageSquareText, label: "Real-Time Questions" },
      { icon: Sparkles, label: "AI Feedback" },
      { icon: Gauge, label: "Readiness Score" },
    ],
    steps: [
      { n: 1, title: "Choose Role", caption: "Pick the role & company you're targeting.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <ChooseRoleMockup /> },
      { n: 2, title: "Interview Session", caption: "RQ-Vera asks real questions, live.", bg: "from-[#F6CEDD] to-[#E8A6C0]", mockup: <InterviewSessionMockup /> },
      { n: 3, title: "AI Analysis", caption: "Every answer scored & explained.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <AnalysisMockup /> },
      { n: 4, title: "Readiness Report", caption: "A clear, shareable readiness score.", bg: "from-[#FBE3B4] to-[#F5C887]", mockup: <ReportMockup /> },
    ],
    features: [
      { icon: Mic, title: "Interview Simulation", caption: "Realistic, role-specific mock interviews." },
      { icon: AudioLines, title: "Communication Analysis", caption: "Clarity, pace & filler-word insights." },
      { icon: TrendingUp, title: "Confidence Tracking", caption: "Watch your delivery improve over reps." },
      { icon: Gauge, title: "Readiness Assessment", caption: "Know exactly when you're interview-ready." },
    ],
  };

  return <AgentShowcase config={config} />;
}
