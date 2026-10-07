"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { agents } from "@/lib/data";
import { AgentName } from "@/components/ui/AgentName";
import { Eyebrow, SectionHeading } from "./SectionHeader";

const ease = [0.22, 1, 0.36, 1] as const;

/** Real agents are the single source of truth for brand colors + avatars. */
const byName = Object.fromEntries(agents.map((a) => [a.name, a]));

/** hex → rgba so one brand color drives both the soft circle fill and ring. */
const tint = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/** Agent portrait on a brand-tinted circle — uses each agent's real photo
 *  (the same `image` the Squad cards use), falling back to tinted initials. */
function AgentAvatar({ name, className, sizes }: { name: string; className: string; sizes: string }) {
  const a = byName[name];
  return (
    <span
      className={`relative flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.18)] ${className}`}
      style={{ backgroundColor: a ? tint(a.color, 0.16) : undefined }}
    >
      {a?.image ? (
        <Image src={a.image} alt={a.name} fill sizes={sizes} className="object-cover object-center" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold" style={{ color: a?.color }}>
          {a?.initials}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Content model — 4 solutions, 4 steps each, one agent per step      */
/* ------------------------------------------------------------------ */

type MockupId =
  | "rita-enterprise"
  | "theo-enterprise"
  | "rohan-enterprise"
  | "eva-enterprise"
  | "eva-institutes"
  | "atlas-institutes"
  | "vera-institutes"
  | "scout-institutes"
  | "rita-startups"
  | "nova-startups"
  | "scout-startups"
  | "rohan-startups"
  | "rita-recruiters"
  | "vera-recruiters"
  | "kai-recruiters"
  | "finn-recruiters";

type Step = { task: string; agent: string; role: string; mockup: MockupId };
type Solution = {
  key: string;
  label: string;
  icon: string;
  heading: string;
  /** Respective solution page + its button label. */
  href: string;
  cta: string;
  steps: Step[];
};

const SOLUTIONS: Solution[] = [
  {
    key: "enterprise",
    label: "Enterprise",
    icon: "solar:buildings-2-bold",
    heading: "Build a Stronger Workforce",
    href: "/solutions/enterprises",
    cta: "Explore Enterprise Solutions",
    steps: [
      { task: "Hire the right people", agent: "RQ-Rita", role: "AI Recruiter", mockup: "rita-enterprise" },
      { task: "Keep your best people", agent: "RQ-Theo", role: "Attrition Predictor", mockup: "theo-enterprise" },
      { task: "Understand your workforce", agent: "RQ-Rohan", role: "Workforce Analyst", mockup: "rohan-enterprise" },
      { task: "Grow your people's skills", agent: "RQ-Eva", role: "Capability Builder", mockup: "eva-enterprise" },
    ],
  },
  {
    key: "institutes",
    label: "Institutes",
    icon: "solar:library-bold",
    heading: "Prepare Students for What Comes Next",
    href: "/solutions/institutes",
    cta: "Explore Institute Solutions",
    steps: [
      { task: "Find student skill gaps", agent: "RQ-Eva", role: "Capability Builder", mockup: "eva-institutes" },
      { task: "Build the right learning path", agent: "RQ-Atlas", role: "Pathway Guide", mockup: "atlas-institutes" },
      { task: "Prepare students for interviews", agent: "RQ-Vera", role: "AI Interviewer", mockup: "vera-institutes" },
      { task: "Connect students to opportunities", agent: "RQ-Scout", role: "Opportunity Finder", mockup: "scout-institutes" },
    ],
  },
  {
    key: "startups",
    label: "Startups",
    icon: "solar:rocket-2-bold",
    heading: "Build and Grow with More Focus",
    href: "/solutions/startups",
    cta: "Explore Startup Solutions",
    steps: [
      { task: "Hire your early team", agent: "RQ-Rita", role: "AI Recruiter", mockup: "rita-startups" },
      { task: "Build your company presence", agent: "RQ-Nova", role: "Brand Builder", mockup: "nova-startups" },
      { task: "Find the right opportunities", agent: "RQ-Scout", role: "Opportunity Finder", mockup: "scout-startups" },
      { task: "Make better growth decisions", agent: "RQ-Rohan", role: "Workforce Analyst", mockup: "rohan-startups" },
    ],
  },
  {
    key: "recruiters",
    label: "Recruiters",
    icon: "solar:users-group-two-rounded-bold",
    heading: "Place Better Talent, Faster",
    href: "/solutions/recruiters",
    cta: "Explore Recruiter Solutions",
    steps: [
      { task: "Find the right candidates", agent: "RQ-Rita", role: "AI Recruiter", mockup: "rita-recruiters" },
      { task: "Screen candidates better", agent: "RQ-Vera", role: "AI Interviewer", mockup: "vera-recruiters" },
      { task: "Prepare candidates for key conversations", agent: "RQ-Kai", role: "Roleplay Coach", mockup: "kai-recruiters" },
      { task: "Keep every placement on track", agent: "RQ-Finn", role: "Onboarding Co-pilot", mockup: "finn-recruiters" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Right-side mockups — small, mostly-visual, no charts, no dashboard */
/* ------------------------------------------------------------------ */

/** Thin labeled progress bar — the one shared primitive across mockups. */
function Bar({ label, percent, tone = "orange" }: { label: string; percent: number; tone?: "orange" | "green" }) {
  const fill = tone === "green" ? "bg-[#16A34A]" : "bg-orange";
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] font-medium text-ink-3">
        <span>{label}</span>
        <span className="tabular-nums text-ink-4">{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Pill({ tone, children }: { tone: "green" | "amber" | "red" | "neutral"; children: React.ReactNode }) {
  const styles = {
    green: "bg-[#16A34A]/12 text-[#16A34A] ring-1 ring-[#16A34A]/25",
    amber: "bg-[#D97706]/12 text-[#D97706] ring-1 ring-[#D97706]/25",
    red: "bg-[#DC2626]/12 text-[#DC2626] ring-1 ring-[#DC2626]/25",
    neutral: "bg-black/[0.04] text-ink-3 ring-1 ring-black/[0.06]",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles}`}>{children}</span>;
}

function MockupShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange">{title}</div>
      <div className="flex flex-1 flex-col justify-center gap-3">{children}</div>
    </div>
  );
}

const MOCKUPS: Record<MockupId, () => React.JSX.Element> = {
  "rita-enterprise": () => (
    <MockupShell title="Candidate Shortlist">
      <p className="text-[12px] text-ink-4">From a pool of 42 applicants</p>
      <div className="flex flex-col gap-2">
        {["Candidate A", "Candidate B", "Candidate C"].map((c) => (
          <div key={c} className="flex items-center justify-between rounded-lg bg-cream-2/60 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 flex-shrink-0 place-items-center rounded-full bg-orange-lighter text-[11px] font-bold text-orange">
                {c.slice(-1)}
              </span>
              <span className="text-[14px] font-semibold text-ink">{c}</span>
            </div>
            <Pill tone="green">Strong match</Pill>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
  "theo-enterprise": () => (
    <MockupShell title="Team Health">
      <div className="flex flex-col gap-2.5">
        {[
          { label: "Stable", count: "18 teams", tone: "green" as const },
          { label: "Watch", count: "4 teams", tone: "amber" as const },
          { label: "At risk", count: "2 teams", tone: "red" as const },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg bg-cream-2/60 px-3.5 py-3">
            <span className="text-[14px] font-semibold text-ink">{row.label}</span>
            <Pill tone={row.tone}>{row.count}</Pill>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
  "rohan-enterprise": () => (
    <MockupShell title="Workforce Overview">
      <div className="flex flex-col gap-4">
        <Bar label="Technical skills" percent={78} />
        <Bar label="Leadership" percent={52} />
        <Bar label="Communication" percent={90} />
      </div>
    </MockupShell>
  ),
  "eva-enterprise": () => (
    <MockupShell title="Skill Gap to Learning Path">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Current gap</span>
          <Pill tone="neutral">Data analysis</Pill>
          <Pill tone="neutral">Leadership</Pill>
        </div>
        <Icon icon="solar:alt-arrow-right-linear" className="size-5 flex-shrink-0 text-ink-5" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Next course</span>
          <Pill tone="green">Advanced analytics</Pill>
          <Pill tone="green">Leadership lab</Pill>
        </div>
      </div>
    </MockupShell>
  ),
  "eva-institutes": () => (
    <MockupShell title="Student Capability">
      <div className="flex flex-col gap-3">
        {[
          { label: "Communication", tone: "green" as const, tag: "Strength" },
          { label: "Problem solving", tone: "green" as const, tag: "Strength" },
          { label: "Coding", tone: "amber" as const, tag: "Gap" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg bg-cream-2/60 px-3.5 py-2.5">
            <span className="text-[14px] font-semibold text-ink">{row.label}</span>
            <Pill tone={row.tone}>{row.tag}</Pill>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
  "atlas-institutes": () => (
    <MockupShell title="Learning Roadmap">
      <div className="flex flex-col gap-0">
        {[
          { label: "Foundations", state: "done" as const },
          { label: "Core skills", state: "done" as const },
          { label: "Applied project", state: "active" as const },
          { label: "Career ready", state: "upcoming" as const },
        ].map((m, i, arr) => (
          <div key={m.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`grid size-6 flex-shrink-0 place-items-center rounded-full text-[11px] ${
                  m.state === "done"
                    ? "bg-[#16A34A] text-white"
                    : m.state === "active"
                      ? "bg-orange text-white"
                      : "bg-black/[0.06] text-ink-4"
                }`}
              >
                {m.state === "done" && <Icon icon="solar:check-circle-bold" className="size-4" />}
              </span>
              {i < arr.length - 1 && <span className="w-px flex-1 bg-black/[0.08]" />}
            </div>
            <span className={`pb-4 text-[14px] font-semibold ${m.state === "upcoming" ? "text-ink-3" : "text-ink"}`}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
  "vera-institutes": () => (
    <MockupShell title="Interview Readiness">
      <div className="flex items-baseline gap-2">
        <span className="text-[36px] font-bold leading-none tracking-[-0.02em] text-orange">76%</span>
        <span className="text-[13px] font-semibold text-ink-4">ready</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill tone="green">Strong: Storytelling</Pill>
        <Pill tone="amber">Improve: Technical depth</Pill>
      </div>
    </MockupShell>
  ),
  "scout-institutes": () => (
    <MockupShell title="Opportunity Match">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Student profiles</span>
          <Pill tone="neutral">Profile A</Pill>
          <Pill tone="neutral">Profile B</Pill>
        </div>
        <Icon icon="solar:link-bold" className="size-5 flex-shrink-0 text-orange" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Open roles</span>
          <Pill tone="green">Role match</Pill>
          <Pill tone="neutral">Role B</Pill>
        </div>
      </div>
    </MockupShell>
  ),
  "rita-startups": () => (
    <MockupShell title="Candidate Shortlist">
      <div className="flex flex-col gap-2">
        {[
          { name: "Candidate A", percent: 91 },
          { name: "Candidate B", percent: 84 },
        ].map((c) => (
          <div key={c.name} className="flex items-center justify-between rounded-lg bg-cream-2/60 px-3.5 py-2.5">
            <span className="text-[14px] font-semibold text-ink">{c.name}</span>
            <Pill tone="green">{c.percent}% fit</Pill>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
  "nova-startups": () => (
    <MockupShell title="Brand Positioning">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Brand voice</span>
        <div className="flex flex-wrap gap-2">
          <Pill tone="neutral">Bold</Pill>
          <Pill tone="neutral">Simple</Pill>
          <Pill tone="neutral">Direct</Pill>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Content themes</span>
        <div className="flex flex-wrap gap-2">
          <Pill tone="green">Product</Pill>
          <Pill tone="green">Culture</Pill>
          <Pill tone="green">Story</Pill>
        </div>
      </div>
    </MockupShell>
  ),
  "scout-startups": () => (
    <MockupShell title="Opportunity Discovery">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Your startup</span>
          <Pill tone="neutral">Profile</Pill>
        </div>
        <Icon icon="solar:link-bold" className="size-5 flex-shrink-0 text-orange" />
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">Opportunities</span>
          <Pill tone="green">Partnership</Pill>
          <Pill tone="neutral">Program</Pill>
        </div>
      </div>
    </MockupShell>
  ),
  "rohan-startups": () => (
    <MockupShell title="Business Insight">
      <div className="flex flex-wrap gap-2">
        <Pill tone="neutral">Faster hiring this quarter</Pill>
        <Pill tone="amber">Engineering gap growing</Pill>
      </div>
      <div className="rounded-lg border-l-2 border-orange bg-orange-lighter/60 px-3.5 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-orange">Next action</span>
        <p className="mt-0.5 text-[14px] font-semibold text-ink">Prioritize senior engineering hires</p>
      </div>
    </MockupShell>
  ),
  "rita-recruiters": () => (
    <MockupShell title="Sourcing Funnel">
      <div className="flex flex-col gap-2">
        {[
          { label: "Sourced", count: 240, percent: 100 },
          { label: "Screened", count: 42, percent: 55 },
          { label: "Shortlisted", count: 6, percent: 28 },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <div className="h-8 rounded-md bg-orange" style={{ width: `${row.percent}%` }} />
            <span className="whitespace-nowrap text-[12px] font-semibold text-ink-3">
              {row.label} · {row.count}
            </span>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
  "vera-recruiters": () => (
    <MockupShell title="Interview Assessment">
      <div className="flex items-baseline gap-2">
        <span className="text-[36px] font-bold leading-none tracking-[-0.02em] text-orange">82%</span>
        <span className="text-[13px] font-semibold text-ink-4">ready</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill tone="green">Strong: Problem solving</Pill>
        <Pill tone="amber">Watch: Communication pace</Pill>
      </div>
    </MockupShell>
  ),
  "kai-recruiters": () => (
    <MockupShell title="Conversation Practice">
      <div className="flex flex-col gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-cream-2/70 px-3.5 py-2.5 text-[13px] text-ink-2">
          Scenario: salary negotiation
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-orange px-3.5 py-2.5 text-[13px] text-white">
          Response: practised and confident
        </div>
      </div>
      <Pill tone="green">Feedback: Clear and confident</Pill>
    </MockupShell>
  ),
  "finn-recruiters": () => (
    <MockupShell title="Onboarding Checklist">
      <div className="flex flex-col gap-2">
        {[
          { label: "Offer accepted", state: "done" as const },
          { label: "Paperwork signed", state: "done" as const },
          { label: "First day setup", state: "active" as const },
          { label: "30-day check-in", state: "upcoming" as const },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3 rounded-lg bg-cream-2/60 px-3.5 py-2.5">
            <span
              className={`grid size-6 flex-shrink-0 place-items-center rounded-full ${
                row.state === "done"
                  ? "bg-[#16A34A] text-white"
                  : row.state === "active"
                    ? "bg-orange text-white"
                    : "bg-black/[0.06] text-ink-4"
              }`}
            >
              {row.state === "done" && <Icon icon="solar:check-circle-bold" className="size-4" />}
            </span>
            <span className={`text-[14px] font-semibold ${row.state === "upcoming" ? "text-ink-3" : "text-ink"}`}>
              {row.label}
            </span>
          </div>
        ))}
      </div>
    </MockupShell>
  ),
};

export default function BusinessRoadmaps() {
  const [activeTabKey, setActiveTabKey] = useState<string>(SOLUTIONS[0].key);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const activeTab = SOLUTIONS.find((s) => s.key === activeTabKey) ?? SOLUTIONS[0];
  const steps = activeTab.steps;
  const activeStep = steps[activeStepIdx] ?? steps[0];

  const selectTab = (key: string) => {
    setActiveTabKey(key);
    setActiveStepIdx(0);
  };

  const RenderMockup = MOCKUPS[activeStep.mockup];

  return (
    <section className="relative py-12 md:py-16 border-b border-black/5 bg-white">
      <div className="mx-auto max-w-[1240px] px-6 md:px-14">
        {/* Header — centered */}
        <div className="mx-auto text-center">
          <Eyebrow center>Personalized Roadmaps</Eyebrow>
          <SectionHeading className="md:whitespace-nowrap !text-[clamp(40px,4.4vw,56px)]">
            Your Next Move, <span className="text-orange">Clearly Defined</span>
          </SectionHeading>
        </div>

        {/* Solution selector — Enterprise / Institutes / Startups / Recruiters */}
        <div className="mt-7">
          <div className="flex snap-x gap-1.5 overflow-x-auto rounded-[12px] bg-[#f1f0ed] p-1.5 ring-1 ring-black/[0.04] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:items-center sm:gap-1 sm:overflow-visible">
            {SOLUTIONS.map((s) => {
              const active = s.key === activeTabKey;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => selectTab(s.key)}
                  aria-pressed={active}
                  className={`flex h-[46px] shrink-0 snap-start items-center justify-center gap-2 whitespace-nowrap rounded-[8px] px-4 transition-all duration-200 sm:h-[48px] sm:flex-1 sm:shrink sm:px-3 ${
                    active
                      ? "bg-white text-orange shadow-[0_2px_6px_-2px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.05]"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <Icon icon={s.icon} className={`size-5 ${active ? "text-orange" : "text-ink-4"}`} />
                  <span className="text-[14px] md:text-[15px] font-semibold tracking-[-0.01em]">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content card */}
        <div className="mt-6 rounded-[12px] bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_30px_60px_-34px_rgba(15,23,42,0.25)] md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col"
            >
              {/* Title row */}
              <div className="flex items-center gap-3">
                <div className="grid size-11 flex-shrink-0 place-items-center rounded-xl bg-orange-lighter text-orange ring-1 ring-orange/15">
                  <Icon icon={activeTab.icon} className="size-6" />
                </div>
                <h3 className="text-[20px] md:text-[26px] font-bold tracking-[-0.02em] text-ink">{activeTab.heading}</h3>
              </div>

              <hr className="my-4 border-black/[0.07]" />

              {/* Two equal-height columns — desktop only. The fixed min-height
                  keeps the card (and the whole section) the same height across
                  tabs, active steps, and the seeker/business toggle. */}
              <div className="hidden items-stretch gap-6 lg:grid lg:min-h-[400px] lg:grid-cols-2 lg:gap-8">
                {/* Left — clickable steps */}
                <ul className="flex h-full flex-col divide-y divide-black/[0.06]">
                  {steps.map((item, i) => {
                    const a = byName[item.agent];
                    const isActive = i === activeStepIdx;
                    return (
                      <li key={item.task} className="flex-1">
                        <button
                          type="button"
                          onClick={() => setActiveStepIdx(i)}
                          aria-pressed={isActive}
                          className={`relative flex h-full w-full items-center gap-3.5 rounded-lg px-3 text-left transition-colors duration-300 ${
                            isActive ? "bg-orange-lighter/60" : "hover:bg-black/[0.02]"
                          }`}
                        >
                          <motion.span
                            aria-hidden
                            className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-orange"
                            initial={false}
                            animate={{ opacity: isActive ? 1 : 0 }}
                            transition={{ duration: 0.4, ease }}
                          />
                          <span
                            className={`grid size-9 flex-shrink-0 place-items-center rounded-lg text-[13px] font-semibold tabular-nums transition-colors duration-300 ${
                              isActive
                                ? "bg-orange text-white ring-2 ring-orange/25"
                                : "bg-black/[0.04] text-ink-4 ring-1 ring-black/[0.06]"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <AgentAvatar name={item.agent} className="size-11" sizes="44px" />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-[15px] font-semibold tracking-[-0.01em] ${isActive ? "text-ink" : "text-ink-2"}`}>
                              {item.task}
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-ink-4">
                              <span className="font-semibold" style={{ color: a?.color }}>
                                {a ? <AgentName name={a.name} /> : null}
                              </span>{" "}
                              · {item.role}
                            </span>
                          </span>
                          <Icon
                            icon="solar:alt-arrow-right-linear"
                            className={`size-5 flex-shrink-0 transition-colors duration-300 ${isActive ? "text-orange" : "text-ink-5"}`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Right — dynamic mockup that follows the active step */}
                <div className="flex h-full flex-col rounded-2xl bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb] p-5 ring-1 ring-black/[0.05]">
                  <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[0_14px_34px_-20px_rgba(0,0,0,0.25)]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeStep.mockup}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35, ease }}
                        className="flex flex-1 flex-col"
                      >
                        <RenderMockup />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* ── Mobile composition (lg:hidden) ── */}
              <div className="lg:hidden">
                {/* Active step mockup — min-height keeps the section steady
                    while tapping between steps swaps the visual. */}
                <div className="flex min-h-[190px] flex-col justify-center rounded-2xl bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb] p-4 ring-1 ring-black/[0.05]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep.mockup}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      <RenderMockup />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Steps — compact, tappable list */}
                <ul className="mt-3 flex flex-col gap-1.5">
                  {steps.map((item, i) => {
                    const isActive = i === activeStepIdx;
                    return (
                      <li key={item.task}>
                        <button
                          type="button"
                          onClick={() => setActiveStepIdx(i)}
                          aria-pressed={isActive}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-300 ${
                            isActive ? "bg-orange-lighter/70 ring-1 ring-orange/15" : "bg-cream-2/60"
                          }`}
                        >
                          <span
                            className={`grid size-7 flex-shrink-0 place-items-center rounded-lg text-[12px] font-semibold tabular-nums ${
                              isActive
                                ? "bg-orange text-white ring-2 ring-orange/25"
                                : "bg-black/[0.04] text-ink-4 ring-1 ring-black/[0.06]"
                            }`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className={`min-w-0 flex-1 truncate text-[14px] font-semibold tracking-[-0.01em] ${isActive ? "text-ink" : "text-ink-2"}`}>
                            {item.task}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Primary CTA — routes to the active audience's solution page.
                  Lives inside the card so it swaps label + link with the tab and
                  reads as part of the section, not a detached chip. */}
              <div className="mt-4 flex justify-center border-t border-black/[0.07] pt-4 lg:mt-6 lg:pt-6">
                <Link
                  href={activeTab.href}
                  className="cta-shine group inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-orange px-4 py-3.5 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] sm:w-auto sm:min-w-[300px] sm:px-8 sm:text-[15px]"
                >
                  {activeTab.cta}
                  <Icon
                    icon="solar:arrow-right-linear"
                    className="size-[18px] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
