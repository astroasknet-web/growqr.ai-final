"use client";

import { type ReactNode } from "react";
import {
  SlidersHorizontal,
  Radar,
  Sparkles,
  Columns2,
  Send,
  TrendingUp,
  Check,
  FileText,
  Building2,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";
import { Ring } from "@/components/agents/directory/AgentShowcase";

/* RQ-Scout — the Opportunity Finder. Five "How It Works" steps, each a FeatureRow
   with a minimal, premium mockup panel that follows the shared recipe:
   soft-gradient frame -> white card -> generous whitespace, very little text.
   RQ-Scout sells fit, not more listings: define what you want, search everywhere,
   see the best matches, compare, and apply with confidence. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* A tiny brand mark: a colored rounded square with the company initial. */
function Logo({ letter, tone }: { letter: string; tone: string }) {
  return (
    <span
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-white ${tone}`}
    >
      {letter}
    </span>
  );
}

/* ── 1. Define your ideal opportunity ────────────────────────────────────── */
function DefinePanel() {
  const fields = [
    { label: "Target role", value: "Product Designer" },
    { label: "Experience", value: "Mid-level" },
    { label: "Location", value: "Remote" },
  ];
  const modes = [
    { label: "Remote", on: true },
    { label: "Hybrid", on: true },
    { label: "Onsite", on: false },
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Your ideal role</h4>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Preferences
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-center justify-between rounded-lg bg-cream-2/70 px-3.5 py-2.5"
          >
            <span className="text-[12px] font-medium text-ink-4">{f.label}</span>
            <span className="text-[13px] font-semibold text-ink">{f.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Work mode</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {modes.map((m) => (
            <span
              key={m.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${
                m.on
                  ? "bg-orange text-white"
                  : "border border-black/[0.08] bg-cream-2/60 text-ink-4"
              }`}
            >
              {m.on && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function ScoutDefine() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      Icon={SlidersHorizontal}
      label="Define your fit"
      heading={
        <>
          Start With What
          <br />
          <span className="text-orange">Actually Fits You</span>
        </>
      }
      description="Tell RQ-Scout the role, location, pay, and priorities that matter, so it hunts for fit, not noise."
      cta="Set my preferences"
      ctaSolid
      visual={<DefinePanel />}
    />
  );
}

/* ── 2. RQ-Scout every opportunity ──────────────────────────────────────────── */
function ScanPanel() {
  const sources = [
    { name: "LinkedIn", tone: "bg-[#0A66C2]", letter: "in", state: "done" as const },
    { name: "Company sites", tone: "bg-emerald-600", letter: "co", state: "scan" as const },
  ];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Scanning sources</h4>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Radar className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Live
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {sources.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 rounded-lg bg-cream-2/70 px-3 py-2.5"
          >
            <Logo letter={s.letter} tone={s.tone} />
            <span className="flex-1 text-[13px] font-semibold text-ink">{s.name}</span>
            {s.state === "done" && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
            )}
            {s.state === "scan" && (
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-orange-deep">
                Scanning
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="flex items-center justify-between text-[12px] font-medium text-ink-4">
          <span>Search progress</span>
          <span>72%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-2">
          <div className="h-full w-[72%] rounded-full bg-sky-500" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">1,248</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">
              Opportunities found
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12.5px] font-bold text-emerald-600">
            <Building2 className="h-4 w-4" strokeWidth={2.4} aria-hidden /> 320 companies
          </span>
        </div>
      </div>
    </Panel>
  );
}

export function ScoutScan() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      reverse
      Icon={Radar}
      label="Search everywhere"
      heading={
        <>
          Endless Opportunities,
          <br />
          <span className="text-orange">One Application Hub</span>
        </>
      }
      description="RQ-Scout searches every source at once, so no great opportunity slips past you."
      cta="RQ-Scout for me"
      visual={<ScanPanel />}
    />
  );
}

