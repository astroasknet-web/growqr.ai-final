"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { agents } from "@/lib/data";
import { AgentName } from "@/components/ui/AgentName";
import { Eyebrow, SectionHeading } from "./SectionHeader";
import { trackAppCta, trackAppCtaAndNavigate } from "@/lib/analytics";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";

const ease = [0.22, 1, 0.36, 1] as const;
const APP_SIGNUP_URL = "https://app.growqr.ai/signup";

/** Real agents are the single source of truth for roles + brand colors. We look
 *  them up by name so each roadmap step shows the agent actually responsible. */
const byName = Object.fromEntries(agents.map((a) => [a.name, a]));
const roleLabel = (r: string) => r.replace(/^The\s+/, "");

/** Transparent cut-out portraits — sit on a tinted circle of the agent's brand
 *  color. Only these 7 agents have art. */
const AGENT_PFP: Record<string, string> = {
  "RQ-Scout": "/agents/roadmaps/scout-opportunity.png",
  "RQ-Mira": "/agents/roadmaps/mira-resume.png",
  "RQ-Vera": "/agents/roadmaps/veera-interview.png",
  "RQ-Kai": "/agents/roadmaps/kai-roleplay.png",
  "RQ-Nova": "/agents/roadmaps/nova-brand.png",
  "RQ-Sage": "/agents/roadmaps/sage-skill.png",
  "RQ-Lyra": "/agents/roadmaps/lyra-learning.png",
};

/** hex → rgba so one brand color drives both the soft circle fill and ring. */
const tint = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

type Status = "done" | "active" | "upcoming";

/**
 * Personalized Roadmaps — job-seeker view.
 *
 * Reads as a personal career coach, not a stats dashboard. A goal selector drives
 * one card: on the left, the agent-owned plan auto-advances step → step (showing
 * the *idea* of daily progress, not a live tracker); on the right, a mission
 * preview that follows the active step plus a clean plan calendar. The right side
 * is deliberately non-interactive — an illustration, not a working dashboard.
 */
type GoalItem = { task: string; agent: string; duration?: string };
type Goal = {
  key: string;
  label: string;
  icon: string;
  days: number;
  day: number;
  title: string;
  items: GoalItem[];
};

const GOALS: Goal[] = [
  {
    key: "placement",
    label: "Get Hired",
    icon: "solar:case-bold",
    days: 30,
    day: 26,
    title: "Your 30-Day Placement Plan",
    items: [
      { task: "Close Your Skills Gap", agent: "RQ-Sage", duration: "20 min" },
      { task: "Ace Your Interviews", agent: "RQ-Vera", duration: "15 min" },
      { task: "Master Workplace Scenarios", agent: "RQ-Kai", duration: "10 min" },
      { task: "Apply to Opportunities", agent: "RQ-Scout", duration: "10 min" },
    ],
  },
  {
    key: "skills",
    label: "Upskill",
    icon: "solar:book-bold",
    days: 60,
    day: 50,
    title: "Close Your Skill Gaps in 60 Days",
    items: [
      { task: "Map Your Skill Gaps", agent: "RQ-Sage", duration: "20 min" },
      { task: "Follow a Curated Track", agent: "RQ-Lyra", duration: "25 min" },
      { task: "Validate With Mock Interviews", agent: "RQ-Vera", duration: "15 min" },
      { task: "Showcase What You Learn", agent: "RQ-Nova", duration: "20 min" },
    ],
  },
  {
    key: "portfolio",
    label: "Build Your Portfolio",
    icon: "solar:folder-bold",
    days: 90,
    day: 78,
    title: "Build a Standout Portfolio in 90 Days",
    items: [
      { task: "Pick Signature Projects", agent: "RQ-Sage", duration: "30 min" },
      { task: "Document Your Work", agent: "RQ-Mira", duration: "20 min" },
      { task: "Build Your Personal Brand", agent: "RQ-Nova", duration: "25 min" },
      { task: "Get Noticed by Recruiters", agent: "RQ-Scout", duration: "15 min" },
    ],
  },
  {
    key: "switch",
    label: "Switch Career",
    icon: "solar:refresh-bold",
    days: 90,
    day: 80,
    title: "Step Into a New Career in 90 Days",
    items: [
      { task: "Explore Your Target Role", agent: "RQ-Scout", duration: "15 min" },
      { task: "Bridge the Skill Gap", agent: "RQ-Sage", duration: "20 min" },
      { task: "Reframe Your Story", agent: "RQ-Mira", duration: "20 min" },
      { task: "Secure Your Next Interview", agent: "RQ-Vera", duration: "20 min" },
    ],
  },
];

