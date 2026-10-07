"use client";

import { type ReactNode } from "react";
import { ClipboardList, MessageSquare, Gauge, Users, Check, Mic } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* Hero image is added separately by the user, so no hero visual lives here. */

/* RQ-Vera — the Interviewer (B2B). Four "How It Works" cards in the shared
   zigzag FeatureRow layout, each paired with a minimal interview-focused
   infographic panel. Vera runs structured, AI-powered interviews that evaluate
   every candidate fairly and consistently. Content from the Vera sample. */

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

/* ── 1. Create interview — interview configuration dashboard ──────────────── */
function SetupPanel() {
  const stages = [
    { label: "Screening", meta: "5 questions" },
    { label: "Role-specific", meta: "6 questions" },
    { label: "Culture fit", meta: "4 questions" },
  ];
  return (
    <Panel gradient="from-rose-200 via-rose-100 to-pink-200">
      <Label>Interview setup</Label>
      <h4 className="mt-1 text-lg font-bold tracking-[-0.01em] text-ink">Senior Product Manager</h4>
      <p className="text-[13px] font-semibold text-ink-3">Behavioral · 45 min</p>

      <div className="mt-5">
        <Label>Competencies</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>Communication</Chip>
          <Chip>Leadership</Chip>
          <Chip>Problem-solving</Chip>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label>Stages</Label>
        {stages.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream-2/60 px-3 py-2.5">
            <span className="text-[13px] font-semibold text-ink">{s.label}</span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-ink-3 ring-1 ring-black/[0.06]">
              {s.meta}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function VeraSetup() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      Icon={ClipboardList}
      label="Interview Setup"
      heading={
        <>
          Create the
          <br />
          <span className="text-orange">Right Interview</span>
        </>
      }
      description="Define the role, interview format, competencies, and questions for every hiring need."
      cta="Create Setup"
      ctaSolid
      visual={<SetupPanel />}
    />
  );
}

/* ── 2. Conduct smart interviews — live AI interview interface ────────────── */
function InterviewPanel() {
  return (
    <Panel gradient="from-violet-200 via-violet-100 to-indigo-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
            AM
          </span>
          <div>
            <p className="text-[13px] font-bold leading-tight text-ink">Alex Morgan</p>
            <p className="text-[12px] text-ink-4">Question 4 of 8</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11.5px] font-bold text-rose-600">
          <Mic className="h-3 w-3" strokeWidth={2.5} aria-hidden /> Live
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-black/[0.07] bg-cream-2/60 px-3.5 py-3">
        <Label>Question</Label>
        <p className="mt-1 text-[13.5px] font-semibold leading-snug text-ink">
          Tell me about a time you led a team through ambiguity.
        </p>
      </div>

      <div className="mt-4">
        <Label>Candidate response</Label>
        <div className="mt-2 space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-cream-2" />
          <div className="h-2.5 w-[88%] rounded-full bg-cream-2" />
          <div className="h-2.5 w-[64%] rounded-full bg-cream-2" />
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11.5px] font-bold text-violet-600">
        Adaptive follow-up ready
      </div>
    </Panel>
  );
}

export function VeraInterview() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      reverse
      Icon={MessageSquare}
      label="AI Interview"
      heading={
        <>
          Conduct
          <br />
          <span className="text-orange">Smart Interviews</span>
        </>
      }
      description="Vera guides candidates through structured interviews with dynamic, context-aware questioning."
      cta="Launch Interview"
      visual={<InterviewPanel />}
    />
  );
}

/* ── 3. Evaluate responses — evaluation scorecard ─────────────────────────── */
function ScorecardPanel() {
  const factors = [
    { label: "Communication", score: 92 },
    { label: "Competency", score: 88 },
    { label: "Role alignment", score: 90 },
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[13px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
            AM
          </span>
          <div>
            <p className="text-[14px] font-bold leading-tight text-ink">Alex Morgan</p>
            <p className="text-[12.5px] text-ink-4">Interview scorecard</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">90</p>
          <Label>Overall</Label>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {factors.map((f) => (
          <div key={f.label}>
            <div className="flex items-center justify-between text-[12.5px] font-semibold">
              <span className="text-ink-2">{f.label}</span>
              <span className="text-ink">{f.score}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${f.score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600">
        <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden /> Recommended
      </div>
    </Panel>
  );
}

export function VeraEvaluate() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      Icon={Gauge}
      label="AI Analysis"
      heading={
        <>
          Evaluate
          <br />
          <span className="text-orange">Every Response</span>
        </>
      }
      description="Analyze communication, competencies, and role alignment using objective AI insights."
      cta="Review Insights"
      visual={<ScorecardPanel />}
    />
  );
}

/* ── 4. Compare candidates — candidate comparison dashboard ───────────────── */
function ComparePanel() {
  const people = [
    { initials: "AM", name: "Alex Morgan", score: 90, top: true },
    { initials: "SC", name: "Sam Carter", score: 84, top: false },
    { initials: "JL", name: "Jordan Lee", score: 79, top: false },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <Label>Candidate comparison</Label>
      <div className="mt-3 space-y-2">
        {people.map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {p.initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">{p.name}</span>
            {p.top && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                Top match
              </span>
            )}
            <span className="w-8 text-right text-[14px] font-bold text-ink">{p.score}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function VeraCompare() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      reverse
      Icon={Users}
      label="Decision Support"
      heading={
        <>
          Compare &amp;
          <br />
          <span className="text-orange">Decide with Confidence</span>
        </>
      }
      description="Review interview summaries, compare applicants, and make informed hiring decisions."
      cta="View Results"
      visual={<ComparePanel />}
    />
  );
}
