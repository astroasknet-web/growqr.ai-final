"use client";

import { type ReactNode } from "react";
import {
  Activity,
  TrendingDown,
  ListOrdered,
  HeartHandshake,
  ArrowDownRight,
  Check,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Theo — the Attrition Predictor. Four "How It Works" steps in the shared
   zigzag FeatureRow layout, each paired with a minimal mockup panel. Theo
   sells foresight: see attrition coming before it lands on your desk. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Read team signals ────────────────────────────────────────────────── */
function SignalsPanel() {
  const signals = [
    { label: "Engagement", value: "72%", trend: "down" as const },
    { label: "Attendance", value: "94%", trend: "flat" as const },
    { label: "Sentiment", value: "Cooling", trend: "down" as const },
  ];
  return (
    <Panel gradient="from-rose-200 via-rose-100 to-pink-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Team health signals</h4>
        <Activity className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {signals.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="text-[13px] font-semibold text-ink">{s.label}</span>
            <span className="ml-auto text-[14px] font-bold text-ink">{s.value}</span>
            {s.trend === "down" && (
              <ArrowDownRight className="h-4 w-4 text-rose-500" strokeWidth={2.6} aria-hidden />
            )}
            {s.trend === "flat" && <span className="h-0.5 w-4 rounded bg-ink-4" aria-hidden />}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden />
        <span className="text-[12.5px] font-semibold text-ink">Risk may be building on Team Alpha</span>
      </div>
    </Panel>
  );
}

export function TheoSignals() {
  return (
    <FeatureRow
      agentName="RQ-Theo"
      Icon={Activity}
      label="Workforce Signals"
      heading={
        <>
          Read Team Signals
          <br />
          <span className="text-orange">in Real Time</span>
        </>
      }
      description="RQ-Theo reviews engagement, performance, attendance, and sentiment signals to understand where risk may be building."
      cta="Analyze My Workforce"
      ctaSolid
      visual={<SignalsPanel />}
    />
  );
}

/* ── 2. Detect disengagement patterns ────────────────────────────────────── */
function HeatmapPanel() {
  const teams = ["Alpha", "Bravo", "Delta", "Echo"];
  // 0 = low, 1 = medium, 2 = high risk
  const grid = [
    [0, 1, 2, 0],
    [1, 2, 1, 0],
    [0, 1, 1, 2],
  ];
  const tone = ["bg-emerald-200", "bg-amber-300", "bg-rose-400"];
  return (
    <Panel gradient="from-orange-200 via-amber-100 to-rose-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Risk by team</h4>
      <div className="mt-5">
        <div className="grid grid-cols-4 gap-1.5">
          {teams.map((t) => (
            <span key={t} className="text-center text-[11px] font-bold uppercase tracking-[0.04em] text-ink-4">
              {t}
            </span>
          ))}
          {grid.flat().map((v, i) => (
            <span key={i} className={`h-9 rounded-lg ${tone[v]}`} aria-hidden />
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        {["Low", "Medium", "High"].map((l, i) => (
          <span key={l} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-3">
            <span className={`h-2.5 w-2.5 rounded-sm ${tone[i]}`} aria-hidden />
            {l}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export function TheoPatterns() {
  return (
    <FeatureRow
      agentName="RQ-Theo"
      reverse
      Icon={TrendingDown}
      label="Risk Patterns"
      heading={
        <>
          Detect Early
          <br />
          <span className="text-orange">Disengagement Patterns</span>
        </>
      }
      description="RQ-Theo connects subtle changes across people data to identify employees and teams that may be drifting away."
      cta="Find Risk Patterns"
      visual={<HeatmapPanel />}
    />
  );
}

/* ── 3. Prioritize retention risk ────────────────────────────────────────── */
function PriorityPanel() {
  const rows = [
    { name: "Emma Clarke", team: "Team Alpha", level: "High", conf: "88%" },
    { name: "Noah Bennett", team: "Team Delta", level: "High", conf: "81%" },
    { name: "Sofia Reyes", team: "Team Bravo", level: "Medium", conf: "64%" },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Attention first</h4>
        <ListOrdered className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{r.name}</p>
              <p className="text-[12px] text-ink-4">{r.team}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                r.level === "High" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
              }`}
            >
              {r.level}
            </span>
            <span className="hidden text-[11.5px] font-semibold text-ink-4 sm:inline">{r.conf}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function TheoPrioritize() {
  return (
    <FeatureRow
      agentName="RQ-Theo"
      Icon={ListOrdered}
      label="Risk Priority"
      heading={
        <>
          Know Who Needs
          <br />
          <span className="text-orange">Attention First</span>
        </>
      }
      description="RQ-Theo prioritizes attrition risk so HR and managers know where to focus before the situation escalates."
      cta="Prioritize Risks"
      visual={<PriorityPanel />}
    />
  );
}

/* ── 4. Act before they resign ───────────────────────────────────────────── */
function ActionPanel() {
  const actions = [
    "Schedule a 1:1 check-in with Emma",
    "Discuss growth path & workload",
    "Set a 2-week follow-up reminder",
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Suggested actions</h4>
        <HeartHandshake className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {actions.map((a) => (
          <div key={a} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange text-white">
              <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
            </span>
            <span className="text-[13px] font-semibold text-ink">{a}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-emerald-700">Timing</span>
        <span className="rounded-full bg-emerald-500 px-3 py-1 text-[12px] font-bold text-white">Act now</span>
      </div>
    </Panel>
  );
}

export function TheoAct() {
  return (
    <FeatureRow
      agentName="RQ-Theo"
      reverse
      Icon={HeartHandshake}
      label="Retention Action"
      heading={
        <>
          Act Before
          <br />
          <span className="text-orange">They Resign</span>
        </>
      }
      description="RQ-Theo suggests timely retention actions so managers can start the right conversation at the right moment."
      cta="Plan Retention Action"
      visual={<ActionPanel />}
    />
  );
}
