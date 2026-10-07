"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Sage — "Growth, Made Simple".
   Three autopilot beats (quick check, RQ-Sage maps the gaps, roadmap built for you)
   on the shared AgentStory shell. Minimal, orange only for highlights. */

/* ── State 1 — One quick check ───────────────────────────────────────────── */
function CheckState() {
  const options = [
    { label: "Confident", active: false },
    { label: "Getting there", active: true },
    { label: "New to it", active: false },
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
          <Icon icon="solar:clipboard-check-bold" className="size-3.5" />
          Quick check
        </span>
        <span className="text-[12px] font-semibold text-ink-4">3 of 6</span>
      </div>
      <p className="text-[16px] font-bold leading-snug text-ink">
        How comfortable are you with data modeling?
      </p>
      <div className="space-y-2.5">
        {options.map((o) => (
          <div
            key={o.label}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              o.active
                ? "border border-orange/25 bg-orange-lighter/70"
                : "border border-black/[0.06] bg-cream/50"
            }`}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                o.active ? "border-orange bg-orange text-white" : "border-ink-4/40"
              }`}
            >
              {o.active && <Icon icon="solar:check-read-linear" className="size-3.5" strokeWidth={2} />}
            </span>
            <span className={`text-[14px] font-semibold ${o.active ? "text-ink" : "text-ink-3"}`}>
              {o.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 2 — RQ-Sage maps the gaps ────────────────────────────────────────── */
function GapState() {
  const skills = [
    { label: "SQL", pct: 95, tone: "good" as const },
    { label: "Data modeling", pct: 45, tone: "gap" as const },
    { label: "Visualization", pct: 91, tone: "warn" as const },
  ];
  const bar = { good: "bg-emerald-500", warn: "bg-amber-500", gap: "bg-orange" };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Skill gaps
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:chart-2-bold" className="size-3.5" />
          Mapped
        </span>
      </div>
      <div className="space-y-3.5">
        {skills.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2">
              <span>{s.label}</span>
              <span className={s.tone === "gap" ? "text-orange-deep" : "text-ink-4"}>
                {s.tone === "gap" ? "Focus here" : `${s.pct}%`}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className={`h-full rounded-full ${bar[s.tone]}`} style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 3 — A roadmap built for you ───────────────────────────────────── */
function RoadmapState() {
  const tasks = [
    { label: "Data modeling basics", done: true },
    { label: "Practice: star schemas", done: true },
    { label: "Build a sample model", done: false },
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">Your roadmap</span>
        <span className="text-[12px] font-semibold text-emerald-600">2 of 3 done</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-cream-2">
        <div className="h-full w-[66%] rounded-full bg-orange" />
      </div>
      <div className="space-y-2.5">
        {tasks.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream/50 px-4 py-3"
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-lg ${
                t.done ? "bg-emerald-500 text-white" : "bg-white text-ink-4 shadow-card"
              }`}
            >
              <Icon
                icon={t.done ? "solar:check-read-bold" : "solar:play-bold"}
                className="size-3.5"
              />
            </span>
            <span className={`text-[14px] font-semibold ${t.done ? "text-ink-3" : "text-ink"}`}>
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "One Quick Check",
    description: "A short check, nothing to prepare for.",
    icon: "solar:clipboard-check-bold",
    Visual: CheckState,
  },
  {
    title: "RQ-Sage Maps the Gaps",
    description: "Your strengths and gaps, ranked for you automatically.",
    icon: "solar:chart-2-bold",
    Visual: GapState,
  },
  {
    title: "A Roadmap Built for You",
    description: "Daily tasks and progress tracking, generated to fit your goal.",
    icon: "solar:routing-2-bold",
    Visual: RoadmapState,
  },
];

export default function SageStory() {
  return (
    <AgentStory
      heading={
        <>
          Growth,
          <br />
          <span className="text-orange">Made Simple</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Skill Readiness"
      cta={{
        label: AGENT_CTA["RQ-Sage"] ?? "Build My Skill Plan",
        href: AGENT_URL["RQ-Sage"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
