"use client";

import Image from "next/image";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  FolderPlus,
  LayoutDashboard,
  ListFilter,
  Mail,
  MoreHorizontal,
  MousePointer2,
  Search,
  Send,
  Settings,
  Upload,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Eyebrow, SectionHeading } from "@/components/home/SectionHeader";

const CYCLE_MS = 22_000;
const INTRO_SECONDS = 1;
const RECRUITER_LOGO = "/sublogos/qkalyber-recruiters.jpeg";
const EASE = [0.22, 1, 0.36, 1] as const;

type Candidate = {
  name: string;
  role: string;
  pfp: string;
  score: number;
  confidence: number;
};

const candidates = [
  {
    name: "Alex Morgan",
    role: "Product Designer",
    pfp: "/agent-subpage/sample/john.jpg",
    score: 91,
    confidence: 94,
  },
  {
    name: "Emma Collins",
    role: "Product Designer",
    pfp: "/agent-subpage/sample/emma.jpg",
    score: 88,
    confidence: 90,
  },
  {
    name: "Oliver Bennett",
    role: "Senior UX Designer",
    pfp: "/shared/avatars/male7.webp",
    score: 94,
    confidence: 96,
  },
  {
    name: "Sophia Reed",
    role: "Product Designer",
    pfp: "/shared/avatars/female2.jpeg",
    score: 86,
    confidence: 87,
  },
] as const satisfies readonly Candidate[];

const pipelineCandidates: readonly Candidate[] = [
  ...candidates.slice(0, 3),
  {
    name: "Ethan Cole",
    role: "UX Designer",
    pfp: "/shared/avatars/male2.jpg",
    score: 84,
    confidence: 86,
  },
  {
    name: "Chloe Martin",
    role: "Product Designer",
    pfp: "/agent-subpage/sample/emma.jpg",
    score: 89,
    confidence: 91,
  },
  {
    name: "Lucas Evans",
    role: "Interaction Designer",
    pfp: "/agent-subpage/sample/john.jpg",
    score: 87,
    confidence: 88,
  },
  {
    name: "Amelia Scott",
    role: "Senior UX Designer",
    pfp: "/shared/avatars/female2.jpeg",
    score: 92,
    confidence: 93,
  },
];

const files = ["alex_morgan.pdf", "emma_collins.pdf", "portfolio_candidates.zip"] as const;

const agents = [
  { name: "Scout", task: "Matching Talent", pfp: "/agents/3.png", start: 3.1, end: 6.15 },
  { name: "Vera", task: "Assessments Sent", pfp: "/agents/1.png", start: 10.05, end: 12.35 },
  { name: "Rita", task: "Pipeline Updated", pfp: "/agents/rita.png", start: 12.35, end: 15.0 },
  { name: "Nova", task: "Brand Updated", pfp: "/agents/5.png", start: 15.0, end: 16.35 },
  { name: "Rohan", task: "Insights Ready", pfp: "/agents/rohan.png", start: 16.35, end: 18.35 },
] as const;

function AgentName({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-start font-semibold", className)}>
      {name}
      <sup className="relative -top-[0.38em] ml-0.5 text-[0.56em] font-bold leading-none tracking-[0.03em] text-[#D95619]">
        RQ
      </sup>
    </span>
  );
}

