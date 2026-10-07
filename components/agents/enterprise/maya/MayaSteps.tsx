"use client";

import { type ReactNode } from "react";
import {
  ClipboardList,
  Users,
  RefreshCw,
  Send,
  Check,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Maya — the Outsourcing Manager. Four "How It Works" steps in the shared
   zigzag FeatureRow layout, each paired with a minimal mockup panel. Maya
   sells readiness: a warm freelance bench, matched the moment you need it. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Identify required skills ─────────────────────────────────────────── */
function NeedsPanel() {
  const needs = [
    { skill: "Motion Design", count: 2 },
    { skill: "React Native", count: 3 },
    { skill: "Copywriting", count: 1 },
  ];
  return (
    <Panel gradient="from-slate-200 via-slate-100 to-zinc-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Skill requirements</h4>
        <ClipboardList className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {needs.map((n) => (
          <div key={n.skill} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="text-[13px] font-semibold text-ink">{n.skill}</span>
            <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {n.count} needed
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Upcoming demand</span>
        <span className="rounded-full bg-orange px-3 py-1 text-[12px] font-bold text-white">Q3 projects</span>
      </div>
    </Panel>
  );
}

export function MayaNeeds() {
  return (
    <FeatureRow
      agentName="RQ-Maya"
      Icon={ClipboardList}
      label="Talent Needs"
      heading={
        <>
          Identify
          <br />
          <span className="text-orange">Required Skills</span>
        </>
      }
      description="Define the capabilities and expertise your business needs."
      cta="Define Needs"
      ctaSolid
      visual={<NeedsPanel />}
    />
  );
}

/* ── 2. Build future-ready talent pools ──────────────────────────────────── */
function BenchPanel() {
  const people = [
    { name: "Riley Chen", skill: "Motion Design", status: "Vetted" },
    { name: "Lena Park", skill: "React Native", status: "Vetted" },
    { name: "Diego Alvarez", skill: "Copywriting", status: "New" },
  ];
  return (
    <Panel gradient="from-indigo-200 via-indigo-100 to-blue-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Talent bench</h4>
        <Users className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {people.map((p) => (
          <div key={p.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {p.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{p.name}</p>
              <p className="text-[12px] text-ink-4">{p.skill}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                p.status === "Vetted" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function MayaBench() {
  return (
    <FeatureRow
      agentName="RQ-Maya"
      reverse
      Icon={Users}
      label="Talent Strategy"
      heading={
        <>
          Build Future Ready
          <br />
          <span className="text-orange">Talent Pools</span>
        </>
      }
      description="Build a curated bench of trusted freelancers and partners."
      cta="Build Bench"
      visual={<BenchPanel />}
    />
  );
}

/* ── 3. Keep talent updated ──────────────────────────────────────────────── */
function ReadyPanel() {
  const roster = [
    { name: "Riley Chen", avail: "Available", dot: "bg-emerald-500" },
    { name: "Lena Park", avail: "Booked to Aug 12", dot: "bg-amber-500" },
    { name: "Diego Alvarez", avail: "Available", dot: "bg-emerald-500" },
  ];
  return (
    <Panel gradient="from-cyan-200 via-cyan-100 to-teal-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Availability</h4>
        <RefreshCw className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 space-y-2.5">
        {roster.map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.dot}`} aria-hidden />
            <span className="text-[13px] font-semibold text-ink">{r.name}</span>
            <span className="ml-auto text-[11.5px] font-semibold text-ink-4">{r.avail}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Bench kept warm</span>
        <span className="text-[13px] font-bold text-ink">Auto-synced</span>
      </div>
    </Panel>
  );
}

export function MayaReady() {
  return (
    <FeatureRow
      agentName="RQ-Maya"
      Icon={RefreshCw}
      label="Stay Ready"
      heading={
        <>
          Keep Talent
          <br />
          <span className="text-orange">Updated</span>
        </>
      }
      description="Track availability, expertise, and engagement in one place."
      cta="Update Bench"
      visual={<ReadyPanel />}
    />
  );
}

/* ── 4. Assign the right experts ─────────────────────────────────────────── */
function DeployPanel() {
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Project match</h4>
        <Send className="h-5 w-5 text-orange" strokeWidth={2.2} aria-hidden />
      </div>
      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream-2/60 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Brief</p>
        <p className="mt-1 text-[13.5px] font-bold text-ink">App launch — motion &amp; RN build</p>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <span className="text-[18px] text-ink-4" aria-hidden>↓</span>
      </div>
      <div className="space-y-2.5">
        {[
          { name: "Riley Chen", role: "Motion Design", fit: "96%" },
          { name: "Lena Park", role: "React Native", fit: "91%" },
        ].map((m) => (
          <div key={m.name} className="flex items-center gap-3 rounded-xl border border-orange/30 bg-orange-lighter/60 p-3">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange text-white">
              <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{m.name}</p>
              <p className="text-[12px] text-ink-4">{m.role}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-orange-deep shadow-card">
              {m.fit} fit
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function MayaDeploy() {
  return (
    <FeatureRow
      agentName="RQ-Maya"
      reverse
      Icon={Send}
      label="Deploy Talent"
      heading={
        <>
          Assign the
          <br />
          <span className="text-orange">Right Experts</span>
        </>
      }
      description="Quickly match projects with the best available external talent."
      cta="Deploy Talent"
      visual={<DeployPanel />}
    />
  );
}
