"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/* ── Scout — Opportunities: roles scanned narrowing into strong matches ───── */
function ScoutVisual() {
  const roles: { title: string; fit: string; tone: "green" | "amber" }[] = [
    { title: "Senior Product Manager", fit: "92% fit", tone: "green" },
    { title: "Growth Marketing Lead", fit: "88% fit", tone: "green" },
    { title: "UX Researcher", fit: "76% fit", tone: "amber" },
  ];
  return (
    <Panel agent="RQ-Scout">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">3,400 roles scanned</span>
        <span className="text-orange">12 strong matches</span>
      </div>
      <div className="mt-3 space-y-2">
        {roles.map((r) => (
          <div key={r.title} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden />
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{r.title}</span>
            <Pill tone={r.tone}>{r.fit}</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ── Mira — Profile: a generic profile turning into one that gets noticed ─── */
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
          <Pill tone="neutral">Generic resume</Pill>
          <Pill tone="neutral">Outdated LinkedIn</Pill>
        </div>
        <Chevron />
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">After</span>
          <Pill tone="green">ATS-tailored</Pill>
          <Pill tone="green">Story-led profile</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Vera — Interviews: practice sessions with real feedback ──────────────── */
function VeraVisual() {
  const scores: { label: string; status: string; tone: "green" | "amber" }[] = [
    { label: "Communication", status: "Strong", tone: "green" },
    { label: "Technical depth", status: "Improving", tone: "amber" },
    { label: "Confidence", status: "Strong", tone: "green" },
  ];
  return (
    <Panel agent="RQ-Vera">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">Mock interview #4</span>
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

/* ── Nova — Brand: positioning, content themes, growing reputation ────────── */
function NovaVisual() {
  return (
    <Panel agent="RQ-Nova">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Positioning</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Pill tone="neutral">Bold</Pill>
            <Pill tone="neutral">Credible</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Content themes</span>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Pill tone="neutral">Expertise</Pill>
            <Pill tone="neutral">Wins</Pill>
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

const STEPS: JourneyStep[] = [
  {
    key: "opportunities",
    stage: "Opportunities",
    agent: "RQ-Scout",
    role: "Opportunity Finder",
    heading: "Find the Right Opportunity.",
    copy: "Not every opportunity is worth pursuing. Scout discovers roles that match your ambitions, skills, and long-term career goals.",
    visual: <ScoutVisual />,
    reverse: true,
  },
  {
    key: "profile",
    stage: "Profile",
    agent: "RQ-Mira",
    role: "Resume Expert",
    heading: "Stand Out With Confidence.",
    copy: "Your profile should speak before you do. Mira strengthens your resume, LinkedIn, and professional story to help you get noticed.",
    visual: <MiraVisual />,
    reverse: false,
  },
  {
    key: "interviews",
    stage: "Interviews",
    agent: "RQ-Vera",
    role: "Interviewer",
    heading: "Walk in Prepared.",
    copy: "Confidence comes from preparation. Vera helps you practice interviews, receive personalized feedback, and perform at your best.",
    visual: <VeraVisual />,
    reverse: true,
  },
  {
    key: "brand",
    stage: "Brand",
    agent: "RQ-Nova",
    role: "Brand Builder",
    heading: "Be Known for Your Expertise.",
    copy: "Your reputation grows beyond your job title. Nova builds your professional brand through content, visibility, and thought leadership.",
    visual: <NovaVisual />,
    reverse: false,
  },
];

export default function ProfessionalJourney() {
  return (
    <SolutionJourney
      ariaLabel="Find, prepare for, and grow into what's next"
      eyebrow="The Professional Journey"
      heading={
        <>
          Find, Prepare For, and Grow Into What&apos;s <span className="text-orange">Next</span>
        </>
      }
      steps={STEPS}
      ctaLabel="Start Your Journey"
      ctaHref="https://app.growqr.ai/login"
    />
  );
}
