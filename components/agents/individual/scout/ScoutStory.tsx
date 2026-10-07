"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Scout — "Roles That Find You".
   Three autopilot beats (set what fits, RQ-Scout hunts and ranks, it applies for you)
   on the shared AgentStory shell. Minimal, orange only for highlights. */

/* ── State 1 — Set what fits ─────────────────────────────────────────────── */
function FitState() {
  const criteria = [
    { label: "Product Manager", icon: "solar:case-round-minimalistic-bold" },
    { label: "Remote", icon: "solar:map-point-bold" },
    { label: "$120k+", icon: "solar:wad-of-money-bold" },
  ];
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
        <Icon icon="solar:tuning-2-bold" className="size-3.5" />
        What fits you
      </div>
      <div className="space-y-2.5">
        {criteria.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-cream/60 px-4 py-3.5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-orange shadow-card">
              <Icon icon={c.icon} className="size-4.5" />
            </span>
            <span className="flex-1 text-[15px] font-semibold text-ink">{c.label}</span>
            <Icon icon="solar:check-circle-bold" className="size-5 text-orange" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 2 — RQ-Scout hunts and ranks ─────────────────────────────────────── */
function RankState() {
  const roles = [
    { label: "Senior PM, Linear", score: 97 },
    { label: "PM, Notion", score: 94 },
    { label: "Product Lead, Ramp", score: 91 },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Best matches
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:magnifer-zoom-in-bold" className="size-3.5" />
          Ranked
        </span>
      </div>
      <div className="space-y-2.5">
        {roles.map((r) => (
          <div key={r.label} className="flex items-center gap-3 rounded-xl bg-cream/60 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-ink shadow-card">
              <Icon icon="solar:buildings-2-bold" className="size-4.5 text-orange" />
            </span>
            <span className="flex-1 truncate text-[14px] font-semibold text-ink">{r.label}</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
              {r.score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 3 — It applies for you ────────────────────────────────────────── */
function ApplyState() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-orange/[0.08] to-orange/[0.02] p-5 text-center">
        <span className="text-[46px] font-bold leading-none tracking-[-0.03em] text-ink">12</span>
        <p className="mt-1 text-[13px] font-semibold text-ink-4">roles applied to for you</p>
      </div>
      <div className="space-y-2.5">
        {["Senior PM, Linear", "PM, Notion"].map((label) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream/50 px-4 py-3"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-500 text-white">
              <Icon icon="solar:check-read-bold" className="size-3.5" />
            </span>
            <span className="flex-1 truncate text-[14px] font-semibold text-ink-3">{label}</span>
            <span className="text-[12px] font-bold text-emerald-600">Applied</span>
          </div>
        ))}
      </div>
      <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-emerald-700">
        <Icon icon="solar:moon-sleep-bold" className="size-4" />
        Applies while you sleep
      </p>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "Set What Fits",
    description: "Choose the role, location, and pay that matter to you.",
    icon: "solar:tuning-2-bold",
    Visual: FitState,
  },
  {
    title: "RQ-Scout Hunts and Ranks",
    description: "Every source is searched and matches are scored for you.",
    icon: "solar:magnifer-zoom-in-bold",
    Visual: RankState,
  },
  {
    title: "It Applies for You",
    description: "RQ-Scout submits to the best matches, even while you sleep.",
    icon: "solar:plain-2-bold",
    Visual: ApplyState,
  },
];

export default function ScoutStory() {
  return (
    <AgentStory
      heading={
        <>
          Roles That
          <br />
          <span className="text-orange">Find You</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Career Readiness"
      cta={{
        label: AGENT_CTA["RQ-Scout"] ?? "Find Opportunities",
        href: AGENT_URL["RQ-Scout"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
