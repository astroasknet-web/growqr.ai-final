"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/** Small right chevron (avoids pulling in an icon set). */
function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 flex-shrink-0 text-ink-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

/* ── Rita — Hire: candidate pool narrowing into a high-fit shortlist ──────── */
function RitaVisual() {
  const shortlist = ["Alex M.", "Sam C.", "Jordan L."];
  return (
    <Panel agent="RQ-Rita">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">48 applicants reviewed</span>
        <span className="text-orange">Top 3 shortlisted</span>
      </div>
      <div className="mt-3 space-y-2">
        {shortlist.map((name) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{name}</span>
            <Pill tone="green">Strong fit</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Rohan — Decide: business signals becoming a clear next move ──────────── */
function RohanVisual() {
  return (
    <Panel agent="RQ-Rohan">
      <span className="text-[12px] font-semibold text-ink-4">Business signals</span>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Revenue trending up</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#D97706]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Support load rising</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next move</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Add support capacity this quarter</p>
      </div>
    </Panel>
  );
}

/* ── Nova — Represent: positioning, content, reputation ───────────────────── */
function NovaVisual() {
  return (
    <Panel agent="RQ-Nova">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Positioning</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Pill tone="neutral">Bold</Pill>
            <Pill tone="neutral">Trusted</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Content themes</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Pill tone="neutral">Leadership</Pill>
            <Pill tone="neutral">Culture</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Reputation</span>
          <Pill tone="green">Growing</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Eva — Develop: skill gaps turning into learning paths ────────────────── */
function EvaVisual() {
  return (
    <Panel agent="RQ-Eva">
      <span className="text-[12px] font-semibold text-ink-4">Skill gap to learning path</span>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Current gap</span>
          <Pill tone="neutral">Leadership</Pill>
          <Pill tone="neutral">Data analysis</Pill>
        </div>
        <Chevron />
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Learning path</span>
          <Pill tone="green">Leadership lab</Pill>
          <Pill tone="green">Analytics track</Pill>
        </div>
      </div>
    </Panel>
  );
}

const STEPS: JourneyStep[] = [
  {
    key: "hire",
    stage: "Hire",
    agent: "RQ-Rita",
    role: "AI Recruiter",
    heading: "Hire Better",
    copy: "Find exceptional talent without the endless back and forth. Rita sources, screens, and streamlines recruitment so every hire starts with confidence.",
    visual: <RitaVisual />,
    reverse: true,
  },
  {
    key: "decide",
    stage: "Decide",
    agent: "RQ-Rohan",
    role: "Workforce Analyst",
    heading: "Decide Faster",
    copy: "Turn business data into decisions that move your company forward. Rohan delivers the insights, intelligence, and clarity leaders need to act with confidence.",
    visual: <RohanVisual />,
    reverse: false,
  },
  {
    key: "represent",
    stage: "Represent",
    agent: "RQ-Nova",
    role: "Brand Builder",
    heading: "Build Trust",
    copy: "Your brand is built through every interaction. Nova strengthens your reputation with compelling communications, thought leadership, and employer branding.",
    visual: <NovaVisual />,
    reverse: true,
  },
  {
    key: "develop",
    stage: "Develop",
    agent: "RQ-Eva",
    role: "Capability Builder",
    heading: "Develop Your People",
    copy: "Great businesses grow because their people do. Eva personalizes learning, coaching, and performance development to help every employee reach their potential.",
    visual: <EvaVisual />,
    reverse: false,
  },
];

export default function EnterpriseJourney() {
  return (
    <SolutionJourney
      ariaLabel="The team behind your team"
      eyebrow="The Enterprise Story"
      heading={
        <>
          One Team Behind Your Whole <span className="text-orange">Business</span>
        </>
      }
      steps={STEPS}
    />
  );
}
