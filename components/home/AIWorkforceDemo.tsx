"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  FileBarChart,
  Flag,
  Flame,
  GraduationCap,
  Handshake,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessageSquareText,
  PanelLeftClose,
  Search,
  Share2,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { agents } from "@/lib/data";
import { isActiveBusinessAgent, shortRole } from "@/lib/agentMedia";
import { cn } from "@/lib/cn";
import { Eyebrow, SectionHeading } from "./SectionHeader";

const STORY_SECONDS = 7.5;
const EASE = [0.22, 1, 0.36, 1] as const;
const TIMING = {
  typeEnd: 2.1,
  submit: 2.65,
  thinkingEnd: 3.75,
  workEnd: 5.7,
  reviewMove: 6.2,
  reviewClick: 6.58,
  reviewDone: 6.9,
} as const;

type StoryId = "brand" | "opportunities" | "development" | "health" | "leadership" | "execution";

type Story = {
  id: StoryId;
  expert: string;
  role: string;
  prompt: string;
  working: string;
  response: string;
  outcomes: readonly [string, string];
  icon: typeof Megaphone;
  pfp: string;
};

const storyContent: Record<string, Omit<Story, "expert" | "role" | "pfp">> = {
  "RQ-Scout": {
    id: "opportunities",
    prompt: "Find new business growth opportunities.",
    working: "Scanning markets and growth signals",
    response: "I found three high-fit growth opportunities worth reviewing.",
    outcomes: ["3 high-fit matches", "Top signal: 94%"],
    icon: Handshake,
  },
  "RQ-Vera": {
    id: "leadership",
    prompt: "Run structured interviews for our priority roles.",
    working: "Preparing role-specific interview scorecards",
    response: "I've prepared structured interviews and evaluation criteria.",
    outcomes: ["3 interviews ready", "Scorecards aligned"],
    icon: MessageSquareText,
  },
  "RQ-Nova": {
    id: "brand",
    prompt: "Improve our branding and employee communication.",
    working: "Building brand and communication assets",
    response: "I've prepared the brand campaign and employee communication plan.",
    outcomes: ["Campaign ready", "Team update scheduled"],
    icon: Megaphone,
  },
  "RQ-Rita": {
    id: "opportunities",
    prompt: "Shortlist the strongest candidates for our open roles.",
    working: "Screening candidates against role requirements",
    response: "I've ranked the strongest candidates for recruiter review.",
    outcomes: ["12 screened", "4 shortlisted"],
    icon: Search,
  },
  "RQ-Theo": {
    id: "health",
    prompt: "Which teams need more support this quarter?",
    working: "Reviewing retention and health signals",
    response: "Workforce health is stable, but two teams need attention.",
    outcomes: ["2 teams flagged", "Risk reduced to 8%"],
    icon: HeartPulse,
  },
  "RQ-Rohan": {
    id: "leadership",
    prompt: "What should leadership focus on next?",
    working: "Connecting business and people KPIs",
    response: "I found one strategic priority worth acting on next.",
    outcomes: ["Manager capability", "Priority plan ready"],
    icon: BarChart3,
  },
  "RQ-Finn": {
    id: "execution",
    prompt: "Build a structured onboarding plan for our new hires.",
    working: "Sequencing onboarding milestones and owners",
    response: "I've created a role-specific onboarding plan for every new hire.",
    outcomes: ["5 plans created", "Owners assigned"],
    icon: ListChecks,
  },
  "RQ-Eva": {
    id: "development",
    prompt: "Create employee training and coaching plans.",
    working: "Personalizing training and coaching paths",
    response: "I've created three training paths with weekly coaching streaks.",
    outcomes: ["3 paths assigned", "7-day streak enabled"],
    icon: GraduationCap,
  },
  "RQ-Maya": {
    id: "execution",
    prompt: "Build the right freelance bench for our next project.",
    working: "Matching project needs to verified specialists",
    response: "I've assembled a ready-to-deploy freelance bench.",
    outcomes: ["6 specialists matched", "Bench ready"],
    icon: UsersRound,
  },
};

const fallbackStoryContent: Omit<Story, "expert" | "role" | "pfp"> = {
  id: "execution",
  prompt: "Take the next priority from plan to execution.",
  working: "Sequencing milestones, tasks, and owners",
  response: "I've converted the priority into a clear execution plan.",
  outcomes: ["Plan ready", "Owners assigned"],
  icon: ListChecks,
};

const stories: Story[] = agents
  .filter(isActiveBusinessAgent)
  .map((agent) => {
    const content = storyContent[agent.name] ?? fallbackStoryContent;
    return {
      ...content,
      expert: agent.name.replace(/^RQ-/, ""),
      role: shortRole(agent.role),
      pfp: agent.image ?? "/agents/3.png",
    };
  });

const CYCLE_MS = STORY_SECONDS * stories.length * 1000;

const people = [
  { name: "James", pfp: "/agent-subpage/sample/john.jpg" },
  { name: "Emma", pfp: "/agent-subpage/sample/emma.jpg" },
  { name: "Oliver", pfp: "/shared/avatars/male7.webp" },
] as const;

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Workforce", icon: UsersRound },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Reports", icon: FileBarChart },
  { label: "Settings", icon: Settings },
] as const;

function AgentName({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-start font-semibold", className)}>
      {name}
      <sup className="relative -top-[0.38em] ml-0.5 text-[0.56em] font-bold leading-none tracking-[0.03em] text-[#D95619]">RQ</sup>
    </span>
  );
}