function CandidateAvatar({ candidate, size = 27 }: { candidate: Candidate; size?: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full border border-[#E2DED9] bg-[#F2EFEC]"
      style={{ width: size, height: size }}
    >
      <Image
        src={candidate.pfp}
        alt={candidate.name}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}

function AppTopbar() {
  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between border-b border-[#E8E5E1] bg-white px-3.5">
      <div className="flex items-center gap-2.5">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#E7E2DD] bg-white">
          <Image
            src={RECRUITER_LOGO}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        </span>
        <div>
          {/* The Q carries the QR corner-bracket frame, matching the topbar of
              the /enterprise workspace mockup (AIWorkforceDemo). Scaled to this
              mockup's smaller 10px topbar type. */}
          <p className="flex items-center text-[10px] font-semibold leading-none tracking-[-0.02em] text-[#FF7026]">
            <span className="relative mr-1 inline-grid h-4 w-4 place-items-center text-[10px] font-bold leading-none text-[#FF7026]">
              Q
              <span className="absolute left-0 top-0 h-1 w-1 rounded-tl-[2px] border-l-[1.5px] border-t-[1.5px] border-[#FF7026]" />
              <span className="absolute right-0 top-0 h-1 w-1 rounded-tr-[2px] border-r-[1.5px] border-t-[1.5px] border-[#FF7026]" />
              <span className="absolute bottom-0 left-0 h-1 w-1 rounded-bl-[2px] border-b-[1.5px] border-l-[1.5px] border-[#FF7026]" />
              <span className="absolute bottom-0 right-0 h-1 w-1 rounded-br-[2px] border-b-[1.5px] border-r-[1.5px] border-[#FF7026]" />
            </span>
            Kalyber
          </p>
          <p className="mt-1 text-[6.5px] leading-none text-[#8C8781]">Recruiter / Coach</p>
        </div>
        <span className="mx-1 h-4 w-px bg-[#E5E1DD]" />
        <span className="text-[8px] font-medium text-[#68635E]">Northstar Talent</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative grid h-7 w-7 place-items-center rounded-lg border border-[#E6E2DE] text-[#756F69]">
          <Bell className="h-3 w-3" aria-hidden />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-white bg-[#FF7026]" />
        </span>
        <span className="relative h-7 w-7 overflow-hidden rounded-full border border-[#DED9D4] bg-[#F2EFEC]">
          <Image
            src="/agent-subpage/sample/emma.jpg"
            alt=""
            fill
            sizes="28px"
            className="object-cover"
          />
        </span>
      </div>
    </header>
  );
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Candidates", icon: UsersRound },
  { label: "Pipeline", icon: ListFilter },
  { label: "Analytics", icon: BarChart3 },
] as const;

function Sidebar() {
  return (
    <aside className="flex w-[112px] shrink-0 flex-col border-r border-[#E9E6E2] bg-white">
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(({ label, icon: Icon }, index) => (
          <div
            key={label}
            className={cn(
              "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[8px] font-medium",
              index === 2 ? "bg-[#FFF0E7] text-[#C94C14]" : "text-[#77716B]",
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {label}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#EEEAE6] p-2">
        <div className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-[8px] font-medium text-[#77716B]">
          <Settings className="h-3.5 w-3.5" aria-hidden />
          Settings
        </div>
      </div>
    </aside>
  );
}

function ActivityRail({ elapsed }: { elapsed: number }) {
  return (
    <aside className="flex w-[184px] shrink-0 flex-col border-l border-[#E9E6E2] bg-white">
      <div className="border-b border-[#EEEAE6] px-3.5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold text-[#2A2927]">AI activity</p>
            <p className="mt-0.5 text-[7px] text-[#8A857F]">Hiring workflow</p>
          </div>
          <span className="flex items-center gap-1 text-[7px] font-medium text-[#3B8F61]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#31A267]" /> Live
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 px-2.5 py-3">
        {agents.map((agent) => {
          const working = elapsed >= agent.start && elapsed < agent.end;
          const complete = elapsed >= agent.end;
          return (
            <motion.div
              key={agent.name}
              animate={{
                backgroundColor: working ? "#FFF3EB" : complete ? "#F7FBF8" : "#FFFFFF",
                borderColor: working ? "#F5CDB8" : complete ? "#DCECDF" : "#ECE8E4",
              }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border p-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#E0DCD7] bg-[#FFF2EA]">
                  <Image
                    src={agent.pfp}
                    alt=""
                    fill
                    sizes="28px"
                    className="object-cover object-top"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <AgentName name={agent.name} className="text-[8px] text-[#34312E]" />
                  <p className="mt-0.5 truncate text-[7px] text-[#8A857F]">{agent.task}</p>
                </div>
                <span className="grid h-4 w-4 place-items-center">
                  {complete ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="grid h-4 w-4 place-items-center rounded-full bg-[#2F9A62] text-white"
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                    </motion.span>
                  ) : working ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                      className="h-3.5 w-3.5 rounded-full border-2 border-[#F4C3AA] border-t-[#FF7026]"
                    />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D8D3CE]" />
                  )}
                </span>
              </div>
              {working ? (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: Math.max(0.8, agent.end - agent.start), ease: "linear" }}
                  className="mt-2 h-0.5 origin-left rounded-full bg-[#FF7026]"
                />
              ) : null}
            </motion.div>
          );
        })}
      </div>

      <div className="m-2.5 rounded-xl border border-[#EEE9E5] bg-[#FAF9F7] p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-medium text-[#78726C]">Manual work saved</span>
          <Clock3 className="h-3 w-3 text-[#FF7026]" aria-hidden />
        </div>
        <p className="mt-1 text-[16px] font-semibold leading-none tracking-[-0.04em] text-[#292724]">
          {elapsed >= 17.9 ? "36h" : "0h"}
        </p>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  positive,
}: {
  label: string;
  value: number;
  suffix?: string;
  positive: boolean;
}) {
  return (
    <motion.div
      animate={{ borderColor: positive ? "#D9EBDD" : "#E7E3DF" }}
      className="flex min-w-0 items-center justify-between rounded-lg border bg-white px-2.5 py-2"
    >
      <div className="min-w-0">
        <p className="truncate text-[6.5px] font-medium text-[#8A857F]">{label}</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-none tabular-nums text-[#302D2A]">
          {value}{suffix}
        </p>
      </div>
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md",
          positive ? "bg-[#EAF6EE] text-[#2F9360]" : "bg-[#F4F1EE] text-[#8A857F]",
        )}
      >
        <ArrowUpRight className="h-3 w-3" aria-hidden />
      </span>
    </motion.div>
  );
}

function Metrics({ elapsed }: { elapsed: number }) {
  const progress = Math.max(0, Math.min(1, (elapsed - 16.35) / 1.7));
  const interpolate = (from: number, to: number) => Math.round(from + (to - from) * progress);
  return (
    <div className="grid grid-cols-4 gap-1.5">
      <MetricCard label="Interview success" value={interpolate(68, 84)} suffix="%" positive={progress > 0} />
      <MetricCard label="Hiring velocity" value={interpolate(23, 14)} suffix="d" positive={progress > 0} />
      <MetricCard label="Pipeline health" value={interpolate(72, 91)} suffix="%" positive={progress > 0} />
      <MetricCard label="Time saved" value={interpolate(0, 36)} suffix="h" positive={progress > 0} />
    </div>
  );
}

function UploadModal({ elapsed, cycle }: { elapsed: number; cycle: number }) {
  const visibleFiles = elapsed < 1.35 ? 0 : elapsed < 1.65 ? 1 : elapsed < 1.95 ? 2 : 3;
  const progress = Math.max(0, Math.min(100, ((elapsed - 1.45) / 1.1) * 100));
  const resumeCount =
    elapsed < 1.12 ? 0 : elapsed < 1.35 ? 120 : elapsed < 1.58 ? 340 : elapsed < 1.82 ? 680 : 1000;
  const resumeCountLabel = resumeCount >= 1000 ? "1,000+" : resumeCount.toLocaleString();
  return (
    <motion.div
      key={`upload-${cycle}`}
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, y: -5 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="absolute left-[258px] top-[92px] z-20 w-[420px] rounded-2xl border border-[#DEDAD5] bg-white p-4 shadow-[0_22px_55px_-30px_rgba(20,18,16,0.42)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#2B2926]">Upload resumes</p>
          <p className="mt-0.5 text-[7px] text-[#8B8680]">PDF, DOCX or ZIP · bulk batches supported</p>
        </div>
        <span className="grid h-6 w-6 place-items-center rounded-md text-[#8B8680]">
          <X className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-[#E2B89F] bg-[#FFF8F3] px-3 py-2.5">
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: resumeCount > 0 ? 1 : 0, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid h-7 w-6 place-items-center rounded-md border border-[#F0C9B3] bg-white text-[#D0581F] shadow-[0_1px_3px_rgba(25,20,16,0.05)]"
              >
                <FileText className="h-3 w-3" aria-hidden />
              </motion.span>
            ))}
          </div>
          <div>
            <p className="text-[8px] font-semibold tabular-nums text-[#C5501A]">
              {resumeCount > 0 ? `${resumeCountLabel} resumes selected` : "Select resumes"}
            </p>
            <p className="mt-0.5 text-[6px] text-[#9B7561]">One bulk candidate batch</p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <AnimatePresence initial={false}>
          {files.slice(0, visibleFiles).map((file, index) => (
            <motion.div
              key={file}
              initial={{ opacity: 0, x: -10, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 28 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="flex items-center gap-2 overflow-hidden rounded-lg border border-[#ECE8E4] bg-white px-2.5"
            >
              <span className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF0E7] text-[#D1571E]">
                <FileText className="h-3 w-3" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-[7px] font-medium text-[#4D4944]">{file}</span>
              <span className="text-[6.5px] text-[#9A948E]">{index === 2 ? "8.4 MB" : "240 KB"}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleFiles === 3 ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-6 items-center justify-center rounded-lg bg-[#F8F7F5] text-[6.5px] font-semibold text-[#77716B]"
          >
            +997 more resumes in this batch
          </motion.div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEEAE6]">
          <motion.div
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.12, ease: "linear" }}
            className="h-full origin-left rounded-full bg-[#FF7026]"
          />
        </div>
        <span className="flex w-[62px] items-center justify-end gap-1 text-[7px] font-semibold text-[#6F6963]">
          {progress >= 100 ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-[#309361]" aria-hidden /> Complete
            </>
          ) : (
            <>Uploading {Math.round(progress)}%</>
          )}
        </span>
      </div>
    </motion.div>
  );
}

function MatchingPanel({ elapsed, cycle }: { elapsed: number; cycle: number }) {
  const count = elapsed < 3.55 ? "120" : elapsed < 4.05 ? "340" : elapsed < 4.6 ? "680" : "1,000+";
  const step = elapsed < 3.85 ? 0 : elapsed < 4.65 ? 1 : 2;
  const stages = [
    { label: "Resume", icon: FileText },
    { label: "Skills", icon: Search },
    { label: "Match", icon: UserCheck },
  ] as const;

  return (
    <motion.div
      key={`matching-${cycle}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-white/95"
    >
      <div className="w-[330px]">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0E7] px-2.5 py-1 text-[7px] font-semibold text-[#C9511A]">
            <motion.span
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-[#FF7026]"
            />
            Scanning resumes
          </span>
          <motion.span
            key={count}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[18px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-[#2B2926]"
          >
            {count}
          </motion.span>
        </div>
        <div className="relative mt-3 h-7 overflow-hidden rounded-lg bg-[#FAF8F6]">
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#EFE9E4]" />
          {Array.from({ length: 9 }).map((_, index) => (
            <motion.span
              key={`${cycle}-resume-stream-${index}`}
              initial={{ x: -28, opacity: 0 }}
              animate={{ x: [-28, 145, 315], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 1.35,
                delay: index * 0.13,
                ease: "linear",
                repeat: Infinity,
                repeatDelay: 0.2,
              }}
              className="absolute top-1 grid h-5 w-4 place-items-center rounded-[4px] border border-[#E4DDD7] bg-white text-[#D15A22] shadow-[0_1px_3px_rgba(25,20,16,0.06)]"
            >
              <FileText className="h-2.5 w-2.5" aria-hidden />
            </motion.span>
          ))}
          <span className="absolute inset-0 flex items-center justify-center text-[6px] font-semibold text-[#77716B]">
            1,000+ resumes scanning
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between">
          {stages.map(({ label, icon: Icon }, index) => (
            <div key={label} className="contents">
              <motion.div
                animate={{
                  borderColor: index <= step ? "#F1B694" : "#E5E1DD",
                  backgroundColor: index <= step ? "#FFF4ED" : "#FFFFFF",
                  scale: index === step ? 1.06 : 1,
                }}
                className="relative flex h-[62px] w-[76px] flex-col items-center justify-center rounded-xl border"
              >
                <Icon className={cn("h-4 w-4", index <= step ? "text-[#D0581F]" : "text-[#9A948E]")} aria-hidden />
                <span className="mt-1.5 text-[7px] font-semibold text-[#5E5954]">{label}</span>
                {index < step ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute mt-[-50px] ml-[62px] grid h-4 w-4 place-items-center rounded-full bg-[#319763] text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                  </motion.span>
                ) : null}
              </motion.div>
              {index < stages.length - 1 ? <span className="h-px w-9 bg-[#DED9D4]" /> : null}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-center -space-x-2">
          {candidates.map((candidate, index) => (
            <motion.div
              key={candidate.name}
              initial={{ opacity: 0, scale: 0.7, x: -10 }}
              animate={{ opacity: elapsed > 4.5 + index * 0.16 ? 1 : 0, scale: 1, x: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="rounded-full border-2 border-white"
            >
              <CandidateAvatar candidate={candidate} size={30} />
            </motion.div>
          ))}
          {elapsed >= 5.2 ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid h-[34px] w-[34px] place-items-center rounded-full border-2 border-white bg-[#FFF0E7] text-[7px] font-semibold text-[#C9511A]"
            >
              +120
            </motion.span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function ScoreBadge({ score, visible }: { score: number; visible: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {visible ? (
        <motion.span
          key="score"
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "inline-flex h-6 min-w-8 items-center justify-center rounded-md px-1.5 text-[8px] font-semibold tabular-nums",
            score >= 90 ? "bg-[#EAF6EE] text-[#2D8E5D]" : "bg-[#FFF1E8] text-[#C55720]",
          )}
        >
          {score}
        </motion.span>
      ) : (
        <motion.span key="empty" exit={{ opacity: 0 }} className="h-1.5 w-7 rounded-full bg-[#E8E4E0]" />
      )}
    </AnimatePresence>
  );
}

function AssessmentStatus({ elapsed, selected }: { elapsed: number; selected: boolean }) {
  if (!selected || elapsed < 10.05) return <span className="text-[7px] text-[#A09A94]">New</span>;
  const state = elapsed < 10.7 ? "Pending" : elapsed < 11.55 ? "Sent" : "Completed";
  return (
    <motion.span
      key={state}
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[6.5px] font-semibold",
        state === "Completed"
          ? "bg-[#EAF6EE] text-[#2D8E5D]"
          : state === "Sent"
            ? "bg-[#FFF0E7] text-[#C9511A]"
            : "bg-[#F2EFEC] text-[#78726C]",
      )}
    >
      {state === "Completed" ? <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden /> : <Mail className="h-2.5 w-2.5" aria-hidden />}
      {state}
    </motion.span>
  );
}

function CandidateTable({ elapsed, cycle }: { elapsed: number; cycle: number }) {
  const rowsVisible = elapsed >= 5.65;
  const selectedCount = elapsed < 8.25 ? 0 : elapsed < 8.65 ? 1 : elapsed < 9.05 ? 2 : 3;
  return (
    <div className="relative h-[214px] overflow-hidden rounded-xl border border-[#E6E2DE] bg-white">
      <div className="grid h-7 grid-cols-[1fr_52px_76px_70px] items-center border-b border-[#ECE8E4] bg-[#FAF9F7] px-2.5 text-[6.5px] font-semibold uppercase tracking-[0.08em] text-[#8A857F]">
        <span>Candidate</span>
        <span>QScore</span>
        <span>Match</span>
        <span>Status</span>
      </div>

      <AnimatePresence initial={false}>
        {rowsVisible
          ? candidates.map((candidate, index) => {
              const selected = index < selectedCount;
              const scoreVisible = elapsed >= 6.05 + index * 0.28;
              return (
                <motion.div
                  key={`${cycle}-${candidate.name}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0, backgroundColor: selected ? "#FFF8F3" : "#FFFFFF" }}
                  transition={{ duration: 0.3, delay: index * 0.09, ease: EASE }}
                  className="grid h-[43px] grid-cols-[1fr_52px_76px_70px] items-center border-b border-[#F0EDEA] px-2.5 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <motion.span
                      animate={{
                        borderColor: selected ? "#FF7026" : "#D8D3CE",
                        backgroundColor: selected ? "#FF7026" : "#FFFFFF",
                      }}
                      className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[4px] border"
                    >
                      {selected ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden /> : null}
                    </motion.span>
                    <CandidateAvatar candidate={candidate} />
                    <div className="min-w-0">
                      <p className="truncate text-[7.5px] font-semibold text-[#383531]">{candidate.name}</p>
                      <p className="mt-0.5 truncate text-[6px] text-[#97918B]">{candidate.role}</p>
                    </div>
                  </div>
                  <ScoreBadge score={candidate.score} visible={scoreVisible} />
                  <div className="pr-2">
                    <div className="flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", candidate.score >= 90 ? "bg-[#31A267]" : "bg-[#FF8B4E]")} />
                      <span className="text-[6.5px] font-medium text-[#68625C]">{candidate.score >= 90 ? "Strong" : "Good"}</span>
                    </div>
                    <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-[#EEEAE6]">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: scoreVisible ? candidate.confidence / 100 : 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className={cn("h-full origin-left rounded-full", candidate.score >= 90 ? "bg-[#31A267]" : "bg-[#FF8B4E]")}
                      />
                    </div>
                  </div>
                  <AssessmentStatus elapsed={elapsed} selected={index < 3 && elapsed >= 9.7} />
                </motion.div>
              );
            })
          : null}
      </AnimatePresence>

      {!rowsVisible && elapsed < 3.05 ? (
        <div className="absolute inset-7 flex flex-col items-center justify-center text-center">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF0E7] text-[#D15A22]">
            <Upload className="h-4 w-4" aria-hidden />
          </span>
          <p className="mt-2 text-[8px] font-semibold text-[#5B5651]">Ready for candidate resumes</p>
        </div>
      ) : null}

      <AnimatePresence>
        {elapsed >= 3.05 && elapsed < 6.05 ? <MatchingPanel elapsed={elapsed} cycle={cycle} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCount >= 2 && elapsed < 10.35 ? (
          <motion.div
            initial={{ opacity: 0, y: 12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            className="absolute bottom-2 left-1/2 flex h-8 items-center gap-1.5 rounded-xl border border-[#DCD7D2] bg-white px-2 shadow-[0_10px_26px_-16px_rgba(20,18,16,0.45)]"
          >
            <span className="rounded-md bg-[#FFF0E7] px-2 py-1 text-[6.5px] font-semibold text-[#C9511A]">{selectedCount} selected</span>
            <span className="flex h-6 items-center gap-1 rounded-md bg-[#FF7026] px-2 text-[6.5px] font-semibold text-white">
              <Send className="h-2.5 w-2.5" aria-hidden /> Send assessment
            </span>
            <span className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[6.5px] font-medium text-[#69635D]">
              <CalendarDays className="h-2.5 w-2.5" aria-hidden /> Interview
            </span>
            <span className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[6.5px] font-medium text-[#69635D]">
              <FolderPlus className="h-2.5 w-2.5" aria-hidden /> Talent pool
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {elapsed >= 10.45 && elapsed < 11.55
          ? [0, 1, 2].map((index) => (
              <motion.span
                key={`mail-${cycle}-${index}`}
                initial={{ opacity: 0, x: 210, y: 150 }}
                animate={{ opacity: [0, 1, 1, 0], x: 490, y: 48 + index * 42 }}
                transition={{ duration: 0.9, delay: index * 0.2, ease: EASE }}
                className="pointer-events-none absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-full bg-[#FFF0E7] text-[#D1571E] shadow-sm"
              >
                <Mail className="h-3 w-3" aria-hidden />
              </motion.span>
            ))
          : null}
      </AnimatePresence>
    </div>
  );
}

const stages = ["Applied", "Screening", "Assessment", "Interview"] as const;

function candidateStage(index: number, elapsed: number) {
  if (index === 0) return elapsed < 12.7 ? 1 : elapsed < 13.8 ? 2 : 3;
  if (index === 1) return elapsed < 13.1 ? 0 : elapsed < 14.2 ? 2 : 3;
  if (index === 2) return elapsed < 13.5 ? 1 : 2;
  return [0, 1, 2, 3][index - 3] ?? 0;
}

function Pipeline({ elapsed, cycle }: { elapsed: number; cycle: number }) {
  return (
    <div className="h-[130px] rounded-xl border border-[#E6E2DE] bg-white p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="text-[7.5px] font-semibold text-[#3A3733]">Hiring pipeline</p>
          <span className="rounded-full bg-[#F2EFEC] px-1.5 py-0.5 text-[6px] font-medium text-[#77716B]">Senior Product Designer</span>
        </div>
        <MoreHorizontal className="h-3 w-3 text-[#99938D]" aria-hidden />
      </div>
      <LayoutGroup id={`pipeline-${cycle}`}>
        <div className="grid h-[88px] grid-cols-4 gap-1.5">
          {stages.map((stage, stageIndex) => {
            const members = pipelineCandidates.filter((_, index) => candidateStage(index, elapsed) === stageIndex);
            return (
              <div key={stage} className="rounded-lg bg-[#F8F7F5] p-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[6.5px] font-semibold text-[#66605B]">{stage}</span>
                  <span className="grid h-3.5 min-w-3.5 place-items-center rounded-full bg-white px-1 text-[5.5px] font-semibold text-[#88827C]">{members.length}</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {members.map((candidate) => (
                    <motion.div
                      layout
                      layoutId={`${cycle}-${candidate.name}-pipeline`}
                      transition={{ layout: { duration: 0.55, ease: EASE } }}
                      key={candidate.name}
                      className="flex h-5 items-center gap-1 rounded-md border border-[#E8E4E0] bg-white px-1 shadow-[0_1px_2px_rgba(30,26,22,0.03)]"
                    >
                      <CandidateAvatar candidate={candidate} size={13} />
                      <span className="min-w-0 flex-1 truncate text-[5.8px] font-medium text-[#4A4642]">{candidate.name.split(" ")[0]}</span>
                      {stageIndex === 3 ? <CalendarDays className="h-2.5 w-2.5 text-[#FF7026]" aria-hidden /> : null}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}

function BrandToast({ cycle }: { cycle: number }) {
  return (
    <motion.div
      key={`brand-${cycle}`}
      initial={{ opacity: 0, x: 18, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="absolute right-[196px] top-[58px] z-[16] w-[176px] rounded-xl border border-[#E1DDD8] bg-white p-3 shadow-[0_16px_38px_-24px_rgba(20,18,16,0.45)]"
    >
      <div className="flex items-center gap-2">
        <span className="relative h-7 w-7 overflow-hidden rounded-full border border-[#E2DED9] bg-[#FFF0E7]">
          <Image src="/agents/5.png" alt="" fill sizes="28px" className="object-cover object-top" />
        </span>
        <div>
          <AgentName name="Nova" className="text-[8px] text-[#393632]" />
          <p className="mt-0.5 text-[6.5px] font-medium text-[#77716B]">Employer brand updated</p>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-3 gap-1">
        {["Career Page", "LinkedIn", "Community"].map((item, index) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.09 }}
            className="rounded-md bg-[#F8F7F5] px-1 py-1.5 text-center"
          >
            <Check className="mx-auto h-2.5 w-2.5 text-[#319763]" strokeWidth={3} aria-hidden />
            <p className="mt-1 truncate text-[5.5px] font-medium text-[#66605B]">{item}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FinalSummary({ cycle }: { cycle: number }) {
  const items = [
    ["1,000+", "resumes processed"],
    ["18", "shortlisted"],
    ["18", "assessments"],
    ["7", "interviews"],
    ["✓", "pipeline updated"],
  ] as const;
  return (
    <motion.div
      key={`summary-${cycle}`}
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.38, ease: EASE }}
      className="absolute bottom-[12px] left-[124px] right-[196px] z-[18] rounded-xl border border-[#DCD8D3] bg-white p-2.5 shadow-[0_18px_45px_-28px_rgba(20,18,16,0.52)]"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#EAF6EE] text-[#2F9360]">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="grid flex-1 grid-cols-5 gap-1.5">
          {items.map(([value, label]) => (
            <div key={label} className="rounded-lg bg-[#F8F7F5] px-2 py-1.5">
              <p className="text-[9px] font-semibold leading-none text-[#33302D]">{value}</p>
              <p className="mt-1 truncate text-[5.8px] font-medium text-[#89837D]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function GuidedCursor({ elapsed }: { elapsed: number }) {
  const uploadClick = elapsed >= 0.58 && elapsed < 0.82;
  const chooseClick = elapsed >= 1.1 && elapsed < 1.34;
  const sendClick = elapsed >= 9.58 && elapsed < 9.9;
  const selecting = elapsed >= 8.0 && elapsed < 9.25;
  const visible = elapsed < 2.15 || (elapsed >= 8.0 && elapsed < 10.0);

  let target = { x: 704, y: 78 };
  if (elapsed >= 0.95 && elapsed < 2.15) target = { x: 470, y: 160 };
  if (elapsed >= 8.0 && elapsed < 8.45) target = { x: 149, y: 193 };
  if (elapsed >= 8.45 && elapsed < 8.85) target = { x: 149, y: 236 };
  if (elapsed >= 8.85 && elapsed < 9.25) target = { x: 149, y: 279 };
  if (elapsed >= 9.25) target = { x: 427, y: 324 };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, x: 600, y: 240 }}
          animate={{ opacity: 1, x: target.x, y: target.y, scale: uploadClick || chooseClick || sendClick ? 0.82 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: selecting ? 0.42 : 0.58, ease: EASE }}
          className="pointer-events-none absolute left-0 top-0 z-[40] drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]"
        >
          <MousePointer2 className="h-5 w-5 fill-white text-[#25221F]" strokeWidth={1.8} aria-hidden />
          <AnimatePresence>
            {uploadClick || chooseClick || sendClick ? (
              <motion.span
                initial={{ opacity: 0.7, scale: 0.3 }}
                animate={{ opacity: 0, scale: 2.2 }}
                exit={{ opacity: 0 }}
                className="absolute -left-1 -top-1 h-5 w-5 rounded-full border border-[#FF7026]"
              />
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MainWorkspace({ elapsed, cycle }: { elapsed: number; cycle: number }) {
  return (
    <main className="min-w-0 flex-1 bg-[#F8F7F5] p-2.5">
      <div className="flex h-[34px] items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] font-semibold text-[#2E2B28]">Senior Product Designer</p>
            <span className="rounded-full bg-[#EAF6EE] px-1.5 py-0.5 text-[5.5px] font-semibold text-[#2F9360]">Active</span>
            <ChevronDown className="h-2.5 w-2.5 text-[#8C8680]" aria-hidden />
          </div>
          <p className="mt-0.5 text-[6px] text-[#928C86]">London · Hybrid · 124 candidates</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#E5E1DD] bg-white text-[#807A74]">
            <Search className="h-3 w-3" aria-hidden />
          </span>
          <span className="flex h-7 items-center gap-1.5 rounded-lg bg-[#FF7026] px-2.5 text-[7px] font-semibold text-white">
            <Upload className="h-3 w-3" aria-hidden /> Upload resumes
          </span>
        </div>
      </div>
      <div className="mt-1.5">
        <Metrics elapsed={elapsed} />
      </div>
      <div className="mt-1.5">
        <CandidateTable elapsed={elapsed} cycle={cycle} />
      </div>
      <div className="mt-1.5">
        <Pipeline elapsed={elapsed} cycle={cycle} />
      </div>
    </main>
  );
}

function BrandIntro({ cycle }: { cycle: number }) {
  return (
    <motion.div
      key={`qkalyber-intro-${cycle}`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="pointer-events-none absolute inset-0 z-[45] grid place-items-center bg-white"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="relative grid place-items-center"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.82, ease: "linear", repeat: Infinity }}
          className="absolute -inset-3 rounded-full border border-[#FF7026]/25 border-t-[#FF7026]"
        />
        <motion.span
          animate={{ opacity: [0.2, 0.65, 0.2], scale: [0.94, 1.04, 0.94] }}
          transition={{ duration: 0.95, ease: "easeInOut", repeat: Infinity }}
          className="absolute -inset-6 rounded-full border border-[#FF7026]/15"
        />
        <motion.div
          animate={{ scale: [1, 1.025, 1] }}
          transition={{ duration: 0.75, ease: "easeInOut", repeat: Infinity }}
          className="relative h-[132px] w-[132px] overflow-hidden rounded-full sm:h-[152px] sm:w-[152px]"
        >
          <Image
            src={RECRUITER_LOGO}
            alt=""
            fill
            sizes="152px"
            className="object-cover"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Workspace({ elapsed, cycle, reduceMotion }: { elapsed: number; cycle: number; reduceMotion: boolean }) {
  const storyElapsed = reduceMotion ? 19.2 : Math.max(0, elapsed - INTRO_SECONDS);
  return (
    <div className="relative flex h-[540px] w-[960px] flex-col overflow-hidden bg-white">
      <AppTopbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <MainWorkspace elapsed={storyElapsed} cycle={cycle} />
        <ActivityRail elapsed={storyElapsed} />
      </div>

      <AnimatePresence>{storyElapsed >= 0.65 && storyElapsed < 3.05 ? <UploadModal elapsed={storyElapsed} cycle={cycle} /> : null}</AnimatePresence>
      <AnimatePresence>{storyElapsed >= 15.0 && storyElapsed < 16.45 ? <BrandToast cycle={cycle} /> : null}</AnimatePresence>
      <AnimatePresence>{storyElapsed >= 18.35 ? <FinalSummary cycle={cycle} /> : null}</AnimatePresence>
      {reduceMotion ? null : <GuidedCursor elapsed={storyElapsed} />}
      <AnimatePresence>{!reduceMotion && elapsed < INTRO_SECONDS ? <BrandIntro cycle={cycle} /> : null}</AnimatePresence>
      <motion.div
        aria-hidden
        animate={{ opacity: storyElapsed >= 20.55 ? 1 : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="pointer-events-none absolute inset-0 z-50 bg-white"
      />
    </div>
  );
}

export default function RecruiterWorkspaceDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.15 });
  const reduceMotion = Boolean(useReducedMotion());
  const [clock, setClock] = useState({ elapsed: reduceMotion ? 19.2 : 0, cycle: 0 });

  useEffect(() => {
    if (reduceMotion) {
      setClock({ elapsed: 19.2, cycle: 0 });
      return;
    }
    if (!inView) return;

    let cycleStart = Date.now();
    let timer = 0;
    const update = () => {
      const sinceStart = Date.now() - cycleStart;
      const elapsedMs = sinceStart % CYCLE_MS;
      setClock({ elapsed: elapsedMs / 1000, cycle: Math.floor(sinceStart / CYCLE_MS) });
      timer = window.setTimeout(update, 100);
    };

    const handleVisibility = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") {
        cycleStart = Date.now();
        update();
      }
    };

    if (document.visibilityState === "visible") update();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [inView, reduceMotion]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="recruiter-workspace-demo-title"
      className="relative w-full overflow-hidden border-y border-black/5 bg-white px-6 py-20 [contain-intrinsic-size:auto_900px] [content-visibility:auto] md:px-14 md:py-28"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.65, ease: EASE }}
          className="mx-auto flex max-w-[940px] flex-col items-center text-center"
        >
          <Eyebrow center>Live Recruiter Workspace</Eyebrow>
          <div id="recruiter-workspace-demo-title">
            <SectionHeading className="!text-[clamp(32px,4.2vw,56px)] md:whitespace-nowrap">
              Your Entire <span className="text-[#FF7026]">Hiring Workflow</span>, Automated
            </SectionHeading>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.992 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
          className="relative mx-auto mt-12 aspect-video w-full max-w-[1040px] overflow-hidden rounded-[16px] border border-[#DCD8D3] bg-white shadow-[0_40px_90px_-48px_rgba(15,23,42,0.42)] [container-type:inline-size] md:mt-16"
        >
          <p className="sr-only">
            A guided ATS walkthrough showing resume upload, AI candidate matching, bulk assessment,
            automated pipeline movement, employer brand updates, and recruiter analytics.
          </p>
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 h-[540px] w-[960px] origin-top-left [transform:scale(calc(100cqw/960px))]"
          >
            <Workspace elapsed={clock.elapsed} cycle={clock.cycle} reduceMotion={reduceMotion} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
