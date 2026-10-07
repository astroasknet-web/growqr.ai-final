"use client";

import { Panel, Pill, SolutionJourney, type JourneyStep } from "@/components/pages/solutions/journeyKit";

/* ── Nova — Brand: positioning, content themes, growing trust ─────────────── */
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
            <Pill tone="neutral">Frameworks</Pill>
            <Pill tone="neutral">Client wins</Pill>
          </div>
        </div>
        <div className="h-px bg-black/[0.05]" />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] font-semibold text-ink-3">Trust</span>
          <Pill tone="green">Growing</Pill>
        </div>
      </div>
    </Panel>
  );
}

/* ── Eva — Coach: personalized coaching plans, per client ──────────────────── */
function EvaVisual() {
  const clients: { name: string; status: string; tone: "green" | "amber" }[] = [
    { name: "Priya K.", status: "On track", tone: "green" },
    { name: "Daniel O.", status: "Needs support", tone: "amber" },
    { name: "Maria S.", status: "On track", tone: "green" },
  ];
  return (
    <Panel agent="RQ-Eva">
      <span className="text-[12px] font-semibold text-ink-4">Personalized coaching plans</span>
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

/* ── Maya — Connect: outreach narrowing into forming partnerships ─────────── */
function MayaVisual() {
  const connections: { title: string; status: string; tone: "green" | "amber" }[] = [
    { title: "Guest podcast feature", status: "Confirmed", tone: "green" },
    { title: "Agency Y referral partner", status: "Active", tone: "green" },
    { title: "Community collaboration", status: "In talks", tone: "amber" },
  ];
  return (
    <Panel agent="RQ-Maya">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[12px] font-semibold">
        <span className="text-ink-4">85 contacts scanned</span>
        <span className="text-orange">5 partnerships forming</span>
      </div>
      <div className="mt-3 space-y-2">
        {connections.map((c) => (
          <div key={c.title} className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-orange" aria-hidden />
            <span className="flex-1 truncate text-[13.5px] font-semibold text-ink">{c.title}</span>
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
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Pipeline depth improving</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-cream-2/50 px-3 py-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#D97706]" aria-hidden />
          <span className="flex-1 text-[13.5px] font-semibold text-ink">Close rate flat</span>
        </div>
      </div>
      <div className="mt-3 rounded-xl border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange">Next move</span>
        <p className="mt-0.5 text-[13.5px] font-semibold text-ink">Follow up with warm leads from last month</p>
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
    heading: "Be Known for Your Expertise.",
    copy: "Trust begins long before the first session. Nova builds your personal brand through compelling content, visibility, and thought leadership.",
    visual: <NovaVisual />,
    reverse: true,
  },
  {
    key: "coach",
    stage: "Coach",
    agent: "RQ-Eva",
    role: "Capability Builder",
    heading: "Create Lasting Impact.",
    copy: "Every client deserves a journey tailored to their goals. Eva helps you design personalized coaching experiences and improve client outcomes.",
    visual: <EvaVisual />,
    reverse: false,
  },
  {
    key: "connect",
    stage: "Connect",
    agent: "RQ-Maya",
    role: "Outsourcing Manager",
    heading: "Reach the Right People.",
    copy: "Every new connection is an opportunity to make a difference. Maya helps you build partnerships, collaborate with experts, and expand your reach.",
    visual: <MayaVisual />,
    reverse: true,
  },
  {
    key: "decide",
    stage: "Decide",
    agent: "RQ-Rohan",
    role: "Workforce Analyst",
    heading: "Turn Data Into Direction.",
    copy: "Know what's driving your coaching business. Rohan transforms business insights into confident decisions that support sustainable growth.",
    visual: <RohanVisual />,
    reverse: false,
  },
];

export default function CoachJourney() {
  return (
    <SolutionJourney
      ariaLabel="Build your brand, transform clients, and grow with confidence"
      eyebrow="The Coach Journey"
      heading={
        <>
          Build Your Brand and Grow With <span className="text-orange">Confidence</span>
        </>
      }
      steps={STEPS}
      ctaLabel="Start Your Journey"
      ctaHref="https://app.growqr.ai/login"
    />
  );
}
