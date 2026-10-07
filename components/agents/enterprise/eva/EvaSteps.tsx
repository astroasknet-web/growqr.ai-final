"use client";

import { type ReactNode } from "react";
import {
  Layers,
  ScanSearch,
  Route,
  LineChart,
  ArrowUpRight,
  Check,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Eva — the Capability Builder. Four "How It Works" steps in the shared
   zigzag FeatureRow layout, each paired with a minimal mockup panel. Eva
   sells measurable growth: find the gaps that matter, then close them. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Map team skills & role needs ─────────────────────────────────────── */
function MapPanel() {
  const skills = [
    { label: "React", have: 80, need: 90 },
    { label: "System Design", have: 55, need: 85 },
    { label: "Comms", have: 70, need: 75 },
  ];
  return (
    <Panel gradient="from-violet-200 via-violet-100 to-purple-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Skills vs role needs</h4>
        <Layers className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-3.5">
        {skills.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-ink">{s.label}</span>
              <span className="font-bold text-ink-3">
                {s.have}<span className="text-ink-4"> / {s.need}</span>
              </span>
            </div>
            <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-orange/30" style={{ width: `${s.need}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-orange" style={{ width: `${s.have}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[11.5px] font-semibold text-ink-3">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange" aria-hidden /> Current</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange/30" aria-hidden /> Required</span>
      </div>
    </Panel>
  );
}

export function EvaMap() {
  return (
    <FeatureRow
      agentName="RQ-Eva"
      Icon={Layers}
      label="Skill Mapping"
      heading={
        <>
          Map Team Skills
          <br />
          <span className="text-orange">&amp; Role Needs</span>
        </>
      }
      description="RQ-Eva reads role expectations, team goals, and existing skill data to understand what capability is needed."
      cta="Map Capabilities"
      ctaSolid
      visual={<MapPanel />}
    />
  );
}

/* ── 2. Identify the gaps that matter ────────────────────────────────────── */
function GapPanel() {
  const gaps = [
    { skill: "System Design", impact: "High", team: "Platform" },
    { skill: "Data Modelling", impact: "High", team: "Analytics" },
    { skill: "Stakeholder Comms", impact: "Medium", team: "Product" },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Gaps that matter</h4>
        <ScanSearch className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {gaps.map((g) => (
          <div key={g.skill} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{g.skill}</p>
              <p className="text-[12px] text-ink-4">{g.team}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                g.impact === "High" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
              }`}
            >
              {g.impact} impact
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function EvaGaps() {
  return (
    <FeatureRow
      agentName="RQ-Eva"
      reverse
      Icon={ScanSearch}
      label="Gap Analysis"
      heading={
        <>
          Identify the Gaps
          <br />
          <span className="text-orange">That Matter</span>
        </>
      }
      description="RQ-Eva highlights the most important skill gaps by role, team, priority, and business impact."
      cta="Find Skill Gaps"
      visual={<GapPanel />}
    />
  );
}

/* ── 3. Recommend targeted learning paths ────────────────────────────────── */
function PathPanel() {
  const modules = [
    { title: "System Design Foundations", meta: "4 modules · 3 wks" },
    { title: "Scaling Distributed Systems", meta: "6 modules · 4 wks" },
    { title: "Design Review Practicum", meta: "2 modules · 1 wk" },
  ];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-blue-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Learning path</h4>
        <span className="rounded-full bg-cream-2 px-2.5 py-1 text-[11.5px] font-semibold text-ink-2">System Design</span>
      </div>
      <div className="mt-5 space-y-2.5">
        {modules.map((m, i) => (
          <div key={m.title} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange text-[12px] font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold leading-tight text-ink">{m.title}</p>
              <p className="text-[11.5px] text-ink-4">{m.meta}</p>
            </div>
            <Route className="h-4 w-4 shrink-0 text-orange" strokeWidth={2.3} aria-hidden />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function EvaPaths() {
  return (
    <FeatureRow
      agentName="RQ-Eva"
      Icon={Route}
      label="Learning Paths"
      heading={
        <>
          Recommend Targeted
          <br />
          <span className="text-orange">Learning Paths</span>
        </>
      }
      description="RQ-Eva turns skill gaps into focused learning paths, so development feels relevant instead of generic."
      cta="Build Learning Paths"
      visual={<PathPanel />}
    />
  );
}

/* ── 4. Track capability improvement ─────────────────────────────────────── */
function ProgressPanel() {
  const rows = [
    { label: "System Design", from: 55, to: 78 },
    { label: "Data Modelling", from: 48, to: 66 },
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Capability lift</div>
          <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">+21%</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden /> This quarter
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-ink">{r.label}</span>
              <span className="font-bold text-emerald-600">{r.from} → {r.to}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-orange" style={{ width: `${r.to}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-black/[0.07] bg-cream/60 p-3">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
        </span>
        <span className="text-[12.5px] font-semibold text-ink">On track to close 4 of 5 priority gaps</span>
      </div>
    </Panel>
  );
}

export function EvaProgress() {
  return (
    <FeatureRow
      agentName="RQ-Eva"
      reverse
      Icon={LineChart}
      label="Progress Tracking"
      heading={
        <>
          Track Capability
          <br />
          <span className="text-orange">Improvement</span>
        </>
      }
      description="RQ-Eva tracks learning progress and capability movement, helping teams see what is actually improving."
      cta="View Progress"
      visual={<ProgressPanel />}
    />
  );
}