/** Status visuals — the badge and title color per state. */
const STATUS: Record<Status, { badge: string; title: string }> = {
  done: {
    badge: "bg-[#16A34A]/12 text-[#16A34A] ring-1 ring-[#16A34A]/25",
    title: "text-ink-2",
  },
  active: {
    badge: "bg-orange text-white ring-2 ring-orange/25",
    title: "text-ink",
  },
  upcoming: {
    badge: "bg-black/[0.04] text-ink-4 ring-1 ring-black/[0.06]",
    title: "text-ink-2",
  },
};

/** Transparent portrait on a brand-tinted circle — always full color. */
function AgentAvatar({
  name,
  className,
  sizes,
  initialsClassName = "text-[13px]",
}: {
  name: string;
  className: string;
  sizes: string;
  initialsClassName?: string;
}) {
  const a = byName[name];
  return (
    <span
      className={`relative flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.18)] ${className}`}
      style={{ backgroundColor: a ? tint(a.color, 0.16) : undefined }}
    >
      {AGENT_PFP[name] ? (
        <Image
          src={AGENT_PFP[name]}
          alt={a?.name ?? name}
          fill
          sizes={sizes}
          className="object-cover object-top"
        />
      ) : (
        <span
          className={`absolute inset-0 flex items-center justify-center font-bold ${initialsClassName}`}
          style={{ color: a?.color }}
        >
          {a?.initials}
        </span>
      )}
    </span>
  );
}

