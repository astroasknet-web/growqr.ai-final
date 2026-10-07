"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AgentName } from "@/components/ui/AgentName";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Nova — "Your Brand, on Autopilot".
   Four autopilot beats (describe → refine → plan → publish) on the shared
   AgentStory shell, which appends the two common payoff beats (readiness,
   rewards). Right-side illustrations stay minimal — orange only for highlights. */

/* ── State 1 — Prompt Card ───────────────────────────────────────────────── */
function PromptState() {
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
        <Icon icon="solar:stars-bold" className="size-3.5" />
        Ask <AgentName name="RQ-Nova" />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-cream/60 px-4 py-3.5">
        <Icon icon="solar:magic-stick-3-bold" className="size-5 shrink-0 text-orange" />
        <span className="min-w-0 flex-1 truncate text-[15px] text-ink-4">
          Help me build my LinkedIn brand…
        </span>
        <button
          type="button"
          tabIndex={-1}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange text-white shadow-[0_10px_24px_-10px_rgba(255,106,47,0.7)]"
        >
          <Icon icon="solar:arrow-up-linear" className="size-5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          "Grow my personal brand",
          "Get noticed by recruiters",
        ].map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-[13px] font-medium text-ink-3 shadow-card"
          >
            <Icon icon="solar:magic-stick-3-linear" className="size-3.5 text-orange" />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── State 2 — AI Writing ────────────────────────────────────────────────── */
function WritingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Post Hook
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:magic-stick-3-bold" className="size-3.5" />
          Improved
        </span>
      </div>
      <p className="text-[17px] font-bold leading-snug tracking-[-0.01em] text-ink">
        The lesson that doubled our pipeline, and the mistake that almost cost us everything.
      </p>
      <div className="space-y-2">
        <span className="block h-2.5 w-full rounded-full bg-cream-3" />
        <span className="block h-2.5 w-11/12 rounded-full bg-cream-3" />
        <span className="block h-2.5 w-2/3 rounded-full bg-cream-3" />
      </div>
      <button
        type="button"
        tabIndex={-1}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(255,106,47,0.7)]"
      >
        <Icon icon="solar:check-circle-bold" className="size-4" />
        Apply Suggestion
      </button>
    </div>
  );
}

/* ── State 3 — Weekly Plan ───────────────────────────────────────────────── */
function PlanState() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const active = [0, 2, 4, 6];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">
          This Week
        </span>
        <span className="text-[12px] font-semibold text-ink-4">4 posts</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div
            key={i}
            className={`flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-bold ${
              active.includes(i)
                ? "bg-orange text-white"
                : "bg-cream-2 text-ink-4"
            }`}
          >
            {d}
            {active.includes(i) && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </div>
        ))}
      </div>
      <div className="space-y-2.5">
        {["Leadership lesson", "Behind the build", "Career takeaway"].map((label) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-orange/15 bg-orange-lighter/60 px-4 py-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-orange shadow-card">
              <Icon icon="solar:document-text-bold" className="size-4" />
            </span>
            <span className="text-[14px] font-semibold text-ink">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 4 — Ready to Publish ──────────────────────────────────────────── */
function PublishState() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/[0.06] bg-cream/50 p-4">
        <p className="text-[15px] font-bold leading-snug text-ink">
          Most resumes get rejected in 7 seconds. Here&apos;s how to beat it.
        </p>
        <div className="mt-3 space-y-2">
          <span className="block h-2 w-full rounded-full bg-cream-3" />
          <span className="block h-2 w-3/4 rounded-full bg-cream-3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          tabIndex={-1}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-14px_rgba(255,106,47,0.7)]"
        >
          <Icon icon="solar:plain-2-bold" className="size-4" />
          Publish
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-2 text-[13px] font-bold text-emerald-600">
          <Icon icon="solar:arrow-right-up-linear" className="size-4" />
          +96%
        </span>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-emerald-700">
        <Icon icon="solar:check-circle-bold" className="size-4" />
        Published, on brand and on time
      </p>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "Describe Your Goal",
    description: "Tell RQ-Nova what you want to achieve.",
    icon: "solar:chat-round-line-bold",
    Visual: PromptState,
  },
  {
    title: "Refine with AI",
    description: "Improve the direction with simple prompts.",
    icon: "solar:magic-stick-3-bold",
    Visual: WritingState,
  },
  {
    title: "Generate Your Weekly Plan",
    description: "Get ready-to-publish content in seconds.",
    icon: "solar:calendar-bold",
    Visual: PlanState,
  },
  {
    title: "Publish With Confidence",
    description: "Stay consistent while RQ-Nova handles the writing.",
    icon: "solar:rocket-bold",
    Visual: PublishState,
  },
];

export default function NovaStory() {
  return (
    <AgentStory
      heading={
        <>
          Your Brand,
          <br />
          <span className="text-orange">on Autopilot</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Brand Readiness"
      cta={{
        label: AGENT_CTA["RQ-Nova"] ?? "Improve My Profile",
        href: AGENT_URL["RQ-Nova"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
