"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/* ── Scout — Discover: internships and opportunities scanned into matches ─── */
function ScoutVisual() {
  const internships: { title: string; status: string; tone: "green" | "amber" }[] = [
    { title: "Product Intern · Nimbus", status: "Great fit", tone: "green" },
    { title: "UX Research Intern", status: "Great fit", tone: "green" },
    { title: "Growth Intern · Remote", status: "Reviewing", tone: "amber" },
  ];
  return (
    <Panel agent="RQ-Scout">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">1,200 internships scanned</span>
        <span className="text-orange">8 strong matches</span>
      </div>
      <div className="mt-3 space-y-2">
        {internships.map((o) => (
          <div key={o.title} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden />
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{o.title}</span>
            <Pill tone={o.tone}>{o.status}</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Mira — Profile: a first resume turning into one that gets noticed ────── */
function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 flex-shrink-0 text-ink-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function MiraVisual() {
  return (
    <Panel agent="RQ-Mira">
      <span className="text-[12px] font-semibold text-ink-4">Profile, before and after</span>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Before</span>
          <Pill tone="neutral">No resume yet</Pill>
          <Pill tone="neutral">Empty LinkedIn</Pill>
        </div>
        <Chevron />
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">After</span>
          <Pill tone="green">ATS-ready resume</Pill>
          <Pill tone="green">Recruiter-ready profile</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Sage — Learn: strengths and gaps turned into a trainable plan ────────── */
function SageVisual() {
  const skills: { label: string; status: string; tone: "green" | "amber" }[] = [
    { label: "Communication", status: "Strong", tone: "green" },
    { label: "SQL basics", status: "Gap", tone: "amber" },
    { label: "Data storytelling", status: "Building", tone: "amber" },
  ];
  return (
    <Panel agent="RQ-Sage">
      <span className="text-[12px] font-semibold text-ink-4">Skill readiness</span>
      <div className="mt-3 space-y-2">
        {skills.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{s.label}</span>
            <Pill tone={s.tone}>{s.status}</Pill>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next up</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Close SQL basics in 3 short modules</p>
      </div>
    </Panel>
  );
}

/* ── Vera — Interviews: practice sessions with real, constructive feedback ── */
function VeraVisual() {
  const scores: { label: string; status: string; tone: "green" | "amber" }[] = [
    { label: "Communication", status: "Strong", tone: "green" },
    { label: "Technical basics", status: "Improving", tone: "amber" },
    { label: "Confidence", status: "Strong", tone: "green" },
  ];
  return (
    <Panel agent="RQ-Vera">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">Mock interview #1</span>
        <span className="text-orange">Feedback ready</span>
      </div>
      <div className="mt-3 space-y-2">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{s.label}</span>
            <Pill tone={s.tone}>{s.status}</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const STEPS: JourneyStep[] = [
  {
    key: "discover",
    stage: "Discover",
    agent: "RQ-Scout",
    role: "Opportunity Finder",
    heading: "Find the Right Opportunities.",
    copy: "Every career begins with the right direction. Scout helps you discover internships, jobs, and opportunities aligned with your goals.",
    visual: <ScoutVisual />,
    reverse: true,
  },
  {
    key: "profile",
    stage: "Profile",
    agent: "RQ-Mira",
    role: "Resume Expert",
    heading: "Make Your First Impression Count.",
    copy: "Stand out before the conversation begins. Mira builds resumes, portfolios, and professional profiles that open doors.",
    visual: <MiraVisual />,
    reverse: false,
  },
  {
    key: "learn",
    stage: "Learn",
    agent: "RQ-Sage",
    role: "Skill Trainer",
    heading: "Build Skills That Matter.",
    copy: "Success starts with continuous learning. Sage helps you develop industry-relevant skills through personalized learning journeys.",
    visual: <SageVisual />,
    reverse: true,
  },
  {
    key: "interviews",
    stage: "Interviews",
    agent: "RQ-Vera",
    role: "Interviewer",
    heading: "Walk in Prepared.",
    copy: "Preparation turns potential into confidence. Vera helps you practice interviews, receive personalized feedback, and improve with every attempt.",
    visual: <VeraVisual />,
    reverse: false,
  },
];

export default function StudentJourney() {
  return (
    <SolutionJourney
      ariaLabel="Discover, prepare, and grow with confidence"
      eyebrow="The Student Journey"
      heading={
        <>
          AI Experts Helping You <span className="text-orange">Succeed With Confidence</span>
        </>
      }
      steps={STEPS}
      ctaLabel="Start Your Journey"
      ctaHref="https://app.growqr.ai/login"
    />
  );
}
