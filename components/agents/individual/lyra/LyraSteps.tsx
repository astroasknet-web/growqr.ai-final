"use client";

import { type ReactNode } from "react";
import {
  Target,
  Layers,
  Route,
  BookOpen,
  LineChart,
  Check,
  Clock,
  Play,
  FileText,
  Code2,
  Sparkles,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";
import { Ring } from "@/components/agents/directory/AgentShowcase";

/* RQ-Lyra — the Learning Curator. Five "How It Works" steps, each a FeatureRow with
   a minimal, premium mockup panel following the shared recipe:
   soft-gradient frame -> white card -> generous whitespace, very little text.
   RQ-Lyra is not a course marketplace: it removes decision fatigue by turning a
   goal into a focused, personalized learning journey. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Define your career goal ──────────────────────────────────────────── */
function GoalPanel() {
  const facts = [
    { label: "Current level", value: "Beginner" },
    { label: "Timeline", value: "3 months" },
  ];
  return (
    <Panel gradient="from-indigo-200 via-indigo-100 to-blue-200">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Your career goal</h4>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Target className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Goal
        </span>
      </div>

      {/* the goal is the hero of the panel */}
      <div className="mt-5 flex items-center gap-3.5 rounded-2xl border border-orange/25 bg-orange-lighter/60 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange text-white">
          <Target className="h-6 w-6" strokeWidth={2.1} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-ink">
            Become a Data Analyst
          </p>
          <p className="mt-0.5 text-[12.5px] text-ink-4">Job-ready in 12 weeks</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl bg-cream-2/70 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-4">
              {f.label}
            </p>
            <p className="mt-1 text-[14px] font-bold text-ink">{f.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function LyraGoal() {
  return (
    <FeatureRow
      agentName="RQ-Lyra"
      Icon={Target}
      label="Set your goal"
      heading={
        <>
          Start With the Future
          <br />
          <span className="text-orange">You Want</span>
        </>
      }
      description="Tell RQ-Lyra your goal and timeline, and your whole path is built around it."
      cta="Set my goal"
      ctaSolid
      visual={<GoalPanel />}
    />
  );
}

/* ── 2. Discover what to learn ───────────────────────────────────────────── */
function GapsPanel() {
  const have = ["Spreadsheets", "Communication"];
  const need = [
    { label: "SQL", priority: true },
    { label: "Python", priority: true },
    { label: "Data viz", priority: false },
  ];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
            Skills to your goal
          </div>
          <p className="mt-1 text-[14px] font-semibold text-ink">3 skills stand between you and your goal</p>
        </div>
        <div className="relative shrink-0">
          <Ring value={45} size={60} stroke={7} color="#6366F1" />
          <span className="absolute inset-0 grid place-items-center text-[15px] font-bold text-ink">
            45%
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
            You have
          </div>
          <div className="mt-2 space-y-1.5">
            {have.map((s) => (
              <p key={s} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} aria-hidden /> {s}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.07] bg-cream-2/60 p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">To learn</div>
          <div className="mt-2 space-y-1.5">
            {need.map((s) => (
              <p
                key={s.label}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"
              >
                <span
                  className={`h-2 w-2 rounded-full ${s.priority ? "bg-orange" : "bg-ink-5"}`}
                />
                {s.label}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-orange/25 bg-orange-lighter/70 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} aria-hidden />
        <p className="text-[13px] font-semibold leading-snug text-ink">
          Start with SQL. It unlocks the biggest jump toward your goal.
        </p>
      </div>
    </Panel>
  );
}

export function LyraGaps() {
  return (
    <FeatureRow
      agentName="RQ-Lyra"
      reverse
      Icon={Layers}
      label="Find the gaps"
      heading={
        <>
          Know Which Skills
          <br />
          <span className="text-orange">Move the Needle</span>
        </>
      }
      description="RQ-Lyra aligns your skills with your career goals and highlights the few that matter the most."
      cta="Find my gaps"
      visual={<GapsPanel />}
    />
  );
}

/* ── 3. Get a personalized learning path ─────────────────────────────────── */
function PathPanel() {
  const weeks = [
    { title: "SQL fundamentals", week: "Weeks 1-3", state: "done" as const },
    { title: "Python for data", week: "Weeks 4-7", state: "active" as const },
    { title: "Dashboards & viz", week: "Weeks 8-12", state: "todo" as const },
  ];
  return (
    <Panel gradient="from-purple-200 via-purple-100 to-violet-200">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Your learning path</h4>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cream-2/80 px-2.5 py-1 text-[11px] font-bold text-ink-3">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> 12 weeks
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {weeks.map((m, i) => {
          const done = m.state === "done";
          const active = m.state === "active";
          return (
            <div key={m.title} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-orange text-white"
                      : "bg-cream-2 text-ink-4"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <div
                className={`flex flex-1 items-center justify-between rounded-lg px-3.5 py-2.5 ${
                  active
                    ? "border border-orange/25 bg-orange-lighter/70"
                    : "bg-cream-2/70"
                }`}
              >
                <span className={`text-[13px] font-semibold ${active ? "text-ink" : "text-ink-2"}`}>
                  {m.title}
                </span>
                <span className="text-[11px] font-semibold text-ink-4">{m.week}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="flex items-center justify-between text-[12px] font-medium text-ink-4">
          <span>Path progress</span>
          <span>Week 5 of 12</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-2">
          <div className="h-full w-[42%] rounded-full bg-orange" />
        </div>
      </div>
    </Panel>
  );
}

export function LyraPath() {
  return (
    <FeatureRow
      agentName="RQ-Lyra"
      Icon={Route}
      label="Your path"
      heading={
        <>
          Follow a Path,
          <br />
          <span className="text-orange">Not a Guess</span>
        </>
      }
      description="RQ-Lyra sequences your skills week by week, so you always know what to learn next."
      cta="Build my path"
      visual={<PathPanel />}
    />
  );
}

/* ── 4. Learn from curated resources ─────────────────────────────────────── */
function ResourcePanel() {
  const resources = [
    { title: "SQL for Analysts", type: "Course", Icon: BookOpen, tone: "bg-blue-500" },
    { title: "Joins, explained", type: "Video", Icon: Play, tone: "bg-rose-500" },
    { title: "Query patterns", type: "Article", Icon: FileText, tone: "bg-emerald-500" },
    { title: "Practice set", type: "Practice", Icon: Code2, tone: "bg-amber-500" },
  ];
  return (
    <Panel gradient="from-rose-200 via-rose-100 to-pink-200">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Curated for SQL</h4>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Hand-picked
        </span>
      </div>

      <div className="mt-5 space-y-2.5">
        {resources.map((r) => (
          <div
            key={r.title}
            className="flex items-center gap-3 rounded-xl bg-cream-2/70 px-3 py-2.5"
          >
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${r.tone}`}>
              <r.Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight text-ink">{r.title}</p>
              <p className="text-[11.5px] text-ink-4">{r.type}</p>
            </div>
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-[12px] font-semibold text-ink-4">
        Only what moves you forward. Nothing else.
      </p>
    </Panel>
  );
}

export function LyraResources() {
  return (
    <FeatureRow
      agentName="RQ-Lyra"
      reverse
      Icon={BookOpen}
      label="Curated resources"
      heading={
        <>
          Spend Time Learning,
          <br />
          <span className="text-orange">Not Searching</span>
        </>
      }
      description="For each skill, RQ-Lyra hand-picks only the best resources, so you skip the browsing."
      cta="See my resources"
      visual={<ResourcePanel />}
    />
  );
}

/* ── 5. Stay on track ────────────────────────────────────────────────────── */
function TrackPanel() {
  const wins = ["SQL mastered", "On schedule"];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex flex-col items-center py-2 text-center">
        <div className="relative">
          <Ring value={68} size={150} stroke={13} color="#FF6A2F" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[42px] font-bold leading-none tracking-[-0.03em] text-ink">68%</span>
            <span className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-4">
              Path complete
            </span>
          </div>
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-600">
          <LineChart className="h-4 w-4" strokeWidth={2.75} aria-hidden /> 4 milestones done
        </span>

        <div className="mt-4 flex w-full items-center gap-2.5 rounded-xl border border-orange/25 bg-orange-lighter/70 p-3.5 text-left">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange text-white">
            <Play className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-orange-deep">Next up</p>
            <p className="text-[13px] font-semibold text-ink">Python: data structures</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {wins.map((w) => (
            <span
              key={w}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]"
            >
              <Check className="h-3.5 w-3.5 text-orange" strokeWidth={3} aria-hidden /> {w}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function LyraTrack() {
  return (
    <FeatureRow
      agentName="RQ-Lyra"
      Icon={LineChart}
      label="Towards your goal"
      heading={
        <>
          Build Momentum
          <br />
          <span className="text-orange">Toward Your Goal</span>
        </>
      }
      description="RQ-Lyra tracks every milestone and points to your next step, so you keep moving."
      cta="Track my progress"
      visual={<TrackPanel />}
    />
  );
}
