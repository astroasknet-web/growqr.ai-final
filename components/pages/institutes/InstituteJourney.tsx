"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/* ── Nova — Inspire: positioning, content themes, reputation ──────────────── */
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
            <Pill tone="neutral">Success stories</Pill>
            <Pill tone="neutral">Campus life</Pill>
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

/* ── Eva — Develop: personalized learning plans, per learner ──────────────── */
function EvaVisual() {
  const learners: { name: string; status: string; tone: "green" | "amber" }[] = [
    { name: "Priya K.", status: "On track", tone: "green" },
    { name: "Daniel O.", status: "Needs support", tone: "amber" },
    { name: "Maria S.", status: "On track", tone: "green" },
  ];
  return (
    <Panel agent="RQ-Eva">
      <span className="text-[12px] font-semibold text-ink-4">Personalized learning plans</span>
      <div className="mt-3 space-y-2">
        {learners.map((l) => (
          <div key={l.name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {l.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{l.name}</span>
            <Pill tone={l.tone}>{l.status}</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Rohan — Improve: institution signals becoming a clear next move ──────── */
function RohanVisual() {
  return (
    <Panel agent="RQ-Rohan">
      <span className="text-[12px] font-semibold text-ink-4">Institution signals</span>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Engagement trending up</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#D97706]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">At-risk cohort growing</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next move</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Launch targeted tutoring for the at-risk cohort</p>
      </div>
    </Panel>
  );
}

const STEPS: JourneyStep[] = [
  {
    key: "inspire",
    stage: "Inspire",
    agent: "RQ-Nova",
    role: "Institutional Brand",
    heading: "Build A Reputation That Attracts.",
    copy: "Stand out to students, parents, and industry with a stronger institutional presence. Nova helps showcase your institution through branding, communications, and success stories.",
    visual: <NovaVisual />,
    reverse: true,
  },
  {
    key: "develop",
    stage: "Develop",
    agent: "RQ-Eva",
    role: "Teaching & Learning",
    heading: "Every Learner Is Different.",
    copy: "Deliver personalized learning, mentoring, and continuous development at every stage. Eva supports educators with coaching, engagement, and student development.",
    visual: <EvaVisual />,
    reverse: false,
  },
  {
    key: "improve",
    stage: "Improve",
    agent: "RQ-Rohan",
    role: "Academic Intelligence",
    heading: "Know What Needs Attention.",
    copy: "Better decisions begin with better insights. Rohan analyzes academic performance, engagement, and outcomes to help your institution continuously improve.",
    visual: <RohanVisual />,
    reverse: true,
  },
];

export default function InstituteJourney() {
  return (
    <SolutionJourney
      ariaLabel="Inspire, develop, and prepare every learner"
      eyebrow="The Institute Journey"
      heading={
        <>
          Inspire, Develop, and Prepare Every <span className="text-orange">Learner</span>
        </>
      }
      steps={STEPS}
    />
  );
}
