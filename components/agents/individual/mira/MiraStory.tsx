"use client";

import { Icon } from "@iconify/react";
import AgentStory, { type StoryStep } from "@/components/agents/shared/AgentStory";
import { AgentName } from "@/components/ui/AgentName";
import { AGENT_CTA, AGENT_URL } from "@/lib/agentMedia";

/* RQ-Mira — "Resumes, Made Effortless".
   Three autopilot beats (name the role, RQ-Mira writes it, it retunes per job) on
   the shared AgentStory shell. Minimal illustrations, orange only for highlights. */

/* ── State 1 — Point RQ-Mira at the role ────────────────────────────────────── */
function RoleState() {
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full bg-orange-lighter px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
        <Icon icon="solar:target-bold" className="size-3.5" />
        Target role
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-cream/60 px-4 py-3.5">
        <Icon icon="solar:case-round-minimalistic-bold" className="size-5 shrink-0 text-orange" />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
          Senior Product Manager
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange text-white shadow-[0_10px_24px_-10px_rgba(255,106,47,0.7)]">
          <Icon icon="solar:arrow-right-linear" className="size-5" />
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Product Manager", "Growth Lead", "Program Manager"].map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-[13px] font-medium text-ink-3 shadow-card"
          >
            <Icon icon="solar:magnifer-linear" className="size-3.5 text-orange" />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── State 2 — RQ-Mira writes every section, score climbing ─────────────────── */
function WriteState() {
  const rows = [
    { label: "Summary", status: "Written", tone: "good" as const },
    { label: "Experience", status: "Written", tone: "good" as const },
    { label: "Skills", status: "Optimizing", tone: "warn" as const },
  ];
  const dot = { good: "bg-emerald-500", warn: "bg-amber-500" };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Resume score
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Icon icon="solar:magic-stick-3-bold" className="size-3.5" />
          <AgentName name="RQ-Mira" /> writing
        </span>
      </div>

      {/* rising score */}
      <div className="rounded-2xl bg-gradient-to-br from-orange/[0.08] to-orange/[0.02] p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">92</span>
          <span className="text-[13px] font-semibold text-emerald-600">ATS ready</span>
          <span className="ml-auto inline-flex items-center gap-0.5 text-[12px] font-bold text-emerald-600">
            <Icon icon="solar:arrow-up-bold" className="size-3" aria-hidden />
            +34
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full w-[92%] rounded-full bg-orange" />
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg bg-cream-2/70 px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-ink-2">{r.label}</span>
            <span className="flex items-center gap-2 text-[12px] font-bold text-ink">
              <span className={`h-2 w-2 rounded-full ${dot[r.tone]}`} /> {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── State 3 — Tailored to each job automatically ────────────────────────── */
function TailorState() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/[0.06] bg-cream/50 p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Job description
        </div>
        <div className="mt-2 space-y-2">
          <span className="block h-2 w-full rounded-full bg-cream-3" />
          <span className="block h-2 w-4/5 rounded-full bg-cream-3" />
          <span className="block h-2 w-2/3 rounded-full bg-cream-3" />
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-orange/[0.08] to-orange/[0.02] p-5">
        <div className="flex items-center justify-between text-[12px] font-semibold text-ink-4">
          <span>Match to this role</span>
          <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
            <Icon icon="solar:arrow-up-bold" className="size-3" aria-hidden />
            auto-tuned
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-ink">96%</span>
          <span className="text-[13px] font-semibold text-emerald-600">strong fit</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full w-[96%] rounded-full bg-orange" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {["+ roadmap", "+ A/B testing", "+ stakeholder"].map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange/25 bg-orange-lighter px-3 py-1 text-[12px] font-semibold text-orange-deep"
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

const STEPS: StoryStep[] = [
  {
    title: "Just Name the Role",
    description: "Tell RQ-Mira the job you want and it takes over from there.",
    icon: "solar:target-bold",
    Visual: RoleState,
  },
  {
    title: "RQ-Mira Writes Every Section",
    description: "An ATS-ready resume appears with your score climbing live.",
    icon: "solar:magic-stick-3-bold",
    Visual: WriteState,
  },
  {
    title: "Tuned to Every Job",
    description: "Paste a job description and your resume retunes itself.",
    icon: "solar:documents-bold",
    Visual: TailorState,
  },
];

export default function MiraStory() {
  return (
    <AgentStory
      heading={
        <>
          Resumes,
          <br />
          <span className="text-orange">Made Effortless</span>
        </>
      }
      steps={STEPS}
      readinessLabel="Resume Readiness"
      cta={{
        label: AGENT_CTA["RQ-Mira"] ?? "Build My Resume",
        href: AGENT_URL["RQ-Mira"] ?? "https://app.growqr.ai/signup",
      }}
    />
  );
}
