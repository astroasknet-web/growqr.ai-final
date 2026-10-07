"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AgentName } from "@/components/ui/AgentName";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Vera — "Interviews, Made Easy".
   Three autopilot beats (set up in seconds, RQ-Vera runs the mock, instant feedback)
   on the shared AgentStory shell. Minimal, orange only for highlights. */

/* ── State 1 — Set up in seconds ─────────────────────────────────────────── */
function SetupState() {
  const fields = [
    { label: "Role", value: "Product Manager" },
    { label: "Company", value: "Stripe" },
    { label: "Format", value: "Behavioral" },
  ];
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
        <Icon icon="solar:settings-bold" className="size-3.5" />
        Set up
      </div>
      <div className="space-y-2.5">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-cream/60 px-4 py-3.5"
          >
            <span className="text-[13px] font-medium text-ink-4">{f.label}</span>
            <span className="text-[14px] font-bold text-ink">{f.value}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(255,106,47,0.7)]"
      >
        <Icon icon="solar:play-bold" className="size-4" />
        Start interview
      </button>
    </div>
  );
}

/* ── State 2 — RQ-Vera runs the mock ────────────────────────────────────────── */
function MockState() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-500">
          <span className="size-2 rounded-full bg-rose-500" />
          Live interview
        </span>
        <span className="text-[12px] font-semibold text-ink-4">Question 3 of 8</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-cream-2">
        <div className="h-full w-[38%] rounded-full bg-orange" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-cream/60 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-orange text-white">
          <Icon icon="solar:user-rounded-bold" className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink"><AgentName name="RQ-Vera" /> asks</p>
          <p className="text-[14px] leading-snug text-ink-3">
            Tell me about a time you shipped under pressure.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-emerald-700">
        <Icon icon="solar:microphone-3-bold" className="size-4" />
        Listening and following up
      </div>
    </div>
  );
}

/* ── State 3 — Instant scored feedback ───────────────────────────────────── */
function FeedbackState() {
  const scores = [
    { label: "Communication", pct: 94 },
    { label: "Confidence", pct: 91 },
    { label: "Technical", pct: 90 },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Your feedback
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:bolt-bold" className="size-3.5" />
          Instant
        </span>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-orange/[0.08] to-orange/[0.02] p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">94</span>
          <span className="text-[13px] font-semibold text-ink-4">/ 100 overall</span>
          <span className="ml-auto inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-600">
            <Icon icon="solar:arrow-up-bold" className="size-3" aria-hidden />
            ready
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {scores.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[13px] font-semibold text-ink-2">
              <span>{s.label}</span>
              <span className="text-ink-4">{s.pct}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-orange" style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "Set Up in Seconds",
    description: "Pick your role and company, then you are ready.",
    icon: "solar:settings-bold",
    Visual: SetupState,
  },
  {
    title: "RQ-Vera Runs the Mock",
    description: "She asks, listens, and follows up like the real thing.",
    icon: "solar:microphone-3-bold",
    Visual: MockState,
  },
  {
    title: "Instant Scored Feedback",
    description: "Question-by-question scores the moment you finish.",
    icon: "solar:bolt-bold",
    Visual: FeedbackState,
  },
];

export default function VeraStory() {
  return (
    <AgentStory
      heading={
        <>
          Interviews,
          <br />
          <span className="text-orange">Made Easy</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Interview Readiness"
      cta={{
        label: AGENT_CTA["RQ-Vera"] ?? "Start Mock Interview",
        href: AGENT_URL["RQ-Vera"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