export default function SeekerRoadmaps() {
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — swap the CTA to a waitlist signup for
  // USD visitors.
  const isWaitlist = !isLive;
  const [activeKey, setActiveKey] = useState<string>(GOALS[0].key);
  const goal = GOALS.find((g) => g.key === activeKey) ?? GOALS[0];
  const items = goal.items;

  // `step` walks the plan forward to *show the idea* of daily progress: steps
  // before it read as done, the step itself is active, the rest upcoming. It
  // pauses on a fully-complete beat, then restarts. Resets when the goal changes.
  // Clicking a step hands control to the user — the auto-advance stops until
  // they switch goals again, so their selection doesn't get overridden.
  const [step, setStep] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  useEffect(() => {
    setStep(0);
    setAutoAdvance(true);
  }, [activeKey]);

  useEffect(() => {
    if (!autoAdvance) return;
    const id = window.setInterval(() => {
      setStep((s) => (s >= items.length ? 0 : s + 1));
    }, 3000);
    return () => window.clearInterval(id);
  }, [items.length, autoAdvance]);

  const selectStep = (i: number) => {
    setAutoAdvance(false);
    setStep(i);
  };

  const statusFor = (i: number): Status =>
    i < step ? "done" : i === step ? "active" : "upcoming";

  const missionIdx = Math.min(step, items.length - 1);
  const missionItem = items[missionIdx];
  const missionAgent = byName[missionItem.agent];
  const percent = Math.round((goal.day / goal.days) * 100);

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

        {/* Goal selector — Linear/Raycast-style segmented control. On mobile it
            becomes a single swipeable row of full-label chips (a 2×2 grid
            cramped the longest label, "Build Your Portfolio"); from sm it's the
            equal-width segmented control. */}
        <div className="mt-7">
          <div className="flex snap-x gap-1.5 overflow-x-auto rounded-[12px] bg-[#f1f0ed] p-1.5 ring-1 ring-black/[0.04] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:items-center sm:gap-1 sm:overflow-visible">
            {GOALS.map((g) => {
              const active = g.key === activeKey;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveKey(g.key)}
                  aria-pressed={active}
                  className={`flex h-[46px] shrink-0 snap-start items-center justify-center gap-2 whitespace-nowrap rounded-[8px] px-4 transition-all duration-200 sm:h-[48px] sm:flex-1 sm:shrink sm:px-3 ${
                    active
                      ? "bg-white text-orange shadow-[0_2px_6px_-2px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.05]"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <Icon icon={g.icon} className={`size-5 ${active ? "text-orange" : "text-ink-4"}`} />
                  <span className="text-[14px] md:text-[15px] font-semibold tracking-[-0.01em]">
                    {g.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content card */}
        <div className="mt-6 rounded-[12px] bg-white p-5 ring-1 ring-black/[0.06] shadow-[0_30px_60px_-34px_rgba(15,23,42,0.25)] md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={goal.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col"
            >
              {/* Title row — single line, takes the full width; progress fills the right */}
              <div className="flex items-center justify-between gap-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-11 flex-shrink-0 place-items-center rounded-xl bg-orange-lighter text-orange ring-1 ring-orange/15">
                    <Icon icon={goal.icon} className="size-6" />
                  </div>
                  <h3 className="text-[20px] md:text-[26px] font-bold tracking-[-0.02em] text-ink md:whitespace-nowrap">
                    {goal.title}
                  </h3>
                </div>
                {/* plan progress — uses the spare space on the title row (lg+;
                    below lg the mobile composition shows its own progress). */}
                <div className="hidden w-[240px] flex-shrink-0 lg:block">
                  <div className="flex items-center justify-between text-[12px] font-medium text-ink-3">
                    <span>Your Progress</span>
                    <span>
                      Day <span className="font-bold text-orange">{goal.day}</span> of {goal.days}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                    <motion.div
                      className="h-full rounded-full bg-orange"
                      initial={false}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, ease }}
                    />
                  </div>
                </div>
              </div>

              <hr className="my-4 border-black/[0.07]" />

              {/* Two equal-height columns — desktop only. Mobile gets a
                  purpose-built composition below (not this dashboard shrunk).
                  Shares the same min-height as the business roadmaps so the
                  section stays the same height across the seeker/business toggle. */}
              <div className="hidden items-stretch gap-6 lg:grid lg:min-h-[400px] lg:grid-cols-2 lg:gap-8">
                {/* Left — agent steps fill the full height of the card */}
                <ul className="flex h-full flex-col divide-y divide-black/[0.06]">
                  {items.map((item, i) => {
                    const a = byName[item.agent];
                    const status = statusFor(i);
                    const s = STATUS[status];
                    const isActive = status === "active";
                    return (
                      <li
                        key={item.task}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectStep(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectStep(i);
                          }
                        }}
                        aria-pressed={isActive}
                        className={`relative flex flex-1 cursor-pointer items-center gap-3.5 rounded-lg px-3 transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 ${
                          isActive ? "bg-orange-lighter/60" : "hover:bg-black/[0.02]"
                        }`}
                      >
                        <motion.span
                          aria-hidden
                          className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-orange"
                          initial={false}
                          animate={{ opacity: isActive ? 1 : 0 }}
                          transition={{ duration: 0.6, ease }}
                        />
                        {/* number badge — number stays visible in every state */}
                        <span
                          className={`grid size-9 flex-shrink-0 place-items-center rounded-lg text-[13px] font-semibold tabular-nums transition-colors duration-700 ${s.badge}`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {/* agent avatar — the owner of the step */}
                        <AgentAvatar name={item.agent} className="size-11" sizes="44px" />
                        {/* text */}
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[15px] font-semibold tracking-[-0.01em] transition-colors duration-700 ${s.title}`}>
                            {item.task}
                          </span>
                          <span className="mt-1.5 block whitespace-nowrap text-[13px] leading-[1.5] text-ink-4">
                            <span className="font-semibold" style={{ color: a?.color }}>
                              {a ? <AgentName name={a.name} /> : null}
                            </span>{" "}
                            · {a ? roleLabel(a.role) : ""}
                          </span>
                        </span>
                        {/* status marker — cross-fades between states */}
                        <span className="flex flex-shrink-0 items-center justify-end">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={status}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.35, ease }}
                              className="flex items-center"
                            >
                              {status === "done" && (
                                <Icon icon="solar:check-circle-bold" className="size-[22px] text-[#16A34A]" />
                              )}
                              {status === "active" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-2.5 py-1 text-[11px] font-semibold text-white">
                                  <span className="relative flex size-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                                    <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                                  </span>
                                  Active Now
                                </span>
                              )}
                              {status === "upcoming" && (
                                <Icon icon="solar:alt-arrow-right-linear" className="size-5 text-ink-5" />
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Right — mission detail panel, reflects the selected step */}
                <div
                  className="flex h-full select-none flex-col rounded-2xl bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb] p-5 ring-1 ring-black/[0.05]"
                >
                  {/* Today's mission — the hero of the panel; fills the full height */}
                  <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-black/[0.05] shadow-[0_14px_34px_-20px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-60" />
                          <span className="relative inline-flex size-2 rounded-full bg-orange" />
                        </span>
                        Today&apos;s Mission
                      </div>
                      {missionItem.duration && (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-4">
                          <Icon icon="solar:clock-circle-linear" className="size-3.5" />
                          {missionItem.duration}
                        </span>
                      )}
                    </div>

                    {/* mission body — big, centered, impactful */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={missionItem.task}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.5, ease }}
                        className="flex flex-1 flex-col items-center justify-center gap-5 py-6 text-center"
                      >
                        <AgentAvatar
                          name={missionItem.agent}
                          className="size-24"
                          sizes="96px"
                          initialsClassName="text-[26px]"
                        />
                        <div>
                          <p className="text-[22px] md:text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">
                            {missionItem.task}
                          </p>
                          <p className="mt-2 text-[14px] text-ink-4">
                            Guided by{" "}
                            <span className="font-semibold" style={{ color: missionAgent?.color }}>
                              {missionAgent ? <AgentName name={missionAgent.name} /> : null}
                            </span>{" "}
                            · {missionAgent ? roleLabel(missionAgent.role) : ""}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* step progress — replaces the calendar; segmented to mirror the plan */}
                    <div className="mt-auto border-t border-black/[0.06] pt-4">
                      <div className="flex items-center justify-between text-[12px] font-medium text-ink-3">
                        <span>
                          Step <span className="font-bold text-orange">{missionIdx + 1}</span> of {items.length}
                        </span>
                        <span>
                          Day <span className="font-bold text-orange">{goal.day}</span> of {goal.days}
                        </span>
                      </div>
                      <div className="mt-2.5 flex gap-1.5">
                        {items.map((_, i) => (
                          <div key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                            <motion.div
                              className="h-full rounded-full bg-orange"
                              initial={false}
                              animate={{ width: i <= missionIdx ? "100%" : "0%" }}
                              transition={{ duration: 0.5, ease }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Mobile composition (lg:hidden) — clean, purpose-built:
                  the recommended next move (dominant), the full plan (compact),
                  then where you are. Reads in seconds: "GrowQR knows where I am
                  and shows me what to do next." ── */}
              <div className="lg:hidden">
                {/* Your next move — the hero recommendation */}
                <div className="rounded-2xl bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb] p-4 ring-1 ring-black/[0.05]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-orange" />
                      </span>
                      Your Next Move
                    </span>
                    {missionItem.duration && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-4">
                        <Icon icon="solar:clock-circle-linear" className="size-3.5" />
                        {missionItem.duration}
                      </span>
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={missionItem.task}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.4, ease }}
                      className="mt-3.5 flex items-center gap-3.5"
                    >
                      <AgentAvatar
                        name={missionItem.agent}
                        className="size-14"
                        sizes="56px"
                        initialsClassName="text-[16px]"
                      />
                      <div className="min-w-0">
                        <p className="text-[18px] font-bold leading-tight tracking-[-0.02em] text-ink">
                          {missionItem.task}
                        </p>
                        <p className="mt-1 text-[13px] leading-snug text-ink-4">
                          Guided by{" "}
                          <span className="font-semibold" style={{ color: missionAgent?.color }}>
                            {missionAgent ? <AgentName name={missionAgent.name} /> : null}
                          </span>{" "}
                          · {missionAgent ? roleLabel(missionAgent.role) : ""}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* The full plan — compact list, active step highlighted */}
                <ul className="mt-3 flex flex-col gap-1.5">
                  {items.map((item, i) => {
                    const status = statusFor(i);
                    const isActive = status === "active";
                    const isDone = status === "done";
                    return (
                      <li
                        key={item.task}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectStep(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectStep(i);
                          }
                        }}
                        aria-pressed={isActive}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/40 ${
                          isActive
                            ? "bg-orange-lighter/70 ring-1 ring-orange/15"
                            : "bg-cream-2/60"
                        }`}
                      >
                        <span
                          className={`grid size-7 flex-shrink-0 place-items-center rounded-lg text-[12px] font-semibold tabular-nums ${STATUS[status].badge}`}
                        >
                          {isDone ? (
                            <Icon icon="solar:check-circle-bold" className="size-4" />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate text-[14px] font-semibold tracking-[-0.01em] ${
                            isActive ? "text-ink" : "text-ink-2"
                          }`}
                        >
                          {item.task}
                        </span>
                        {isActive && (
                          <span className="flex-shrink-0 rounded-full bg-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Now
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Where you are — compact progress */}
                <div className="mt-3.5 rounded-xl bg-cream-2/70 px-3.5 py-3 ring-1 ring-black/[0.04]">
                  <div className="flex items-center justify-between text-[12px] font-medium text-ink-3">
                    <span>
                      Step <span className="font-bold text-orange">{missionIdx + 1}</span> of {items.length}
                    </span>
                    <span>
                      Day <span className="font-bold text-orange">{goal.day}</span> of {goal.days}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {items.map((_, i) => (
                      <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-orange transition-[width] duration-500"
                          style={{ width: i <= missionIdx ? "100%" : "0%" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA strip */}
        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[12px] bg-orange-lighter px-5 py-4 ring-1 ring-orange/10 sm:flex-row sm:items-center md:px-7">
          {/* Reassurance message — desktop/tablet only; on mobile the strip is
              just the CTA to keep it clean. */}
          <div className="hidden items-center gap-4 sm:flex">
            <div className="grid size-11 flex-shrink-0 place-items-center rounded-full bg-orange text-white shadow-[0_10px_24px_-10px_rgba(255,106,47,0.7)]">
              <Icon icon="solar:bolt-bold" className="size-6" />
            </div>
            <div>
              <p className="text-[16px] md:text-[18px] font-bold tracking-[-0.01em] text-ink">
                Every step is designed and validated by human experts and industry veterans.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={
              isWaitlist
                ? () => {
                    trackAppCta({
                      ctaLabel: "Join the Waitlist",
                      ctaLocation: "landing_personalized_roadmaps",
                      ctaAction: "waitlist",
                    });
                    openWaitlist("roadmaps-cta");
                  }
                : () =>
                    trackAppCtaAndNavigate({
                      ctaLabel: "Start My 30-Day Plan",
                      ctaLocation: "landing_personalized_roadmaps",
                      destinationUrl: APP_SIGNUP_URL,
                    })
            }
            className="cta-shine inline-flex h-12 w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-orange px-6 text-[15px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:justify-start"
          >
            {isWaitlist ? "Join the Waitlist" : "Start My 30-Day Plan"}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
