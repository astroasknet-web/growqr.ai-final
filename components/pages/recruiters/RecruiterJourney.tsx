"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/* ── Scout — Source: channels scanned narrowing into strong leads ─────────── */
function ScoutVisual() {
  const channels = ["Passive candidate pool", "Referral network", "Talent community"];
  return (
    <Panel agent="RQ-Scout">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">340 profiles scanned</span>
        <span className="text-orange">18 strong leads</span>
      </div>
      <div className="mt-3 space-y-2">
        {channels.map((c) => (
          <div key={c} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden />
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{c}</span>
            <Pill tone="green">Sourced</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Vera — Assess: candidates screened down to a verified shortlist ──────── */
function VeraVisual() {
  const shortlist = ["Alex M.", "Sam C.", "Jordan L."];
  return (
    <Panel agent="RQ-Vera">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">26 candidates screened</span>
        <span className="text-orange">Top 3 verified</span>
      </div>
      <div className="mt-3 space-y-2">
        {shortlist.map((name) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{name}</span>
            <Pill tone="green">Verified fit</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Rita — Place: placement pipeline moving toward a confirmed hire ──────── */
function RitaVisual() {
  const milestones = [
    { label: "Submitted to client", state: "done" as const },
    { label: "Client interview", state: "done" as const },
    { label: "Offer extended", state: "active" as const },
    { label: "Placement confirmed", state: "upcoming" as const },
  ];
  return (
    <Panel agent="RQ-Rita">
      <span className="text-[12px] font-semibold text-ink-4">Placement pipeline</span>
      <div className="mt-3 flex flex-col">
        {milestones.map((m, i, arr) => (
          <div key={m.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`h-3 w-3 flex-shrink-0 rounded-full ${
                  m.state === "done"
                    ? "bg-[#16A34A]"
                    : m.state === "active"
                      ? "bg-orange ring-4 ring-orange/15"
                      : "bg-black/[0.12]"
                }`}
                aria-hidden
              />
              {i < arr.length - 1 && <span className="w-px flex-1 bg-black/[0.10]" />}
            </div>
            <span className={`pb-5 text-[13.5px] font-semibold ${m.state === "upcoming" ? "text-ink-4" : "text-ink"}`}>
              {m.label}
              {m.state === "active" && (
                <span className="ml-2 rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Now
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Nova — Grow: positioning, content themes, market credibility ─────────── */
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
            <Pill tone="neutral">Case studies</Pill>
            <Pill tone="neutral">Client wins</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Market credibility</span>
          <Pill tone="green">Rising</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Rohan — Optimize: agency signals becoming a clear next move ──────────── */
function RohanVisual() {
  return (
    <Panel agent="RQ-Rohan">
      <span className="text-[12px] font-semibold text-ink-4">Agency signals</span>
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#16A34A]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Time-to-fill improving</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#D97706]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Client response lagging</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next move</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Follow up with your top 2 clients</p>
      </div>
    </Panel>
  );
}

const STEPS: JourneyStep[] = [
  {
    key: "source",
    stage: "Source",
    agent: "RQ-Scout",
    role: "Opportunity Finder",
    heading: "Find Exceptional Talent.",
    copy: "Beyond the usual shortlist. Scout helps you source qualified talent faster and build stronger pipelines.",
    visual: <ScoutVisual />,
    reverse: true,
  },
  {
    key: "assess",
    stage: "Assess",
    agent: "RQ-Vera",
    role: "Interviewer",
    heading: "Hire With Confidence.",
    copy: "Every shortlist deserves the right evaluation. Vera screens, interviews, and assesses candidates to identify the best fit.",
    visual: <VeraVisual />,
    reverse: false,
  },
  {
    key: "place",
    stage: "Place",
    agent: "RQ-Rita",
    role: "AI Recruiter",
    heading: "Move Placements Faster.",
    copy: "Keep every client, candidate, and opportunity moving. Rita orchestrates recruitment workflows from submission to successful placement.",
    visual: <RitaVisual />,
    reverse: true,
  },
  {
    key: "grow",
    stage: "Grow",
    agent: "RQ-Nova",
    role: "Brand Builder",
    heading: "Win More Business.",
    copy: "Great recruiters deserve to be seen. Nova strengthens your agency's brand, attracts new clients, and builds market credibility.",
    visual: <NovaVisual />,
    reverse: false,
  },
  {
    key: "optimize",
    stage: "Optimize",
    agent: "RQ-Rohan",
    role: "Workforce Analyst",
    heading: "Turn Data Into Direction.",
    copy: "Know where your agency performs best and where to improve. Rohan transforms recruitment data into insights that help you place more candidates and grow your business.",
    visual: <RohanVisual />,
    reverse: true,
  },
];

export default function RecruiterJourney() {
  return (
    <SolutionJourney
      ariaLabel="Source, assess, and place with confidence"
      eyebrow="The Recruiter Journey"
      heading={
        <>
          Source, Place, and Grow with <span className="text-orange">Confidence</span>
        </>
      }
      steps={STEPS}
    />
  );
}