/* ── 3. Find your best matches ───────────────────────────────────────────── */
function MatchPanel() {
  const rows = [
    { label: "Skills match", value: "9 of 10" },
    { label: "Salary", value: "$124k" },
    { label: "Work mode", value: "Remote" },
  ];
  const others = [
    { role: "Senior Designer", company: "Notion", tone: "bg-ink", letter: "N", score: 88 },
  ];
  return (
    <Panel gradient="from-blue-200 via-blue-100 to-indigo-200">
      {/* top match, highlighted */}
      <div className="rounded-2xl border border-orange/25 bg-orange-lighter/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo letter="L" tone="bg-emerald-600" />
            <div>
              <p className="text-[14px] font-bold leading-tight text-ink">Product Designer</p>
              <p className="text-[12px] text-ink-4">Linear</p>
            </div>
          </div>
          <div className="relative shrink-0">
            <Ring value={94} size={54} stroke={6} color="#FF6A2F" />
            <span className="absolute inset-0 grid place-items-center text-[15px] font-bold text-ink">
              94
            </span>
          </div>
        </div>
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg bg-white px-2.5 py-2 text-center shadow-card">
              <p className="text-[13px] font-bold text-ink">{r.value}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-4">
                {r.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden /> High growth potential
        </div>
      </div>

      {/* ranked runners-up */}
      <div className="mt-3 space-y-2.5">
        {others.map((o) => (
          <div
            key={o.company}
            className="flex items-center gap-3 rounded-xl bg-cream-2/70 px-3 py-2.5"
          >
            <Logo letter={o.letter} tone={o.tone} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight text-ink">{o.role}</p>
              <p className="text-[11.5px] text-ink-4">{o.company}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-ink shadow-card">
              {o.score}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ScoutMatch() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      Icon={Sparkles}
      label="Best matches"
      heading={
        <>
          See Which Roles
          <br />
          <span className="text-orange">Deserve Your Time</span>
        </>
      }
      description="Each opportunity gets a match score, so the best-fit roles rise to the top."
      cta="See my matches"
      visual={<MatchPanel />}
    />
  );
}

/* ── 4. Compare before you decide ────────────────────────────────────────── */
function ComparePanel() {
  const rows = [
    { label: "Compensation", a: "$124k", b: "$112k" },
    { label: "Growth", a: "High", b: "Medium" },
    { label: "Benefits", a: "Strong", b: "Standard" },
  ];
  return (
    <Panel gradient="from-violet-200 via-purple-100 to-violet-200">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
        <Columns2 className="h-4 w-4 text-orange" strokeWidth={2.4} aria-hidden /> Side by side
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { company: "Linear", letter: "L", tone: "bg-emerald-600", best: true },
          { company: "Notion", letter: "N", tone: "bg-ink", best: false },
        ].map((c) => (
          <div
            key={c.company}
            className={`rounded-xl border p-3 text-center ${
              c.best ? "border-orange/30 bg-orange-lighter/50" : "border-black/[0.07] bg-cream-2/60"
            }`}
          >
            <div className="flex flex-col items-center gap-1.5">
              <Logo letter={c.letter} tone={c.tone} />
              <p className="text-[13px] font-bold text-ink">{c.company}</p>
              {c.best && (
                <span className="rounded-full bg-orange px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
                  Best fit
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-cream-2/70 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-4">
                {r.label}
              </p>
              <p className="mt-0.5 text-[13px] font-bold text-ink">{r.a}</p>
            </div>
            <div className="rounded-lg bg-cream-2/70 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-4">
                {r.label}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold text-ink-3">{r.b}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ScoutCompare() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      reverse
      Icon={Columns2}
      label="Compare with clarity"
      heading={
        <>
          Choose What Is
          <br />
          <span className="text-orange">Right for You</span>
        </>
      }
      description="Line up compensation, growth, and benefits side by side so the right career move is obvious."
      cta="Compare offers"
      visual={<ComparePanel />}
    />
  );
}

/* ── 5. Apply with confidence ────────────────────────────────────────────── */
function ApplyPanel() {
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex flex-col items-center py-4 text-center">
        {/* one bold focal visual: the application, sent */}
        <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-orange to-orange-dark shadow-[0_18px_44px_-12px_rgba(255,106,47,0.65)]">
          <Send className="h-12 w-12 text-white" strokeWidth={1.9} aria-hidden />
        </div>

        <p className="mt-6 text-[24px] font-bold tracking-[-0.02em] text-ink">Application sent</p>
        <p className="mt-1.5 text-[14px] text-ink-4">Product Designer · Linear</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]">
            <FileText className="h-4 w-4 text-orange" strokeWidth={2.4} aria-hidden /> Resume attached
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]">
            <Sparkles className="h-4 w-4 text-orange" strokeWidth={2.4} aria-hidden /> Interview ready
          </span>
        </div>
      </div>
    </Panel>
  );
}

export function ScoutApply() {
  return (
    <FeatureRow
      agentName="RQ-Scout"
      Icon={Send}
      label="Apply with confidence"
      heading={
        <>
          Apply Faster to Roles
          <br />
          <span className="text-orange">Built for You</span>
        </>
      }
      description="Your matched roles come ready to apply, with your resume already attached."
      cta="Start applying"
      visual={<ApplyPanel />}
    />
  );
}
