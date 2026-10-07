"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import { ScanLine, Target, Route, TrendingUp, Check } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";
import { Ring } from "@/components/agents/directory/AgentShowcase";

/* RQ-Sage — the Skill Trainer. Four "How It Works" steps, each a FeatureRow with a
   minimal, premium mockup panel that follows the shared recipe:
   soft-gradient frame -> white card -> generous whitespace, very little text.
   RQ-Sage sells direction and clarity, not courses. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* One consistent identity used across the profile-focused steps. */
const PROFILE = {
  name: "John Carter",
  title: "Product Marketing Manager",
  img: "/agent-subpage/sample/john.jpg",
};

function ProfileHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={PROFILE.img}
        alt={PROFILE.name}
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]"
      />
      <div className="min-w-0">
        <p className="text-[14px] font-bold leading-tight text-ink">{PROFILE.name}</p>
        <p className="text-[12px] text-ink-4">{PROFILE.title}</p>
      </div>
    </div>
  );
}

/* ── 1. Understand you ───────────────────────────────────────────────────── */
function UnderstandPanel() {
  const rows = ["Resume", "LinkedIn profile", "Career goals"];
  return (
    <Panel gradient="from-blue-200 via-blue-100 to-sky-200">
      <div className="flex items-center justify-between gap-3">
        <ProfileHeader />
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <ScanLine className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Analyzing
        </span>
      </div>
      <div className="mt-5 space-y-2.5">
        {rows.map((r) => (
          <div key={r} className="flex items-center justify-between rounded-lg bg-cream-2/70 px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-ink-2">{r}</span>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="flex items-center justify-between text-[12px] font-medium text-ink-4">
          <span>Building your profile</span>
          <span>100%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-2">
          <div className="h-full w-full rounded-full bg-emerald-500" />
        </div>
      </div>
    </Panel>
  );
}

export function SageUnderstand() {
  return (
    <FeatureRow
      agentName="RQ-Sage"
      Icon={ScanLine}
      label="Learns about you"
      heading={
        <>
          Start With a Clear
          <br />
          <span className="text-orange">Picture of You</span>
        </>
      }
      description="RQ-Sage reads your resume, profile, and goals to understand exactly where you are today."
      cta="Analyze my profile"
      ctaSolid
      visual={<UnderstandPanel />}
    />
  );
}

/* ── 2. Find skill gaps ──────────────────────────────────────────────────── */
function GapsPanel() {
  const strengths = ["Communication", "Product sense"];
  const gaps = [
    { label: "Data analysis", tone: "warn" as const },
    { label: "System design", tone: "bad" as const },
  ];
  const toneDot = { warn: "bg-amber-500", bad: "bg-rose-500" };
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
            Overall skill score
          </div>
          <p className="mt-1 text-[14px] font-semibold text-ink">Room to grow into your target role</p>
        </div>
        <div className="relative shrink-0">
          <Ring value={68} size={60} stroke={7} color="#F59E0B" />
          <span className="absolute inset-0 grid place-items-center text-[16px] font-bold text-ink">68</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">Strengths</div>
          <div className="mt-2 space-y-1.5">
            {strengths.map((s) => (
              <p key={s} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} aria-hidden /> {s}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.07] bg-cream-2/60 p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Skill gaps</div>
          <div className="mt-2 space-y-1.5">
            {gaps.map((g) => (
              <p key={g.label} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <span className={`h-2 w-2 rounded-full ${toneDot[g.tone]}`} /> {g.label}
              </p>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function SageGaps() {
  return (
    <FeatureRow
      agentName="RQ-Sage"
      reverse
      Icon={Target}
      label="Skill gaps"
      heading={
        <>
          Get Clarity On
          <br />
          <span className="text-orange">Where You Stand</span>
        </>
      }
      description="RQ-Sage maps your strengths against your goals and pinpoints the gaps holding you back."
      cta="Find my gaps"
      visual={<GapsPanel />}
    />
  );
}

/* ── 3. Create your roadmap ──────────────────────────────────────────────── */
function RoadmapPanel() {
  const milestones = [
    { title: "SQL fundamentals", state: "done" as const },
    { title: "Product analytics", state: "active" as const },
    { title: "System design", state: "todo" as const },
  ];
  return (
    <Panel gradient="from-purple-200 via-purple-100 to-violet-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Your learning roadmap</h4>
      <div className="mt-5 space-y-3">
        {milestones.map((m, i) => {
          const done = m.state === "done";
          const active = m.state === "active";
          return (
            <div key={m.title} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-orange text-white"
                      : "bg-cream-2 text-ink-4"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <div
                className={`flex-1 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold ${
                  active
                    ? "border border-orange/25 bg-orange-lighter/70 text-ink"
                    : "bg-cream-2/70 text-ink-2"
                }`}
              >
                {m.title}
                {active && <span className="ml-2 text-[11px] font-bold text-orange-deep">In progress</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-orange-deep">Today&apos;s tasks</div>
        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-2 text-[13px] text-ink-2">
            <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-orange" /> Cohort analysis exercise
          </p>
          <p className="flex items-center gap-2 text-[13px] text-ink-2">
            <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-orange" /> 10-min skill quiz
          </p>
        </div>
      </div>
    </Panel>
  );
}

export function SageRoadmap() {
  return (
    <FeatureRow
      agentName="RQ-Sage"
      Icon={Route}
      label="Your roadmap"
      heading={
        <>
          Get a Plan
          <br />
          <span className="text-orange">Built Around You</span>
        </>
      }
      description="RQ-Sage turns your gaps into a personalized roadmap with daily tasks that fit your goals."
      cta="Build my plan"
      visual={<RoadmapPanel />}
    />
  );
}

/* ── 4. Practice & track growth ──────────────────────────────────────────── */
function GrowthPanel() {
  const wins = ["3 gaps closed", "Interview-ready"];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex flex-col items-center py-2 text-center">
        {/* one bold focal visual: the skill score reaching its goal */}
        <div className="relative">
          <Ring value={91} size={150} stroke={13} color="#FF6A2F" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[42px] font-bold leading-none tracking-[-0.03em] text-ink">91</span>
            <span className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-4">
              Skill score
            </span>
          </div>
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-600">
          <TrendingUp className="h-4 w-4" strokeWidth={2.75} aria-hidden /> +23 this month
        </span>

        <p className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-ink">You&apos;re job ready</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {wins.map((w) => (
            <span
              key={w}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]"
            >
              <Check className="h-3.5 w-3.5 text-orange" strokeWidth={3} aria-hidden /> {w}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function SageGrowth() {
  return (
    <FeatureRow
      agentName="RQ-Sage"
      reverse
      Icon={TrendingUp}
      label="Measure Growth"
      heading={
        <>
          Get Ready for the
          <br />
          <span className="text-orange">Role You Deserve</span>
        </>
      }
      description="Complete assessments and practice as RQ-Sage tracks your progress toward every goal."
      cta="Track my growth"
      visual={<GrowthPanel />}
    />
  );
}
