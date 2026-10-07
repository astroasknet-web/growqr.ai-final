"use client";

import { type ReactNode } from "react";
import {
  ClipboardCheck,
  Route,
  GraduationCap,
  Gauge,
  Check,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Finn — the Onboarding Co-pilot. Four "How It Works" steps in the shared
   zigzag FeatureRow layout, each paired with a minimal mockup panel. Finn
   sells a smooth start: every new hire guided from day one to full ramp. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Prepare every new joiner ─────────────────────────────────────────── */
function PrepPanel() {
  const items = [
    { label: "Offer letter signed", done: true },
    { label: "ID & documents collected", done: true },
    { label: "Laptop shipped", done: false },
    { label: "Welcome email scheduled", done: false },
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Preboarding checklist</h4>
        <ClipboardCheck className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                it.done ? "bg-orange text-white" : "border-2 border-ink-4/40 bg-white"
              }`}
            >
              {it.done && <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />}
            </span>
            <span className={`text-[13px] font-semibold ${it.done ? "text-ink" : "text-ink-3"}`}>{it.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Ready for</span>
        <span className="rounded-full bg-orange px-3 py-1 text-[12px] font-bold text-white">Day one</span>
      </div>
    </Panel>
  );
}

export function FinnPrep() {
  return (
    <FeatureRow
      agentName="RQ-Finn"
      Icon={ClipboardCheck}
      label="Before Day One"
      heading={
        <>
          Prepare Every
          <br />
          <span className="text-orange">New Joiner</span>
        </>
      }
      description="Organise onboarding tasks, documents, and essentials before the employee starts."
      cta="Get Ready"
      ctaSolid
      visual={<PrepPanel />}
    />
  );
}

/* ── 2. Create a tailored plan ───────────────────────────────────────────── */
function JourneyPanel() {
  const stops = [
    { when: "Day 1", what: "Orientation & welcome" },
    { when: "Week 1", what: "Team, tools & access" },
    { when: "Day 30", what: "First project" },
    { when: "Day 90", what: "Full ramp" },
  ];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Onboarding journey</h4>
        <span className="rounded-full bg-cream-2 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">Product Designer</span>
      </div>
      <div className="mt-5 space-y-0">
        {stops.map((s, i) => (
          <div key={s.when} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange text-[10px] font-bold text-white">
                {i + 1}
              </span>
              {i < stops.length - 1 && <span className="my-1 w-0.5 flex-1 bg-orange/25" aria-hidden />}
            </div>
            <div className="pb-4">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-orange-deep">{s.when}</p>
              <p className="text-[13px] font-semibold text-ink">{s.what}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function FinnJourney() {
  return (
    <FeatureRow
      agentName="RQ-Finn"
      reverse
      Icon={Route}
      label="Personalised Journey"
      heading={
        <>
          Create a
          <br />
          <span className="text-orange">Tailored Plan</span>
        </>
      }
      description="Build onboarding journeys based on role, department, and location."
      cta="Build Journey"
      visual={<JourneyPanel />}
    />
  );
}

/* ── 3. Support every milestone ──────────────────────────────────────────── */
function MilestonePanel() {
  const milestones = [
    { label: "Complete compliance training", state: "done" as const },
    { label: "Meet your manager", state: "done" as const },
    { label: "Set 30-day goals", state: "active" as const },
    { label: "Shadow a live project", state: "upcoming" as const },
  ];
  return (
    <Panel gradient="from-violet-200 via-violet-100 to-purple-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Guided milestones</h4>
        <GraduationCap className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {milestones.map((m) => (
          <div
            key={m.label}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              m.state === "active" ? "border-orange/40 bg-orange-lighter/70" : "border-black/[0.07] bg-cream-2/60"
            }`}
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                m.state === "done"
                  ? "bg-emerald-500 text-white"
                  : m.state === "active"
                  ? "bg-orange text-white"
                  : "border-2 border-ink-4/40 bg-white"
              }`}
            >
              {m.state === "done" && <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />}
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">{m.label}</span>
            {m.state === "active" && (
              <span className="ml-auto shrink-0 text-[11px] font-bold uppercase tracking-[0.06em] text-orange-deep">Now</span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function FinnSupport() {
  return (
    <FeatureRow
      agentName="RQ-Finn"
      Icon={GraduationCap}
      label="Guided Learning"
      heading={
        <>
          Support Every
          <br />
          <span className="text-orange">Milestone</span>
        </>
      }
      description="Guide employees through tasks, training, policies, and key introductions."
      cta="Guide Employees"
      visual={<MilestonePanel />}
    />
  );
}

/* ── 4. Measure onboarding success ───────────────────────────────────────── */
function HealthPanel() {
  const bars = [
    { label: "Completion", pct: 78 },
    { label: "Engagement", pct: 92 },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Onboarding health</h4>
        <Gauge className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-3.5">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-ink">{b.label}</span>
              <span className="font-bold text-ink-3">{b.pct}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-orange" style={{ width: `${b.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Time to productivity</span>
        <span className="text-[13px] font-bold text-ink">24 days</span>
      </div>
    </Panel>
  );
}

export function FinnMeasure() {
  return (
    <FeatureRow
      agentName="RQ-Finn"
      reverse
      Icon={Gauge}
      label="Track Progress"
      heading={
        <>
          Measure
          <br />
          <span className="text-orange">Onboarding Success</span>
        </>
      }
      description="Monitor completion, engagement, and readiness throughout onboarding."
      cta="View Progress"
      visual={<HealthPanel />}
    />
  );
}