function AgentAvatar({ story, size = 28 }: { story: Story; size?: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full border border-[#E3DED9] bg-[#FFF4ED]"
      style={{ width: size, height: size }}
    >
      <Image src={story.pfp} alt="" fill sizes={`${size}px`} className="object-cover object-top" />
    </span>
  );
}

function PersonAvatar({ person, size = 28 }: { person: (typeof people)[number]; size?: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#EEEAE6] shadow-[0_1px_3px_rgba(30,25,20,0.12)]"
      style={{ width: size, height: size }}
    >
      <Image src={person.pfp} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

function DemoTopbar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#E8E5E1] bg-white px-4">
      <div className="flex items-center gap-2.5">
        <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#E8E3DE] bg-white">
          <Image
            src="/sublogos/qskale-buisness.jpeg"
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        </span>
        <p className="flex items-center text-[11px] font-semibold tracking-[-0.02em] text-[#FF7026]">
          <span className="relative mr-1 inline-grid h-[18px] w-[18px] place-items-center text-[11px] font-bold text-[#FF7026]">
            Q
            <span className="absolute left-0 top-0 h-[5px] w-[5px] rounded-tl-[2px] border-l-[1.5px] border-t-[1.5px] border-[#FF7026]" />
            <span className="absolute right-0 top-0 h-[5px] w-[5px] rounded-tr-[2px] border-r-[1.5px] border-t-[1.5px] border-[#FF7026]" />
            <span className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-bl-[2px] border-b-[1.5px] border-l-[1.5px] border-[#FF7026]" />
            <span className="absolute bottom-0 right-0 h-[5px] w-[5px] rounded-br-[2px] border-b-[1.5px] border-r-[1.5px] border-[#FF7026]" />
          </span>
          Skale Business
        </p>
        <span className="h-4 w-px bg-[#E6E2DE]" />
        <span className="text-[8px] font-medium text-[#8B8680]">Acme Operations</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[8px] font-medium text-[#6E6963]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2FA463]" />
          Live workspace
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#E6E3DF] text-[#77716B]">
          <PanelLeftClose className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="flex w-[134px] shrink-0 flex-col border-r border-[#E9E6E2] bg-white">
      <nav className="flex-1 space-y-1 px-2.5 py-3">
        {navigation.map(({ label, icon: Icon }, index) => (
          <div
            key={label}
            className={cn(
              "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[9px] font-medium",
              index === 0 ? "bg-[#FFF1E9] text-[#C84D14]" : "text-[#77716B]",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {label}
          </div>
        ))}
      </nav>
      <div className="m-2.5 rounded-xl border border-[#ECE9E5] bg-[#FAFAF9] p-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#FFF0E7] text-[#C94C14]">
            <Workflow className="h-3 w-3" aria-hidden />
          </span>
          <div>
            <p className="text-[8px] font-semibold text-[#48443F]">AI Workforce</p>
            <p className="text-[7px] text-[#918C86]">{stories.length} experts ready</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ExpertRail({ storyIndex, localTime }: { storyIndex: number; localTime: number }) {
  const hasSubmitted = localTime >= TIMING.submit;
  const isComplete = localTime >= TIMING.workEnd;

  return (
    <aside className="flex w-[224px] shrink-0 flex-col border-l border-[#E9E6E2] bg-white">
      <div className="flex items-center justify-between border-b border-[#EFECE8] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold text-[#2A2927]">AI experts</p>
          <p className="mt-0.5 text-[8px] text-[#85817C]">One expert per request</p>
        </div>
        <span className="h-2 w-2 rounded-full bg-[#2FA463]" />
      </div>

      <div className="flex-1 space-y-0.5 px-3 py-2">
        {stories.map((expert, index) => {
          const active = index === storyIndex;
          const working = active && hasSubmitted && !isComplete;
          const complete = index < storyIndex || (active && isComplete);

          return (
            <motion.div
              key={expert.expert}
              animate={{
                backgroundColor: active ? "#FFF8F4" : "#FFFFFF",
                borderColor: active ? "#FFD7C0" : "rgba(255,255,255,0)",
              }}
              transition={{ duration: 0.32, ease: EASE }}
              className="flex h-[39px] items-center gap-2.5 rounded-xl border px-2.5"
            >
              <motion.span animate={{ scale: active ? 1.04 : 1 }} transition={{ duration: 0.4, ease: EASE }}>
                <AgentAvatar story={expert} size={28} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="overflow-visible whitespace-nowrap text-[9px] text-[#34312E]">
                  <AgentName name={expert.expert} />
                </p>
                <p className="mt-0.5 truncate text-[7px] text-[#8A857F]">{expert.role}</p>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={working ? "working" : complete ? "complete" : active ? "ready" : "idle"}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  className={cn(
                    "inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[7px] font-semibold",
                    working && "border-[#FFD8C2] bg-[#FFF1E9] text-[#B84A14]",
                    complete && "border-[#D6E9DB] bg-[#F2F9F4] text-[#267344]",
                    !working && !complete && "border-[#E8E5E1] bg-[#FAFAF9] text-[#8A857F]",
                  )}
                >
                  {working ? (
                    <motion.span animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.1, repeat: Infinity }} className="h-1.5 w-1.5 rounded-full bg-[#FF7026]" />
                  ) : complete ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                  ) : null}
                  {working ? "Working" : complete ? "Done" : active ? "Ready" : "Idle"}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="m-3 rounded-xl border border-[#ECE9E5] bg-[#FAFAF9] p-3">
        <div className="flex items-center justify-between text-[8px] font-medium text-[#6F6B66]">
          <span>Demo progress</span>
          <span>{storyIndex + 1}/{stories.length}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E8E5E1]">
          <motion.div
            className="h-full rounded-full bg-[#FF7026]"
            animate={{ width: `${((storyIndex + Math.min(localTime / STORY_SECONDS, 1)) / stories.length) * 100}%` }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        </div>
      </div>
    </aside>
  );
}

function ThinkingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.14 }}
          className="h-1.5 w-1.5 rounded-full bg-[#FF7026]"
        />
      ))}
    </span>
  );
}

function typedCharacterCount(prompt: string, localTime: number) {
  const progress = Math.min(1, Math.max(0, localTime / TIMING.typeEnd));
  const weights = Array.from(prompt, (character) =>
    character === " " ? 2.1 : character === "." || character === "?" ? 2.8 : 1,
  );
  const target = weights.reduce((sum, weight) => sum + weight, 0) * progress;
  let accumulated = 0;
  for (let index = 0; index < weights.length; index += 1) {
    accumulated += weights[index];
    if (accumulated > target) return index;
  }
  return prompt.length;
}

function Conversation({ story, storyKey, localTime }: { story: Story; storyKey: string; localTime: number }) {
  const typed = typedCharacterCount(story.prompt, localTime);
  const submitted = localTime >= TIMING.submit;
  const thinking = submitted && localTime < TIMING.thinkingEnd;
  const working = localTime >= TIMING.thinkingEnd && localTime < TIMING.workEnd;
  const complete = localTime >= TIMING.workEnd;
  const StoryIcon = story.icon;

  return (
    <section className="flex h-[202px] flex-col overflow-hidden rounded-2xl border border-[#E3E0DC] bg-white p-3 shadow-[0_10px_28px_-26px_rgba(31,27,23,0.28)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF0E7] text-[#D95619]">
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-[9px] font-semibold text-[#302D2A]">Ask your AI Workforce</p>
            <p className="text-[7px] text-[#8C8882]">GrowQR routes each request to the right expert</p>
          </div>
        </div>
        <span className="rounded-full border border-[#E8E5E1] bg-[#FAFAF9] px-2 py-1 text-[7px] font-medium text-[#77716B]">Business context connected</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!submitted ? (
          <motion.div
            key={`input-${storyKey}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 flex min-h-0 flex-1 flex-col justify-between"
          >
            <div className="flex items-center gap-2 px-1 py-1 text-[7px] font-medium text-[#827C76]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#F7F5F2] text-[#D95619]">
                <StoryIcon className="h-3 w-3" aria-hidden />
              </span>
              <span>Ready to route this request to the right specialist</span>
            </div>
            <div className="flex h-[52px] items-center rounded-xl border border-[#FFB98F] bg-[#FFFCFA] px-3.5 shadow-[0_8px_18px_-18px_rgba(255,112,38,0.65)]">
              <p className="flex-1 text-[10px] font-medium text-[#413D38]">
                {story.prompt.slice(0, typed)}
                <span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 bg-[#FF7026]" />
              </p>
              <motion.span
                animate={{ backgroundColor: typed === story.prompt.length ? "#FF7026" : "#DDD9D4" }}
                className="grid h-8 w-8 place-items-center rounded-lg text-white"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </motion.span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`conversation-${storyKey}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 min-h-0 flex-1"
          >
            <div className="flex items-end justify-end gap-1.5">
              <div className="max-w-[370px] rounded-xl rounded-br-sm bg-[#322E2A] px-3 py-2 text-[8px] font-medium text-white shadow-[0_7px_18px_-15px_rgba(20,17,15,0.75)]">
                {story.prompt}
              </div>
              <PersonAvatar person={people[0]} size={24} />
            </div>
            <div className="mt-2 flex items-start gap-2">
              <AgentAvatar story={story} size={29} />
              <motion.div layout className="w-[430px] rounded-xl rounded-bl-sm border border-[#E7E2DD] bg-[#FBFAF8] px-3 py-2 shadow-[0_9px_20px_-20px_rgba(31,27,23,0.35)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[8px] text-[#37332F]"><AgentName name={story.expert} /></p>
                    <span className="text-[7px] text-[#958F89]">{story.role}</span>
                  </div>
                  {complete ? <CheckCircle2 className="h-3 w-3 shrink-0 text-[#2F8B52]" aria-hidden /> : null}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {thinking ? (
                    <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="mt-2 flex items-center gap-2 text-[8px] font-medium text-[#77716B]">
                      <ThinkingDots />
                      Reviewing your connected business context
                    </motion.div>
                  ) : working ? (
                    <motion.div key="working" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.36, ease: EASE }} className="mt-1.5">
                      <p className="text-[8px] font-medium text-[#5B554F]">{story.working}</p>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E8E3DE]">
                        <motion.div initial={{ scaleX: 0.08 }} animate={{ scaleX: 0.82 }} transition={{ duration: 1.15, ease: EASE }} className="h-full origin-left rounded-full bg-[#FF7026]" />
                      </div>
                    </motion.div>
                  ) : complete ? (
                    <motion.div key="complete" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: EASE }}>
                      <p className="mt-1 text-[8px] font-medium leading-[1.4] text-[#514C46]">{story.response}</p>
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {story.outcomes.map((outcome, index) => (
                          <motion.div
                            key={outcome}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 + index * 0.12, duration: 0.32, ease: EASE }}
                            className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-[#E8E4DF]"
                          >
                            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#EDF8F0] text-[#2F8B52]">
                              <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
                            </span>
                            <span className="truncate text-[7px] font-semibold text-[#625D57]">{outcome}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PanelShell({ icon, title, status, children }: { icon: typeof Megaphone; title: string; status: string; children: ReactNode }) {
  const Icon = icon;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="h-full overflow-hidden rounded-2xl border border-[#E3E0DC] bg-white p-3 shadow-[0_10px_24px_-24px_rgba(31,27,23,0.28)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF0E7] text-[#D95619]">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-[9px] font-semibold text-[#34312E]">{title}</p>
            <p className="mt-0.5 text-[7px] text-[#918B85]">Live task workspace</p>
          </div>
        </div>
        <span className="rounded-full border border-[#E8E5E1] bg-[#FAFAF9] px-2 py-1 text-[7px] font-semibold text-[#706A64]">{status}</span>
      </div>
      {children}
    </motion.section>
  );
}

function VisualPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "orange" | "green" | "amber" | "red";
}) {
  const toneClass = {
    neutral: "bg-black/[0.04] text-[#625D57] ring-black/[0.06]",
    orange: "bg-[#FFF0E7] text-[#B84A14] ring-[#FFD2B8]",
    green: "bg-[#EDF8F0] text-[#267344] ring-[#CFE7D6]",
    amber: "bg-[#FFF7E7] text-[#A86108] ring-[#F0D9AB]",
    red: "bg-[#FFF0EF] text-[#B33A32] ring-[#F1CECB]",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[7px] font-semibold ring-1", toneClass)}>{children}</span>;
}

function VisualBar({ label, value, ready }: { label: string; value: number; ready: boolean }) {
  const baseline = Math.max(18, value - 24);
  return (
    <div>
      <div className="flex items-center justify-between text-[7px] font-medium text-[#68625C]">
        <span>{label}</span>
        <span className="tabular-nums text-[#8D8781]">{ready ? value : baseline}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
        <motion.div
          style={{ width: `${value}%` }}
          animate={{ scaleX: ready ? 1 : baseline / value }}
          transition={{ duration: 0.75, ease: EASE }}
          className="h-full origin-left rounded-full bg-[#FF7026]"
        />
      </div>
    </div>
  );
}

function BrandPanel({ stage }: { stage: number }) {
  const ready = stage >= 2;
  const reviewed = stage >= 3;
  return (
    <PanelShell icon={Megaphone} title="Brand & communication" status={ready ? "2 assets ready" : "Analyzing"}>
      <div className="mt-2 grid h-[145px] grid-cols-[.72fr_1.28fr] gap-2.5">
        <div className="flex flex-col justify-between rounded-xl bg-[#F7F5F2] p-2.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[7px] font-medium text-[#827C76]">Brand health</p>
              <div className="mt-1 flex items-end gap-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.strong key={ready ? "81" : "62"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[22px] font-semibold tracking-[-0.05em] text-[#35312D]">
                    {ready ? "81" : "62"}
                  </motion.strong>
                </AnimatePresence>
                <span className="mb-1 text-[7px] text-[#96908A]">/100</span>
              </div>
            </div>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#2F8B52] shadow-[0_3px_10px_-7px_rgba(0,0,0,0.35)]">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <div className="space-y-1.5">
            <VisualBar label="Visibility" value={84} ready={ready} />
            <VisualBar label="Communication" value={79} ready={ready} />
            <div className="flex flex-wrap gap-1.5">
              <VisualPill tone="orange">Brand</VisualPill>
              <VisualPill>Internal comms</VisualPill>
            </div>
          </div>
        </div>

        <motion.div animate={{ borderColor: ready ? "#FFD0B5" : "#E8E5E1", backgroundColor: ready ? "#FFFCFA" : "#FFFFFF" }} transition={{ duration: 0.5, ease: EASE }} className="rounded-xl border p-2.5 shadow-[0_12px_30px_-26px_rgba(28,24,20,0.4)]">
          <div className="flex items-center justify-between border-b border-[#EEEAE6] pb-1.5">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#EDF4FA] text-[#0A66C2]">
                <Share2 className="h-3 w-3" aria-hidden />
              </span>
              <div>
                <p className="text-[8px] font-semibold text-[#45413C]">Growth campaign</p>
                <p className="text-[6px] text-[#918B85]">Brand + team communication</p>
              </div>
            </div>
            <VisualPill tone={ready ? "green" : "neutral"}>{ready ? "Ready" : "Draft"}</VisualPill>
          </div>
          <div className="mt-1.5">
            <motion.div animate={{ backgroundColor: ready ? "#FFF0E7" : "#F7F5F2" }} transition={{ duration: 0.5 }} className="flex h-[36px] items-center justify-between rounded-lg px-2.5">
              <div>
                <p className="text-[7px] font-semibold text-[#5B554F]">Culture that grows with you</p>
                <p className="mt-0.5 text-[6px] text-[#938D87]">Campaign draft · Acme</p>
              </div>
              <Megaphone className="h-4 w-4 text-[#D95619]" aria-hidden />
            </motion.div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {[{ label: "LinkedIn", icon: Share2 }, { label: "Team update", icon: MessageSquareText }].map(({ label, icon: Icon }, index) => (
                <motion.div
                  key={label}
                  initial={false}
                  animate={{ opacity: 1, y: ready ? 0 : 1 }}
                  transition={{ delay: ready ? 0.18 + index * 0.14 : 0, duration: 0.42, ease: EASE }}
                  className="flex items-center justify-between rounded-lg border border-[#ECE8E3] bg-white px-2 py-1"
                >
                  <span className="flex items-center gap-1.5 text-[7px] font-semibold text-[#625D57]">
                    <Icon className="h-2.5 w-2.5 text-[#D95619]" aria-hidden />
                    {label}
                  </span>
                  <Check className={cn("h-2.5 w-2.5", ready ? "text-[#2F8B52]" : "text-[#C8C3BD]")} aria-hidden />
                </motion.div>
              ))}
            </div>
          </div>
          {ready ? (
            <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex justify-end">
              <motion.span animate={{ backgroundColor: reviewed ? "#E85F19" : "#FF7026" }} className="inline-flex h-6 items-center gap-1 rounded-lg px-2.5 text-[7px] font-semibold text-white">
                {reviewed ? "Reviewed" : "Review"}
                {reviewed ? <Check className="h-2.5 w-2.5" aria-hidden /> : <ArrowRight className="h-2.5 w-2.5" aria-hidden />}
              </motion.span>
            </motion.div>
          ) : null}
        </motion.div>
      </div>
    </PanelShell>
  );
}

function OpportunitiesPanel({ ready }: { ready: boolean }) {
  const opportunities = [
    { name: "Enterprise Growth Alliance", fit: "94%", icon: TrendingUp },
    { name: "Innovation Partner Network", fit: "89%", icon: UsersRound },
    { name: "Leadership Impact Forum", fit: "84%", icon: Handshake },
  ];
  return (
    <PanelShell icon={Handshake} title="Business growth opportunities" status={ready ? "3 matches" : "Scanning"}>
      <div className="mt-2 grid h-[145px] grid-cols-[1.22fr_.78fr] gap-2.5">
        <div className="space-y-1.5">
          {opportunities.map(({ name, fit, icon: Icon }, index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.42, delay: ready ? index * 0.12 : 0, ease: EASE }}
              className={cn("flex items-center gap-2 rounded-xl px-2.5 py-2", ready && index === 0 ? "bg-[#FFF0E7] ring-1 ring-[#FFD1B6]" : "bg-[#F7F5F2]")}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-[#77716B] shadow-[0_2px_8px_-7px_rgba(0,0,0,0.35)]">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[8px] font-semibold text-[#49443F]">{name}</p>
              </div>
              <VisualPill tone={ready ? "green" : "neutral"}>{ready ? fit : "Signal"}</VisualPill>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-[#F7F5F2] p-2.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[7px] font-medium text-[#837D77]">New signals</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.strong key={ready ? "8" : "2"} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="mt-1 block text-[26px] font-semibold tracking-[-0.05em] text-[#37332F]">{ready ? "8" : "2"}</motion.strong>
              </AnimatePresence>
            </div>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#D95619]">
              <Target className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>
          <div className="relative mx-auto grid h-14 w-14 place-items-center">
            {[38, 56].map((size, index) => (
              <motion.span key={size} animate={{ scale: ready ? 1 : 0.86, opacity: ready ? 1 - index * 0.3 : 0.52 - index * 0.12 }} transition={{ delay: index * 0.12, duration: 0.55 }} className="absolute rounded-full border border-[#FFB98F]" style={{ width: size, height: size }} />
            ))}
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF7026]" />
          </div>
          <div className="flex justify-center gap-1.5">
            <VisualPill tone={ready ? "green" : "neutral"}>{ready ? <Check className="h-2.5 w-2.5" /> : <Search className="h-2.5 w-2.5" />}{ready ? "High fit" : "Monitoring"}</VisualPill>
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function DevelopmentPanel({ ready }: { ready: boolean }) {
  const employeeCards = [
    { person: people[0], skill: "AI fluency", gap: "High" },
    { person: people[1], skill: "Stakeholder communication", gap: "Medium" },
    { person: people[2], skill: "Team leadership", gap: "Medium" },
  ];
  return (
    <PanelShell icon={GraduationCap} title="Employee training & coaching" status={ready ? "3 paths live" : "Personalizing"}>
      <div className="mt-2 grid h-[145px] grid-cols-[.9fr_1.1fr] gap-2.5">
        <div className="rounded-xl bg-[#F7F5F2] p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {employeeCards.map((employee) => <PersonAvatar key={employee.person.name} person={employee.person} size={28} />)}
            </div>
            <VisualPill tone={ready ? "orange" : "neutral"}>{ready ? "3 assigned" : "Scanning"}</VisualPill>
          </div>
          <div className="mt-2 space-y-1.5">
          {employeeCards.map((employee, index) => (
            <motion.div
              key={employee.person.name}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ready ? index * 0.13 : 0, duration: 0.5, ease: EASE }}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5"
            >
              <span className="truncate text-[8px] font-semibold text-[#514C46]">{employee.skill}</span>
              <VisualPill tone={employee.gap === "High" ? "orange" : "neutral"}>{employee.gap}</VisualPill>
            </motion.div>
          ))}
          </div>
        </div>
        <motion.div animate={{ borderColor: ready ? "#FFB98F" : "#E9E6E2" }} className="flex flex-col justify-between rounded-xl border bg-white p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFF0E7] text-[#D95619]"><Flame className="h-3.5 w-3.5" aria-hidden /></span>
              <div>
                <p className="text-[8px] font-semibold text-[#4D4842]">Coaching streak</p>
                <p className="mt-0.5 text-[7px] text-[#928C86]">Weekly momentum</p>
              </div>
            </div>
            <VisualPill tone={ready ? "orange" : "neutral"}>{ready ? "7 days" : "Starting"}</VisualPill>
          </div>
          <div className="rounded-xl bg-[#F7F5F2] px-2.5 py-1.5">
            <div className="flex items-center justify-between">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <div key={`${day}-${index}`} className="flex flex-col items-center gap-1">
                  <motion.span
                    initial={false}
                    animate={{ scale: ready || index < 2 ? 1 : 0.84, backgroundColor: ready || index < 2 ? "#FF7026" : "#D8D3CE" }}
                    transition={{ delay: ready ? index * 0.11 : 0, duration: 0.38, ease: EASE }}
                    className="grid h-5 w-5 place-items-center rounded-full text-white"
                  >
                    {ready || index < 2 ? <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden /> : <span className="h-1 w-1 rounded-full bg-white/80" />}
                  </motion.span>
                  <span className="text-[6px] font-semibold text-[#817B75]">{day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-1">
            {["Learn", "Coach", "Apply"].map((step, index, all) => (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.span animate={{ scale: 1, backgroundColor: ready || index === 0 ? "#FF7026" : "#D3CEC8" }} transition={{ delay: ready ? index * 0.14 : 0 }} className="grid h-6 w-6 place-items-center rounded-full text-[7px] font-semibold text-white">{index + 1}</motion.span>
                  <span className="text-[7px] font-medium text-[#645F59]">{step}</span>
                </div>
                {index < all.length - 1 ? <motion.span animate={{ scaleX: ready ? 1 : 0.42 }} className="mx-1 h-px flex-1 origin-left bg-[#FFB98F]" /> : null}
              </div>
            ))}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E4E0DB]">
            <motion.div animate={{ scaleX: ready ? 1 : 0.12 }} transition={{ duration: 0.8, ease: EASE }} className="h-full origin-left rounded-full bg-[#FF7026]" />
          </div>
        </motion.div>
      </div>
    </PanelShell>
  );
}

function HealthPanel({ ready }: { ready: boolean }) {
  const healthRows = [
    { label: "Stable", count: "18", tone: "green" as const },
    { label: "Watch", count: "4", tone: "amber" as const },
    { label: "At risk", count: "2", tone: "red" as const },
  ];
  return (
    <PanelShell icon={HeartPulse} title="Workforce health" status={ready ? "Complete" : "Analyzing"}>
      <div className="mt-2 grid h-[145px] grid-cols-[.78fr_1.22fr] gap-2.5">
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-[#F7F5F2] p-2.5">
          <div className="relative grid h-[88px] w-[88px] place-items-center rounded-full bg-white shadow-[0_8px_24px_-20px_rgba(0,0,0,0.4)]">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="43" fill="none" stroke="#EEEAE6" strokeWidth="6" />
              <motion.circle cx="50" cy="50" r="43" fill="none" stroke="#FF7026" strokeWidth="6" strokeLinecap="round" strokeDasharray="270" animate={{ strokeDashoffset: ready ? 43 : 78 }} transition={{ duration: 0.9, ease: EASE }} />
            </svg>
            <div className="relative text-center">
            <AnimatePresence mode="wait" initial={false}>
                <motion.strong key={ready ? "84" : "71"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="block text-[24px] font-semibold tracking-[-0.05em] text-[#34312E]">{ready ? "84" : "71"}</motion.strong>
            </AnimatePresence>
              <span className="text-[7px] font-medium text-[#8A857F]">Health</span>
            </div>
          </div>
          <VisualPill tone={ready ? "green" : "amber"}><TrendingDown className="h-2.5 w-2.5" />Risk {ready ? "8%" : "14%"}</VisualPill>
        </div>
        <div className="flex flex-col justify-center gap-2">
          {healthRows.map((row, index) => (
            <motion.div key={row.label} initial={false} animate={{ opacity: 1, x: 0 }} transition={{ delay: ready ? index * 0.12 : 0, duration: 0.45, ease: EASE }} className="flex items-center justify-between rounded-xl bg-[#F7F5F2] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", row.tone === "green" ? "bg-[#2F9A5B]" : row.tone === "amber" ? "bg-[#D99123]" : "bg-[#D4544C]")} />
                <span className="text-[9px] font-semibold text-[#514C46]">{row.label}</span>
              </div>
              <VisualPill tone={row.tone}>{row.count} teams</VisualPill>
            </motion.div>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

function LeadershipPanel({ ready }: { ready: boolean }) {
  return (
    <PanelShell icon={BarChart3} title="Leadership focus" status={ready ? "Priority found" : "Reviewing"}>
      <div className="mt-2 grid h-[145px] grid-cols-[1.05fr_.95fr] gap-2.5">
        <div className="flex flex-col justify-center gap-2 rounded-xl bg-[#F7F5F2] p-2.5">
          <VisualBar label="Productivity" value={81} ready={ready} />
          <VisualBar label="Capability" value={76} ready={ready} />
          <VisualBar label="Retention" value={85} ready={ready} />
          <div className="flex items-center justify-between pt-1">
            <div className="flex -space-x-2">
              {people.map((person) => <PersonAvatar key={person.name} person={person} size={24} />)}
            </div>
            <VisualPill tone={ready ? "green" : "neutral"}><TrendingUp className="h-2.5 w-2.5" />+12%</VisualPill>
          </div>
        </div>
        <motion.div animate={{ borderColor: ready ? "#FFB98F" : "#E9E6E2", backgroundColor: ready ? "#FFF8F4" : "#FAFAF9" }} className="flex flex-col justify-between rounded-xl border p-2.5">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#D95619] shadow-[0_4px_12px_-9px_rgba(0,0,0,0.35)]"><Target className="h-4 w-4" aria-hidden /></span>
            <VisualPill tone="orange">#1 focus</VisualPill>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={ready ? "ready" : "working"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-[12px] font-semibold leading-tight text-[#45403B]">Manager capability</p>
              <div className="mt-2 flex gap-1.5">
                <VisualPill>Q3</VisualPill>
                <VisualPill tone={ready ? "green" : "orange"}>{ready ? "Action ready" : "Signal detected"}</VisualPill>
              </div>
            </motion.div>
          </AnimatePresence>
          <motion.div animate={{ scaleX: ready ? 1 : 0.22 }} transition={{ duration: 0.75, ease: EASE }} className="h-1.5 origin-left rounded-full bg-[#FF7026]" />
        </motion.div>
      </div>
    </PanelShell>
  );
}

function ExecutionPanel({ ready }: { ready: boolean }) {
  const growthTasks = [
    ["Brand launch", "Training rollout", "Team communication"],
    ["Coaching pilot"],
    ["Growth report"],
  ] as const;

  return (
    <PanelShell icon={ListChecks} title="Business growth execution" status={ready ? "5 tasks ready" : "Building"}>
      <div className="mt-2 grid h-[145px] grid-cols-[1.12fr_.88fr] gap-2.5">
        <div className="rounded-xl bg-[#F7F5F2] p-2">
          <div className="grid h-full grid-cols-3 gap-1.5">
            {["To do", "Doing", "Review"].map((column, columnIndex) => (
              <div key={column} className="rounded-lg bg-white p-1.5">
                <div className="flex items-center justify-between">
                  <span className={cn("h-1.5 w-1.5 rounded-full", columnIndex === 0 ? "bg-[#FF7026]" : columnIndex === 1 ? "bg-[#D99123]" : "bg-[#2F9A5B]")} />
                  <span className="text-[6px] font-semibold text-[#6E6862]">{column}</span>
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {growthTasks[columnIndex].map((task, index) => (
                    <motion.div key={task} initial={false} animate={{ opacity: ready ? 1 : 0.8, y: 0 }} transition={{ delay: ready ? columnIndex * 0.15 + index * 0.1 : 0, duration: 0.42, ease: EASE }} className="rounded-md border border-[#E8E4DF] p-1">
                      <p className="truncate text-[6px] font-semibold text-[#5F5A54]">{task}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <PersonAvatar person={people[(columnIndex + index) % people.length]} size={15} />
                        <CheckCircle2 className={cn("h-2.5 w-2.5", ready ? "text-[#2F9A5B]" : "text-[#C8C3BD]")} aria-hidden />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-[#E9E6E2] p-2.5">
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFF0E7] text-[#D95619]"><Flag className="h-4 w-4" aria-hidden /></span>
            <VisualPill tone={ready ? "green" : "neutral"}>{ready ? "Ready" : "18%"}</VisualPill>
          </div>
          <div className="space-y-2">
            {["W1", "W3", "W6"].map((week, index, all) => (
              <div key={week} className="flex items-center gap-2">
                <div className="flex flex-col items-center self-stretch">
                  <motion.span animate={{ backgroundColor: ready ? "#FF7026" : "#D2CDC7", scale: ready ? 1 : 0.7 }} transition={{ delay: ready ? index * 0.14 : 0 }} className="h-2.5 w-2.5 rounded-full" />
                  {index < all.length - 1 ? <span className="my-1 w-px flex-1 bg-[#E2DED9]" /> : null}
                </div>
                <span className="text-[7px] font-semibold text-[#6E6862]">{week}</span>
                <motion.span animate={{ scaleX: ready ? 1 : 0.15 }} transition={{ delay: ready ? index * 0.12 : 0, duration: 0.55, ease: EASE }} className="h-1 flex-1 origin-left rounded-full bg-[#E2DED9]" />
              </div>
            ))}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#E5E1DC]">
            <motion.div animate={{ scaleX: ready ? 1 : 0.18 }} transition={{ duration: 0.85, ease: EASE }} className="h-full origin-left rounded-full bg-[#FF7026]" />
          </div>
        </div>
      </div>
    </PanelShell>
  );
}

function TaskWorkspace({ story, storyKey, localTime }: { story: Story; storyKey: string; localTime: number }) {
  const ready = localTime >= TIMING.workEnd;
  const reviewed = story.id === "brand" && localTime >= TIMING.reviewDone;
  return (
    <div className="mt-2.5 h-[214px]">
      <AnimatePresence mode="wait">
        <div key={storyKey} className="h-full">
          {story.id === "brand" ? <BrandPanel stage={reviewed ? 3 : ready ? 2 : 1} /> : null}
          {story.id === "opportunities" ? <OpportunitiesPanel ready={ready} /> : null}
          {story.id === "development" ? <DevelopmentPanel ready={ready} /> : null}
          {story.id === "health" ? <HealthPanel ready={ready} /> : null}
          {story.id === "leadership" ? <LeadershipPanel ready={ready} /> : null}
          {story.id === "execution" ? <ExecutionPanel ready={ready} /> : null}
        </div>
      </AnimatePresence>
    </div>
  );
}

function cursorPosition(story: Story, localTime: number, typed: number) {
  if (localTime < 0.2) return { x: 220, y: 263, opacity: 0, mode: "text" as const, duration: 0.2 };
  if (localTime < TIMING.typeEnd) return { x: 180 + Math.min(typed * 5, 450), y: 263, opacity: 1, mode: "text" as const, duration: 0.14 };
  if (localTime < TIMING.submit) return { x: 691, y: 263, opacity: 1, mode: "pointer" as const, duration: 0.62 };
  if (story.id === "brand" && localTime >= TIMING.reviewMove && localTime < TIMING.reviewDone + 0.22) return { x: 675, y: 478, opacity: 1, mode: "pointer" as const, duration: 0.82 };
  return { x: 691, y: 263, opacity: 0, mode: "pointer" as const, duration: 0.3 };
}

function GuidedCursor({ story, localTime }: { story: Story; localTime: number }) {
  const typed = typedCharacterCount(story.prompt, localTime);
  const cursor = cursorPosition(story, localTime, typed);
  const clickKey =
    localTime >= 2.34 && localTime < 2.62
      ? "send"
      : story.id === "brand" && localTime >= TIMING.reviewClick && localTime < TIMING.reviewDone
        ? "review"
        : null;

  return (
    <motion.div animate={{ x: cursor.x, y: cursor.y, opacity: cursor.opacity }} transition={{ duration: cursor.duration, ease: EASE }} className="pointer-events-none absolute left-0 top-0 z-50">
      <AnimatePresence mode="wait" initial={false}>
        {cursor.mode === "text" ? (
          <motion.svg key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} width="14" height="22" viewBox="0 0 14 22" fill="none">
            <path d="M4 2h6M7 2v18M4 20h6" stroke="#24211E" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M5 2h4M7 3v16M5 20h4" stroke="white" strokeWidth="0.65" strokeLinecap="round" />
          </motion.svg>
        ) : (
          <motion.svg key="pointer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path d="M2.2 1.9 17 13.3l-7.1 1.1-3.8 6.1L2.2 1.9Z" fill="white" stroke="#24211E" strokeWidth="1.6" strokeLinejoin="round" />
          </motion.svg>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {clickKey ? (
          <motion.span key={clickKey} initial={{ opacity: 0.45, scale: 0.35 }} animate={{ opacity: 0, scale: 1.7 }} transition={{ duration: 0.4, ease: "easeOut" }} className="absolute -left-2 -top-2 h-7 w-7 rounded-full border-2 border-[#FF7026]" />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function Workspace({ elapsed, cycle, reduceMotion }: { elapsed: number; cycle: number; reduceMotion: boolean }) {
  const storyIndex = Math.min(stories.length - 1, Math.floor(elapsed / STORY_SECONDS));
  const localTime = elapsed - storyIndex * STORY_SECONDS;
  const story = stories[storyIndex];
  const storyKey = `${cycle}-${story.id}`;

  return (
    <div className="relative flex h-[540px] w-[960px] flex-col overflow-hidden bg-white">
      <DemoTopbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-[#F8F7F5] p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-semibold text-[#292724]">Business Command Center</p>
                <ChevronDown className="h-3 w-3 text-[#85807A]" aria-hidden />
              </div>
              <p className="mt-0.5 text-[7px] text-[#8E8983]">Ask once · the right expert responds</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#E6E3DF] bg-white text-[#77726C]">
                <Search className="h-3 w-3" aria-hidden />
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#E6E3DF] bg-white px-2.5 text-[7px] font-semibold text-[#5C5853]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2FA463]" />
                Live
              </span>
            </div>
          </div>
          <Conversation story={story} storyKey={storyKey} localTime={localTime} />
          <TaskWorkspace story={story} storyKey={storyKey} localTime={localTime} />
        </main>
        <ExpertRail storyIndex={storyIndex} localTime={localTime} />
      </div>
      {reduceMotion ? null : <GuidedCursor story={story} localTime={localTime} />}
    </div>
  );
}

export default function AIWorkforceDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.2 });
  const reduceMotion = Boolean(useReducedMotion());
  const [clock, setClock] = useState({ elapsed: reduceMotion ? 5.35 : 0, cycle: 0 });

  useEffect(() => {
    if (reduceMotion) {
      setClock({ elapsed: 5.35, cycle: 0 });
      return;
    }
    if (!isInView) return;

    let cycleStart = Date.now();
    let timer = 0;
    const update = () => {
      const sinceStart = Date.now() - cycleStart;
      const elapsedMs = sinceStart % CYCLE_MS;
      setClock({ elapsed: elapsedMs / 1000, cycle: Math.floor(sinceStart / CYCLE_MS) });
      const localMs = elapsedMs % (STORY_SECONDS * 1000);
      timer = window.setTimeout(update, localMs < 2_850 ? 80 : 220);
    };

    const handleVisibilityChange = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") {
        cycleStart = Date.now();
        update();
      }
    };

    if (document.visibilityState === "visible") update();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isInView, reduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="ai-workforce-demo"
      aria-labelledby="ai-workforce-demo-title"
      className="relative w-full overflow-hidden border-b border-black/5 bg-white px-6 py-20 [contain-intrinsic-size:auto_900px] [content-visibility:auto] md:px-14 md:py-28"
    >
      <div className="mx-auto w-full max-w-[1040px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.65, ease: EASE }}
          className="mx-auto flex max-w-[900px] flex-col items-center text-center"
        >
          <Eyebrow center>Live Workspace</Eyebrow>
          <div id="ai-workforce-demo-title">
            <SectionHeading className="!text-[clamp(32px,4.2vw,56px)] md:whitespace-nowrap">
              Your <span className="text-[#FF7026]">AI Workforce</span>, in Action
            </SectionHeading>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.992 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
          className="relative mx-auto mt-12 aspect-video w-full max-w-[960px] overflow-hidden rounded-[16px] border border-[#DCD8D3] bg-white shadow-[0_40px_90px_-48px_rgba(15,23,42,0.42)] [container-type:inline-size] md:mt-16"
        >
          <p className="sr-only">
            A guided product walkthrough showing {stories.length} different business requests. GrowQR routes each
            request to one specialist AI expert, who updates only the relevant workspace panel.
          </p>
          <div aria-hidden="true" className="absolute left-0 top-0 h-[540px] w-[960px] origin-top-left [transform:scale(calc(100cqw/960px))]">
            <Workspace elapsed={clock.elapsed} cycle={clock.cycle} reduceMotion={reduceMotion} />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
