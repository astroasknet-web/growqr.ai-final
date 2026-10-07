"use client";

import { type ReactNode } from "react";
import {
  LayoutGrid,
  BarChart3,
  ScanSearch,
  ListChecks,
  ArrowUpRight,
  Check,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Rohan — the Workforce Analyst. Four "How It Works" steps in the shared
   zigzag FeatureRow layout, each paired with a minimal mockup panel. Rohan
   sells clarity: see the whole workforce, then act on what matters. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Map your workforce ───────────────────────────────────────────────── */
function MapPanel() {
  const teams = [
    { name: "Engineering", count: 48 },
    { name: "Product", count: 12 },
    { name: "Design", count: 9 },
    { name: "Sales", count: 21 },
  ];
  return (
    <Panel gradient="from-violet-200 via-violet-100 to-purple-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Workforce map</h4>
        <span className="text-[12px] font-bold text-ink-4">90 people</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {teams.map((t) => (
          <div key={t.name} className="rounded-xl border border-black/[0.07] bg-cream-2/60 p-3.5">
            <p className="text-[22px] font-bold leading-none tracking-[-0.02em] text-ink">{t.count}</p>
            <p className="mt-1.5 text-[12px] font-semibold text-ink-3">{t.name}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <LayoutGrid className="h-4 w-4 text-orange" strokeWidth={2.3} aria-hidden />
        <span className="text-[12.5px] font-semibold text-ink">Skills mapped across 24 roles</span>
      </div>
    </Panel>
  );
}

export function RohanMap() {
  return (
    <FeatureRow
      agentName="RQ-Rohan"
      Icon={LayoutGrid}
      label="Workforce View"
      heading={
        <>
          Map Your
          <br />
          <span className="text-orange">Workforce</span>
        </>
      }
      description="Build a complete view of skills, roles, and capabilities across your organisation."
      cta="View Workforce"
      ctaSolid
      visual={<MapPanel />}
    />
  );
}

/* ── 2. Reveal hidden trends ─────────────────────────────────────────────── */
function TrendsPanel() {
  const bars = [
    { label: "Data & AI", pct: 82 },
    { label: "Cloud", pct: 64 },
    { label: "Leadership", pct: 47 },
    { label: "Design", pct: 71 },
  ];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-blue-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Skill distribution</h4>
        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600">
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden /> Trending
        </span>
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
    </Panel>
  );
}

export function RohanTrends() {
  return (
    <FeatureRow
      agentName="RQ-Rohan"
      reverse
      Icon={BarChart3}
      label="Pattern Analysis"
      heading={
        <>
          Reveal Hidden
          <br />
          <span className="text-orange">Trends</span>
        </>
      }
      description="Identify performance patterns, skill distribution, and emerging workforce insights."
      cta="Analyse Trends"
      visual={<TrendsPanel />}
    />
  );
}

/* ── 3. Identify skill gaps ──────────────────────────────────────────────── */
function GapsPanel() {
  const gaps = [
    { skill: "Cloud Architecture", level: "High" },
    { skill: "Team Leadership", level: "High" },
    { skill: "Data Analysis", level: "Medium" },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Capability gaps</h4>
        <ScanSearch className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {gaps.map((g) => (
          <div key={g.skill} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="text-[13px] font-semibold text-ink">{g.skill}</span>
            <span
              className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold ${
                g.level === "High" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
              }`}
            >
              {g.level} priority
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Impact</span>
        <span className="text-[12.5px] font-semibold text-ink">Productivity &amp; goals</span>
      </div>
    </Panel>
  );
}

export function RohanGaps() {
  return (
    <FeatureRow
      agentName="RQ-Rohan"
      Icon={ScanSearch}
      label="Gap Detection"
      heading={
        <>
          Identify
          <br />
          <span className="text-orange">Skill Gaps</span>
        </>
      }
      description="Pinpoint capability gaps that impact productivity and business goals."
      cta="View Gaps"
      visual={<GapsPanel />}
    />
  );
}

/* ── 4. Prioritise development ───────────────────────────────────────────── */
function PlanPanel() {
  const actions = [
    "Launch cloud upskilling for Engineering",
    "Start leadership track for 6 managers",
    "Hire 2 senior data roles",
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Development priorities</h4>
        <ListChecks className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {actions.map((a, i) => (
          <div key={a} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <span className="text-[13px] font-semibold text-ink">{a}</span>
            <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} aria-hidden />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RohanPlan() {
  return (
    <FeatureRow
      agentName="RQ-Rohan"
      reverse
      Icon={ListChecks}
      label="Action Planning"
      heading={
        <>
          Prioritise
          <br />
          <span className="text-orange">Development</span>
        </>
      }
      description="Turn workforce insights into targeted learning and workforce planning decisions."
      cta="Take Action"
      visual={<PlanPanel />}
    />
  );
}
