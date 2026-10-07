"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/* ── Nova — Brand: positioning, content themes, growing credibility ───────── */
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
            <Pill tone="neutral">Behind the scenes</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Credibility</span>
          <Pill tone="green">Growing</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Scout — Opportunities: leads scanned narrowing into premium matches ──── */
function ScoutVisual() {
  const opportunities: { title: string; status: string; tone: "green" | "amber" }[] = [
    { title: "SaaS startup brand redesign", status: "Great fit", tone: "green" },
    { title: "D2C brand content system", status: "Great fit", tone: "green" },
    { title: "Agency ongoing retainer", status: "Reviewing", tone: "amber" },
  ];
  return (
    <Panel agent="RQ-Scout">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">210 leads scanned</span>
        <span className="text-orange">6 premium matches</span>
      </div>
      <div className="mt-3 space-y-2">
        {opportunities.map((o) => (
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

/* ── Eva — Grow: client relationships staying healthy over time ───────────── */
function EvaVisual() {
  const clients: { name: string; status: string; tone: "green" | "amber" }[] = [
    { name: "Nimbus SaaS", status: "Renewed", tone: "green" },
    { name: "Studio Vertex", status: "Check-in due", tone: "amber" },
    { name: "Anchor Retail", status: "Renewed", tone: "green" },
  ];
  return (
    <Panel agent="RQ-Eva">
      <span className="text-[12px] font-semibold text-ink-4">Client relationships</span>
      <div className="mt-3 space-y-2">
        {clients.map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {c.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
            <Pill tone={c.tone}>{c.status}</Pill>
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
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Utilization dipping</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next move</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Raise rates for your next 2 renewals</p>
      </div>
    </Panel>
  );
}

const STEPS: JourneyStep[] = [
  {
    key: "brand",
    stage: "Brand",
    agent: "RQ-Nova",
    role: "Brand Builder",
    heading: "Be the First Choice.",
    copy: "Stand out before the conversation begins. Nova builds your personal brand, visibility, and credibility to attract the right clients.",
    visual: <NovaVisual />,
    reverse: true,
  },
  {
    key: "opportunities",
    stage: "Opportunities",
    agent: "RQ-Scout",
    role: "Opportunity Finder",
    heading: "Find Your Next Client.",
    copy: "The best projects aren't always the loudest. Scout discovers opportunities that match your expertise and ambitions.",
    visual: <ScoutVisual />,
    reverse: false,
  },
  {
    key: "grow",
    stage: "Grow",
    agent: "RQ-Eva",
    role: "Capability Builder",
    heading: "Never Stop Improving.",
    copy: "The best freelancers keep getting better. Eva helps you strengthen your skills, delight clients, and build lasting relationships.",
    visual: <EvaVisual />,
    reverse: true,
  },
  {
    key: "decide",
    stage: "Decide",
    agent: "RQ-Rohan",
    role: "Workforce Analyst",
    heading: "Turn Data Into Direction.",
    copy: "Know what's driving your freelance business. Rohan transforms your business insights into smarter decisions for sustainable growth.",
    visual: <RohanVisual />,
    reverse: false,
  },
];

export default function FreelancerJourney() {
  return (
    <SolutionJourney
      ariaLabel="Attract, deliver, and grow with confidence"
      eyebrow="The Freelancer Journey"
      heading={
        <>
          Attract, Deliver, and Grow With <span className="text-orange">Confidence</span>
        </>
      }
      steps={STEPS}
      ctaLabel="Start Your Journey"
      ctaHref="https://app.growqr.ai/login"
    />
  );
}
