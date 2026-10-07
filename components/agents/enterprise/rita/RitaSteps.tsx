"use client";

import { type ReactNode } from "react";
import {
  Target,
  Workflow,
  CalendarDays,
  TrendingUp,
  Check,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Rita — the AI Recruiter. Four "How It Works" steps in the shared zigzag
   FeatureRow layout, each paired with a minimal, premium mockup panel that
   mirrors the recipe used across the individual agent pages. Rita sells
   structure: turn hiring into one coordinated workflow. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Design the role ──────────────────────────────────────────────────── */
function RolePanel() {
  const responsibilities = ["Own product roadmap", "Lead cross-functional squad", "Drive quarterly outcomes"];
  const skills = ["Product Strategy", "Analytics", "Stakeholder Mgmt"];
  return (
    <Panel gradient="from-blue-200 via-blue-100 to-sky-200">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Role definition</div>
      <h4 className="mt-1 text-lg font-bold tracking-[-0.01em] text-ink">Senior Product Manager</h4>

      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Responsibilities</div>
        <div className="mt-2 space-y-2">
          {responsibilities.map((r) => (
            <p key={r} className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-orange text-white">
                <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden />
              </span>
              {r}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Required skills</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="rounded-full bg-cream-2 px-3 py-1 text-[12px] font-semibold text-ink-2">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function RitaRole() {
  return (
    <FeatureRow
      agentName="RQ-Rita"
      Icon={Target}
      label="Role Planning"
      heading={
        <>
          Design the Perfect Role
          <br />
          <span className="text-orange">Lay the Right Foundation</span>
        </>
      }
      description="Define the ideal role with clear responsibilities, expectations, and success criteria."
      cta="Define Role"
      ctaSolid
      visual={<RolePanel />}
    />
  );
}

/* ── 2. Build the blueprint ──────────────────────────────────────────────── */
function BlueprintPanel() {
  const stages = [
    { label: "Screening", done: true },
    { label: "Technical Round", done: true },
    { label: "Panel Interview", done: false },
    { label: "Final & Offer", done: false },
  ];
  return (
    <Panel gradient="from-indigo-200 via-indigo-100 to-blue-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Hiring blueprint</h4>
      <div className="mt-5 space-y-2.5">
        {stages.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              s.done ? "border-orange/40 bg-orange-lighter/70" : "border-black/[0.07] bg-cream-2/60"
            }`}
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                s.done ? "bg-orange text-white" : "bg-white text-ink-3 ring-1 ring-black/[0.06]"
              }`}
            >
              {i + 1}
            </span>
            <span className="text-[13px] font-semibold text-ink">{s.label}</span>
            <span className="ml-auto text-[11px] font-bold uppercase tracking-[0.06em] text-ink-4">
              {s.done ? "Set" : "Draft"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Scorecard</span>
        <span className="rounded-full bg-orange px-3 py-1 text-[12px] font-bold text-white">5 competencies</span>
      </div>
    </Panel>
  );
}

export function RitaBlueprint() {
  return (
    <FeatureRow
      agentName="RQ-Rita"
      reverse
      Icon={Workflow}
      label="Hiring Blueprint"
      heading={
        <>
          Build the
          <br />
          <span className="text-orange">Hiring Blueprint</span>
        </>
      }
      description="Create a structured hiring blueprint with competencies, interview stages, and evaluation criteria."
      cta="Build Blueprint"
      visual={<BlueprintPanel />}
    />
  );
}

/* ── 3. Coordinate interviews ────────────────────────────────────────────── */
function SchedulePanel() {
  const slots = [
    { name: "Alex Morgan", role: "Panel · Design", time: "Mon 10:00" },
    { name: "Sam Carter", role: "Technical · Eng", time: "Mon 14:30" },
    { name: "Jordan Lee", role: "Final · Leadership", time: "Tue 11:00" },
  ];
  return (
    <Panel gradient="from-violet-200 via-purple-100 to-fuchsia-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Interview schedule</h4>
        <CalendarDays className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {slots.map((s) => (
          <div key={s.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {s.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{s.name}</p>
              <p className="text-[12px] text-ink-4">{s.role}</p>
            </div>
            <span className="rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-semibold text-ink-2 shadow-card">
              {s.time}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RitaCoordinate() {
  return (
    <FeatureRow
      agentName="RQ-Rita"
      Icon={CalendarDays}
      label="Process Coordination"
      heading={
        <>
          Coordinate
          <br />
          <span className="text-orange">Every Interview</span>
        </>
      }
      description="Manage interview schedules, panels, communication, and hiring progress from one place."
      cta="Coordinate Hiring"
      visual={<SchedulePanel />}
    />
  );
}

/* ── 4. Drive hiring forward ─────────────────────────────────────────────── */
function PipelinePanel() {
  const rows = [
    { name: "Alex Morgan", stage: "Offer", pct: 90 },
    { name: "Sam Carter", stage: "Panel", pct: 65 },
    { name: "Jordan Lee", stage: "Final", pct: 80 },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Time to offer</div>
          <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">12 days</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden /> On track
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-bold text-ink">{r.name}</span>
              <span className="font-semibold text-ink-4">{r.stage}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-2">
              <div className="h-full rounded-full bg-orange" style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RitaExecute() {
  return (
    <FeatureRow
      agentName="RQ-Rita"
      reverse
      Icon={TrendingUp}
      label="Execution"
      heading={
        <>
          Drive Hiring
          <br />
          <span className="text-orange">Forward</span>
        </>
      }
      description="Track feedback, remove bottlenecks, and keep every hiring decision moving to completion."
      cta="Track Progress"
      visual={<PipelinePanel />}
    />
  );
}
