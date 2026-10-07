"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AgentName } from "@/components/ui/AgentName";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Kai — "Practice That Feels Real".
   Three autopilot beats (pick the moment, RQ-Kai plays it live, coaching after each
   rep) on the shared AgentStory shell. Minimal, orange only for highlights. */

/* ── State 1 — Pick the moment ───────────────────────────────────────────── */
function ScenarioState() {
  const scenarios = [
    { label: "Salary negotiation", active: true },
    { label: "Tough feedback", active: false },
    { label: "Client pitch", active: false },
  ];
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
        <Icon icon="solar:chat-square-like-bold" className="size-3.5" />
        Choose a scenario
      </div>
      <div className="space-y-2.5">
        {scenarios.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${
              s.active
                ? "border border-orange/25 bg-orange-lighter/70"
                : "border border-black/[0.06] bg-cream/50"
            }`}
          >
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                s.active ? "bg-orange text-white" : "bg-white text-ink-4 shadow-card"
              }`}
            >
              <Icon icon="solar:users-group-rounded-bold" className="size-4.5" />
            </span>
            <span className={`flex-1 text-[15px] font-semibold ${s.active ? "text-ink" : "text-ink-3"}`}>
              {s.label}
            </span>
            {s.active && (
              <Icon icon="solar:check-circle-bold" className="size-5 text-orange" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 2 — RQ-Kai plays it live ─────────────────────────────────────────── */
function LiveState() {
  const bars = [30, 60, 45, 80, 55, 70, 40, 65, 50];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-500">
          <span className="size-2 rounded-full bg-rose-500" />
          Live roleplay
        </span>
        <span className="text-[12px] font-semibold text-ink-4">02:14</span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-cream/60 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-orange text-white">
          <Icon icon="solar:user-rounded-bold" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink"><AgentName name="RQ-Kai" /> as Hiring Manager</p>
          <p className="truncate text-[13px] text-ink-4">Walk me through your biggest win.</p>
        </div>
      </div>
      <div className="flex h-14 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-full bg-orange/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-emerald-700">
        <Icon icon="solar:microphone-3-bold" className="size-4" />
        Responding in real time
      </div>
    </div>
  );
}

/* ── State 3 — Coaching after every rep ──────────────────────────────────── */
function CoachState() {
  const tips = [
    { label: "Clear structure", tone: "good" as const },
    { label: "Slow down your pace", tone: "warn" as const },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Communication score
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:medal-star-bold" className="size-3.5" />
          Coached
        </span>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-orange/[0.08] to-orange/[0.02] p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">92</span>
          <span className="text-[13px] font-semibold text-emerald-600">strong</span>
          <span className="ml-auto inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-600">
            <Icon icon="solar:arrow-up-bold" className="size-3" aria-hidden />
            +11
          </span>
        </div>
      </div>
      <div className="space-y-2.5">
        {tips.map((t) => (
          <div key={t.label} className="flex items-center gap-3 rounded-lg bg-cream-2/70 px-3.5 py-2.5">
            <Icon
              icon={t.tone === "good" ? "solar:check-circle-bold" : "solar:lightbulb-bolt-bold"}
              className={`size-4.5 ${t.tone === "good" ? "text-emerald-500" : "text-amber-500"}`}
            />
            <span className="text-[13px] font-semibold text-ink-2">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "Pick the Moment",
    description: "Choose the conversation you need to get right.",
    icon: "solar:chat-square-like-bold",
    Visual: ScenarioState,
  },
  {
    title: "RQ-Kai Plays It Live",
    description: "Talk it through by voice as RQ-Kai reacts like a real person.",
    icon: "solar:microphone-3-bold",
    Visual: LiveState,
  },
  {
    title: "Coaching After Every Rep",
    description: "A communication score and clear tips the moment you finish.",
    icon: "solar:medal-star-bold",
    Visual: CoachState,
  },
];

export default function KaiStory() {
  return (
    <AgentStory
      heading={
        <>
          Practice That
          <br />
          <span className="text-orange">Feels Real</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Conversation Readiness"
      cta={{
        label: AGENT_CTA["RQ-Kai"] ?? "Start Roleplay",
        href: AGENT_URL["RQ-Kai"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
