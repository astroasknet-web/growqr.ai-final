"use client";

import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import { withAgentMarks } from "@/components/ui/AgentName";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { trackAppCta } from "@/lib/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

/* AgentStory — the reusable "Agent on Autopilot" section.

   Core idea: show how *effortlessly* the agent does the work. A left-side step
   rail auto-advances while a single minimal illustration on the right morphs to
   match the active step. Each agent supplies its own story steps + visuals; this
   shell appends two shared payoff beats — "Track Your Readiness" (RQ-Score ring)
   and "Unlock Rewards" (GrowQR points + perks) — so pages never re-declare them.

   Visuals are deliberately illustrations, not working product screens: minimal
   UI, almost no text, orange only for highlights. */

export type StoryStep = {
  title: string;
  description: string;
  icon: string;
  /** Right-side minimal illustration for this step. */
  Visual: ComponentType;
};

type AgentStoryProps = {
  /** Two-line <h2>, orange accent on line 2. */
  heading: ReactNode;
  /** Agent-specific steps (the shared readiness + rewards beats are appended). */
  steps: StoryStep[];
  /** Flavored label on the readiness beat, e.g. "Interview Readiness". */
  readinessLabel: string;
  cta: { label: string; href: string };
};

/* ── Shared data for the two common tail beats ───────────────────────────── */
const RQ_SCORE = 94;
const POINTS = { value: "1,240", delta: "+120" };
const PERKS = [
  {
    title: "Event Passes",
    icon: "solar:ticket-bold-duotone",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
  },
  {
    title: "Expert Sessions",
    icon: "solar:user-rounded-bold-duotone",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
] as const;

/* ── Right-side illustration frame — soft gradient shell → white card ─────── */
function Stage({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex h-full select-none flex-col justify-center rounded-[28px] bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb] p-6 shadow-soft ring-1 ring-black/[0.04] md:p-8"
    >
      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/[0.05] sm:p-7">
        {children}
      </div>
    </div>
  );
}

/* ── Shared beat — Track Your Readiness ──────────────────────────────────── */
function ScoreRing({ size = 160, stroke = 13 }: { size?: number; stroke?: number }) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (RQ_SCORE / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FFEADB" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#rq-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease }}
        />
        <defs>
          <linearGradient id="rq-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF8A4C" />
            <stop offset="100%" stopColor="#D44F1A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="rounded-full bg-orange-lighter px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-deep">
          RQ-Score
        </span>
        <span className="mt-0.5 text-[44px] font-bold leading-none tracking-[-0.04em] text-ink">
          {RQ_SCORE}
        </span>
        <span className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold text-green-600">
          <Icon icon="solar:arrow-up-bold" className="size-3" aria-hidden />
          +8 pts
        </span>
      </div>
    </div>
  );
}

function ReadinessState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-1">
      <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-orange-deep">
        {label}
      </span>
      <ScoreRing size={160} stroke={13} />
      <p className="text-center text-[14px] leading-relaxed text-ink-4">
        You&rsquo;re <span className="font-bold text-ink">{RQ_SCORE}% job-ready</span>
      </p>
    </div>
  );
}

