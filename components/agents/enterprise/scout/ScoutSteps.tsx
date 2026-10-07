"use client";

import { type ReactNode } from "react";
import { Target, Radar, Sparkles, Users, Check } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Scout — the Opportunity Finder (B2B). Four "How It Works" cards in the
   shared zigzag FeatureRow layout, each paired with a minimal talent-focused
   infographic panel. Scout discovers, evaluates, and nurtures high-potential
   talent into future-ready pipelines. Content sourced from the Scout sample. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">{children}</div>;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-cream-2 px-3 py-1 text-[12px] font-semibold text-ink-2">{children}</span>
  );
}

/* ── 1. Define talent needs — talent profile dashboard ────────────────────── */
function StrategyPanel() {
  const priorities: { label: string; weight: string }[] = [
    { label: "Skills", weight: "High" },
    { label: "Experience", weight: "High" },
    { label: "Culture fit", weight: "Medium" },
  ];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-indigo-200">
      <Label>Role requirements</Label>
      <h4 className="mt-1 text-lg font-bold tracking-[-0.01em] text-ink">Senior Product Engineer</h4>
      <p className="text-[13px] font-semibold text-ink-3">Product · Full-time</p>

      <div className="mt-5">
        <Label>Must-have skills</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>System Design</Chip>
          <Chip>Leadership</Chip>
          <Chip>React</Chip>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label>Priorities</Label>
        {priorities.map((p) => (
          <div key={p.label} className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream-2/60 px-3 py-2.5">
            <span className="text-[13px] font-semibold text-ink">{p.label}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-ink-3 ring-1 ring-black/[0.06]">
              {p.weight}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ScoutStrategy() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      Icon={Target}
      label="Talent Strategy"
      heading={
        <>
          Define What
          <br />
          <span className="text-orange">Success Looks Like</span>
        </>
      }
      description="Clarify the skills, capabilities, and qualities that matter before talent discovery begins."
      cta="Define Talent Needs"
      ctaSolid
      visual={<StrategyPanel />}
    />
  );
}

/* ── 2. Discover talent — talent discovery workspace ──────────────────────── */
function DiscoveryPanel() {
  const found = [
    { initials: "AM", name: "Alex Morgan", role: "Product Engineer" },
    { initials: "SC", name: "Sam Carter", role: "Staff Engineer" },
    { initials: "JL", name: "Jordan Lee", role: "Senior Engineer" },
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Talent discovered</Label>
          <p className="mt-1 text-[13px] font-semibold text-ink-3">480 profiles · 5 sources</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600">
          24 high-potential
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {found.map((f) => (
          <div key={f.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {f.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{f.name}</p>
              <p className="truncate text-[12.5px] text-ink-4">{f.role}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
              Recommended
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ScoutDiscovery() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      reverse
      Icon={Radar}
      label="Talent Discovery"
      heading={
        <>
          Discover
          <br />
          <span className="text-orange">High-Potential People</span>
        </>
      }
      description="Explore talent from multiple sources using intelligent matching and recommendations."
      cta="Discover Talent"
      visual={<DiscoveryPanel />}
    />
  );
}

/* ── 3. Evaluate fit — talent match insights ──────────────────────────────── */
function FitPanel() {
  const factors = [
    { label: "Skills", score: 95 },
    { label: "Experience", score: 88 },
    { label: "Culture fit", score: 90 },
  ];
  return (
    <Panel gradient="from-violet-200 via-violet-100 to-fuchsia-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[13px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
            AM
          </span>
          <div>
            <p className="text-[14px] font-bold leading-tight text-ink">Alex Morgan</p>
            <p className="text-[12.5px] text-ink-4">Product Engineer</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">92%</p>
          <Label>Overall match</Label>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {factors.map((f) => (
          <div key={f.label}>
            <div className="flex items-center justify-between text-[12.5px] font-semibold">
              <span className="text-ink-2">{f.label}</span>
              <span className="text-ink">{f.score}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${f.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600">
        <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden /> Strong match
      </div>
    </Panel>
  );
}

export function ScoutFit() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      Icon={Sparkles}
      label="Fit Analysis"
      heading={
        <>
          Identify the
          <br />
          <span className="text-orange">Best Matches</span>
        </>
      }
      description="Evaluate people against capabilities, experience, and organizational priorities."
      cta="Review Talent"
      visual={<FitPanel />}
    />
  );
}

/* ── 4. Build talent communities — talent community dashboard ─────────────── */
function CommunityPanel() {
  const pools = [
    { name: "Engineering leaders", count: 42 },
    { name: "Product designers", count: 28 },
    { name: "Future graduates", count: 65 },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Talent communities</Label>
          <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">135</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> Ready for future roles
        </span>
      </div>

      <div className="mt-5 space-y-2">
        {pools.map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span className="flex-1 text-[13px] font-semibold text-ink">{p.name}</span>
            <span className="text-[12.5px] font-bold text-ink-3">{p.count}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ScoutCommunity() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      reverse
      Icon={Users}
      label="Talent Community"
      heading={
        <>
          Build Lasting
          <br />
          <span className="text-orange">Talent Pipelines</span>
        </>
      }
      description="Create curated talent communities for future hiring, growth, and succession needs."
      cta="Build Community"
      visual={<CommunityPanel />}
    />
  );
}

/* ── Hero visual — flagship talent-discovery composite ────────────────────── */
export function ScoutHeroVisual() {
  const results = [
    { initials: "AM", name: "Alex Morgan", role: "Product Engineer", score: 92 },
    { initials: "SC", name: "Sam Carter", role: "Staff Engineer", score: 89 },
    { initials: "JL", name: "Jordan Lee", role: "Senior Engineer", score: 87 },
  ];
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-emerald-200 via-emerald-100 to-teal-200 p-4 shadow-soft sm:p-6 md:p-8">
      <div className="rounded-2xl bg-white p-6 shadow-card md:p-7">
        {/* header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/12 text-emerald-600">
              <Radar className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <p className="text-[14px] font-bold leading-tight text-ink">Talent discovery</p>
              <p className="text-[12px] text-ink-4">Senior Product Engineer</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden /> Live
          </span>
        </div>

        {/* scan stats */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { v: "480", l: "Sourced" },
            { v: "5", l: "Sources" },
            { v: "24", l: "High-fit" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-black/[0.07] bg-cream-2/50 px-3 py-2.5 text-center">
              <p className="text-[20px] font-bold leading-none tracking-[-0.02em] text-ink">{s.v}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ranked results */}
        <div className="mt-4 space-y-2.5">
          {results.map((r) => (
            <div key={r.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white px-3 py-2.5 shadow-[0_2px_10px_-6px_rgba(0,0,0,0.15)]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream-2 text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
                {r.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight text-ink">{r.name}</p>
                <p className="truncate text-[12px] text-ink-4">{r.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-cream-2 sm:block">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${r.score}%` }} />
                </div>
                <span className="text-[12.5px] font-bold text-emerald-600">{r.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
