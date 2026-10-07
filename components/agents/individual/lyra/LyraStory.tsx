"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Lyra — "Learning, Minus the Noise".
   Three autopilot beats (name the goal, RQ-Lyra curates the path, only what matters)
   on the shared AgentStory shell. Minimal, orange only for highlights. */

/* ── State 1 — Name the goal ─────────────────────────────────────────────── */
function GoalState() {
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
        <Icon icon="solar:flag-2-bold" className="size-3.5" />
        Your goal
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-cream/60 px-4 py-3.5">
        <Icon icon="solar:cup-star-bold" className="size-5 shrink-0 text-orange" />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
          Become a Data Analyst
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {["8 weeks", "Beginner", "5 hrs/week"].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-[13px] font-medium text-ink-3 shadow-card"
          >
            <Icon icon="solar:calendar-minimalistic-linear" className="size-3.5 text-orange" />
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── State 2 — RQ-Lyra curates the path ─────────────────────────────────────── */
function PathState() {
  const weeks = [
    { label: "Spreadsheets & SQL", done: true },
    { label: "Data cleaning", done: true },
    { label: "Visualization", done: false },
    { label: "Dashboards", done: false },
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">Your path</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:route-bold" className="size-3.5" />
          Sequenced
        </span>
      </div>
      <div className="space-y-2.5">
        {weeks.map((w, i) => (
          <div
            key={w.label}
            className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream/50 px-4 py-3"
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold ${
                w.done ? "bg-emerald-500 text-white" : "bg-orange text-white"
              }`}
            >
              {w.done ? <Icon icon="solar:check-read-bold" className="size-3.5" /> : i + 1}
            </span>
            <span className="flex-1 text-[14px] font-semibold text-ink">{w.label}</span>
            <span className="text-[12px] font-medium text-ink-4">Week {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 3 — Only what matters ─────────────────────────────────────────── */
function ResourceState() {
  const resources = [
    { label: "SQL in 90 minutes", type: "Course", icon: "solar:play-circle-bold" },
    { label: "Clean data, fast", type: "Article", icon: "solar:document-text-bold" },
    { label: "Dashboard walkthrough", type: "Video", icon: "solar:videocamera-record-bold" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Hand-picked
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:magic-stick-3-bold" className="size-3.5" />
          Curated
        </span>
      </div>
      <div className="space-y-2.5">
        {resources.map((r) => (
          <div key={r.label} className="flex items-center gap-3 rounded-xl bg-cream/60 px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-orange shadow-card">
              <Icon icon={r.icon} className="size-4.5" />
            </span>
            <span className="flex-1 text-[14px] font-semibold text-ink">{r.label}</span>
            <span className="rounded-full bg-orange-lighter px-2.5 py-0.5 text-[11px] font-bold text-orange-deep">
              {r.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "Set Your Goal",
    description: "Tell RQ-Lyra the skill or role you are chasing.",
    icon: "solar:flag-2-bold",
    Visual: GoalState,
  },
  {
    title: "RQ-Lyra Curates the Path",
    description: "Your skills are sequenced week by week, automatically.",
    icon: "solar:route-bold",
    Visual: PathState,
  },
  {
    title: "Only What Matters",
    description: "The best resources are picked for you, so you skip the searching.",
    icon: "solar:magic-stick-3-bold",
    Visual: ResourceState,
  },
];

export default function LyraStory() {
  return (
    <AgentStory
      heading={
        <>
          Learn What Matters,
          <br />
          <span className="text-orange">Skip the Rest</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Learning Readiness"
      cta={{
        label: AGENT_CTA["RQ-Lyra"] ?? "Get My Learning Path",
        href: AGENT_URL["RQ-Lyra"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