/* ── Shared beat — Unlock Rewards ────────────────────────────────────────── */
function RewardsState() {
  return (
    <div className="space-y-5">
      {/* header + points balance, straight on the shared card — no nested card */}
      <div className="flex items-end justify-between">
        <div>
          <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-orange-deep">
            <Icon icon="solar:medal-star-bold" className="size-4" aria-hidden />
            GrowQR Points
          </span>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[52px] font-bold leading-[0.9] tracking-[-0.03em] text-ink">
              {POINTS.value}
            </span>
            <span className="mb-1.5 text-[15px] font-semibold text-ink-4">points</span>
          </div>
        </div>
        <span className="mb-1.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
          <Icon icon="solar:arrow-up-bold" className="size-3" aria-hidden />
          {POINTS.delta} this week
        </span>
      </div>

      {/* progress toward next tier */}
      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-cream-2">
          <div className="h-full w-[92%] rounded-full bg-orange" />
        </div>
        <p className="mt-2 text-[12.5px] font-medium text-ink-4">
          90 points to VIP Expo Access
        </p>
      </div>

      {/* perks unlocked — simple rows, no card chrome */}
      <div className="space-y-2.5 border-t border-black/[0.06] pt-4">
        {PERKS.map((perk) => (
          <div key={perk.title} className="flex items-center gap-3.5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${perk.iconBg}`}>
              <Icon icon={perk.icon} className={`size-6 ${perk.iconColor}`} aria-hidden />
            </span>
            <span className="flex-1 text-[16px] font-bold leading-tight text-ink">
              {perk.title}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
              <Icon icon="solar:check-circle-bold" className="size-3.5" aria-hidden />
              Unlocked
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── The two shared beats, appended to every agent's story ───────────────── */
const READINESS_STEP = {
  title: "Track Your Readiness",
  description: "Watch your RQ-Score climb with every action you take.",
  icon: "solar:medal-ribbon-star-bold",
};
const REWARDS_STEP = {
  title: "Unlock Rewards",
  description: "Earn points, event passes, and expert sessions as you grow.",
  icon: "solar:gift-bold",
};

export default function AgentStory({
  heading,
  steps,
  readinessLabel,
  cta,
}: AgentStoryProps) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — keep the CTA's existing label but
  // trigger the waitlist modal instead of navigating away, for USD visitors.
  const isWaitlist = !isLive;

  // Full step list = agent-specific steps + the two shared payoff beats.
  const allSteps = [...steps, READINESS_STEP, REWARDS_STEP];
  const readinessIndex = steps.length;
  const rewardsIndex = steps.length + 1;

  // Auto-advance so the section feels like watching the agent work. Skipped
  // entirely when the visitor prefers reduced motion.
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % allSteps.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduce, step, allSteps.length]);

  function renderStage(i: number) {
    if (i === readinessIndex) return <ReadinessState label={readinessLabel} />;
    if (i === rewardsIndex) return <RewardsState />;
    const ActiveVisual = steps[i].Visual;
    return <ActiveVisual />;
  }

  const active = allSteps[step];

  return (
    <section className="relative border-y border-black/5 bg-cream-2 py-12 md:py-16">
      <div className="mx-auto max-w-[1240px] px-6 md:px-14">
        {/* ── Mobile — one self-contained card that morphs step to step ──────
             The desktop rail-plus-visual split reads as two disconnected
             blocks when stacked, so small screens get a single card where the
             active step's icon, title, visual, and description slide together
             as one unit, driven by the same auto-advance + dot controls. */}
        <div className="lg:hidden">
          <h2 className="text-balance text-center text-[clamp(29px,7vw,38px)] font-bold leading-[1.06] tracking-[-0.02em] text-ink">
            {heading}
          </h2>

          <div className="mt-7 overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-lighter via-white to-[#f1f0fb] p-4 shadow-soft ring-1 ring-black/[0.04]">
            <div className="relative min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -24 }}
                  transition={{ duration: 0.38, ease }}
                  className="flex flex-col"
                >
                  {/* step header — icon, title + description grouped, centered */}
                  <div className="flex flex-col items-center px-3 text-center">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange text-white ring-2 ring-orange/20">
                      <Icon icon={active.icon} className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-3 text-[19px] font-bold leading-tight tracking-[-0.01em] text-ink">
                      {withAgentMarks(active.title)}
                    </h3>
                    <p className="mt-1.5 max-w-[34ch] text-[14px] leading-relaxed text-ink-4">
                      {withAgentMarks(active.description)}
                    </p>
                  </div>

                  {/* the illustration for this step */}
                  <div className="mt-5 flex flex-1 items-center rounded-2xl bg-white p-6 shadow-card ring-1 ring-black/[0.05]">
                    <div className="w-full" aria-hidden>
                      {renderStage(step)}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* progress dots — jump to any step; active one elongates */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {allSteps.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Go to ${s.title}`}
                  aria-current={i === step}
                  className="grid place-items-center py-1.5"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-500 ${
                      i === step ? "w-6 bg-orange" : "w-1.5 bg-black/15"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* CTA under the card */}
          <div className="mt-7 flex justify-center">
            {isWaitlist ? (
              <button
                type="button"
                onClick={() => {
                  trackAppCta({ ctaLabel: cta.label, ctaLocation: "agent_story", ctaAction: "waitlist" });
                  openWaitlist("agent-story");
                }}
                className="group inline-flex items-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
              >
                {cta.label}
                <Icon
                  icon="solar:arrow-right-linear"
                  className="size-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            ) : (
              <a
                href={cta.href}
                className="group inline-flex items-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
              >
                {cta.label}
                <Icon
                  icon="solar:arrow-right-linear"
                  className="size-5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
            )}
          </div>
        </div>

        {/* ── Desktop — step rail on the left, morphing illustration right ─── */}
        <div className="hidden items-stretch gap-10 lg:grid lg:grid-cols-2 lg:gap-16">
          {/* Left — the story */}
          <div className="flex flex-col justify-center">
            <h2 className="text-balance text-[clamp(32px,3.8vw,46px)] font-bold leading-[1.05] tracking-[-0.02em] text-ink">
              {heading}
            </h2>

            <ul className="mt-9 space-y-1">
              {allSteps.map((s, i) => {
                const isActive = i === step;
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      aria-current={isActive}
                      className="group flex w-full items-start gap-4 rounded-2xl px-3 py-3 text-left transition-colors duration-500"
                    >
                      {/* indicator rail */}
                      <span className="relative flex flex-col items-center self-stretch">
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-xl text-[13px] font-bold tabular-nums transition-colors duration-500 ${
                            isActive
                              ? "bg-orange text-white ring-2 ring-orange/20"
                              : "bg-black/[0.04] text-ink-4"
                          }`}
                        >
                          {isActive ? (
                            <Icon icon={s.icon} className="size-5" />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        {i < allSteps.length - 1 && (
                          <span className="relative mt-1 w-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                            <motion.span
                              className="absolute inset-x-0 top-0 rounded-full bg-orange"
                              initial={false}
                              animate={{ height: i < step ? "100%" : "0%" }}
                              transition={{ duration: 0.5, ease }}
                            />
                          </span>
                        )}
                      </span>

                      {/* text */}
                      <span className="flex-1 pb-3">
                        <span
                          className={`block text-[18px] font-bold tracking-[-0.01em] transition-colors duration-500 ${
                            isActive ? "text-ink" : "text-ink-3 opacity-70"
                          }`}
                        >
                          {withAgentMarks(s.title)}
                        </span>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.span
                              key="desc"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease }}
                              className="block overflow-hidden text-[15px] text-ink-4"
                            >
                              <span className="mt-1 block">{withAgentMarks(s.description)}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* CTA under the rail */}
            <div className="mt-8 pl-3">
              {isWaitlist ? (
                <button
                  type="button"
                  onClick={() => {
                  trackAppCta({ ctaLabel: cta.label, ctaLocation: "agent_story", ctaAction: "waitlist" });
                  openWaitlist("agent-story");
                }}
                  className="group inline-flex items-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
                >
                  {cta.label}
                  <Icon
                    icon="solar:arrow-right-linear"
                    className="size-5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              ) : (
                <a
                  href={cta.href}
                  className="group inline-flex items-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-6 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
                >
                  {cta.label}
                  <Icon
                    icon="solar:arrow-right-linear"
                    className="size-5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              )}
            </div>
          </div>

          {/* Right — the illustration that follows the active step */}
          <div className="min-h-[420px]">
            <Stage>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.42, ease }}
                >
                  {renderStage(step)}
                </motion.div>
              </AnimatePresence>
            </Stage>
          </div>
        </div>
      </div>
    </section>
  );
}
