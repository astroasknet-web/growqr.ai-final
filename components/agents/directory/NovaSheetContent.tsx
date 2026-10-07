"use client";

import Image from "next/image";
import {
  Check,
  Sparkles,
  AlertTriangle,
  Eye,
  PenLine,
  Calendar,
  ArrowDown,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentShowcase, Ring, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Nova — the Brand Builder. Visual showcase config + its UI mockups.
   Marketing mockups: one example, one large focal element per card. */

const NOVA = "#525252";

function ConnectProfileMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <span className="relative h-16 w-16 overflow-hidden rounded-full bg-cream-2 ring-2 ring-white shadow-[0_8px_20px_-10px_rgba(0,0,0,0.4)]">
        <Image src="/shared/avatars/male7.webp" alt="" fill sizes="64px" className="object-cover" />
      </span>
      <div className="text-[16px] font-bold tracking-[-0.01em] text-ink">James Carter</div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-600">
        <Check className="h-3 w-3" strokeWidth={3.5} /> Profile linked
      </span>
    </div>
  );
}

function PresenceAuditMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col items-center justify-center gap-3 rounded-2xl bg-white p-5 text-center shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="relative">
        <Ring value={58} size={72} stroke={7} color={NOVA} />
        <span className="absolute inset-0 grid place-items-center text-[19px] font-bold text-ink">58</span>
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-4">Visibility score</div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-semibold text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} /> Headline reads generic
      </span>
    </div>
  );
}

function OptimizedCopyMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center gap-2 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="rounded-xl bg-cream-2/70 px-3.5 py-2.5 ring-1 ring-black/[0.05]">
        <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-4">Before</div>
        <div className="mt-0.5 text-[13px] font-medium text-ink-3 line-through decoration-ink-4/40">
          Product Manager at Acme
        </div>
      </div>
      <div className="grid place-items-center">
        <ArrowDown className="h-4 w-4 text-ink-4" strokeWidth={2.5} />
      </div>
      <div className="rounded-xl px-3.5 py-2.5 ring-1" style={{ background: `${NOVA}0F`, borderColor: `${NOVA}33` }}>
        <div className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: NOVA }}>After</div>
        <div className="mt-0.5 text-[13.5px] font-semibold leading-snug text-ink">
          Senior PM turning messy roadmaps into shipped product
        </div>
      </div>
    </div>
  );
}

function PostingPlanMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col justify-center gap-3 rounded-2xl bg-white p-5 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="grid grid-cols-5 gap-1.5">
        {["M", "T", "W", "T", "F"].map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 rounded-lg bg-cream-2/60 py-1.5 ring-1 ring-black/[0.04]">
            <span className="text-[10px] font-bold text-ink-4">{d}</span>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === 1 ? NOVA : "#00000014" }} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-black/[0.07] px-4 py-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white" style={{ background: NOVA }}>
          Tue
        </span>
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink">Lessons from a failed launch</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> Scheduled
        </span>
      </div>
    </div>
  );
}

export function NovaSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Nova",
    valueProp:
      "RQ-Nova audits how you show up online, rewrites the words that sell you, and hands you a posting plan that's impossible to scroll past.",
    chips: [
      { icon: Eye, label: "Visibility Audit" },
      { icon: PenLine, label: "Optimized Copy" },
      { icon: Calendar, label: "Posting Plan" },
    ],
    steps: [
      { n: 1, title: "Connect Profile", caption: "Link your profile & set the goal.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <ConnectProfileMockup /> },
      { n: 2, title: "Presence Audit", caption: "See exactly what's holding you back.", bg: "from-[#CFE0F7] to-[#A7C4ED]", mockup: <PresenceAuditMockup /> },
      { n: 3, title: "Optimized Copy", caption: "Your story, rewritten to land.", bg: "from-[#D9D6F5] to-[#B3ADE6]", mockup: <OptimizedCopyMockup /> },
      { n: 4, title: "Posting Plan", caption: "A weekly plan that builds authority.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <PostingPlanMockup /> },
    ],
  };

  return <AgentShowcase config={config} />;
}
