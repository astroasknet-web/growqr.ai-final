"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Check, ArrowRight, Play, X } from "lucide-react";
import { AgentName } from "@/components/ui/AgentName";
import { AGENT_URL } from "@/lib/agentMedia";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { trackAppCta } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

const colVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const BENEFITS = [
  "Role-specific interview questions",
  "Real-time AI feedback & scoring",
];

export default function Hero() {
  const reduce = useReducedMotion();
  const [videoOpen, setVideoOpen] = useState(false);
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — swap the CTA to a waitlist signup for
  // USD visitors.
  const isWaitlist = !isLive;

  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [videoOpen]);

  return (
    <section className="relative overflow-hidden bg-white pt-28 pb-16 md:pt-36 md:pb-24">
      {/* soft ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-[-10%] h-[640px] w-[640px] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,106,47,.14) 0%, rgba(255,170,90,.08) 40%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-14 px-6 md:px-14 lg:min-h-[600px] lg:grid-cols-2 lg:gap-12">
        {/* LEFT - copy */}
        <motion.div
          variants={reduce ? undefined : colVariants}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
        >
          <motion.div variants={reduce ? undefined : itemVariants}>
            {/* Identity chip + Watch button, side by side on one row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              {/* Identity badge — introduces the agent (quieter than the Watch button) */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-black/[0.07] bg-white/70 py-1.5 pl-1.5 pr-4 shadow-[0_4px_14px_-10px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.02] backdrop-blur-sm">
                <Image
                  src="/agents/roadmaps/veera-interview.png"
                  alt="RQ-Vera, your interviewer"
                  width={40}
                  height={40}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-orange/25"
                />
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3 sm:text-[14px]">
                  <span className="font-bold text-ink">Meet <AgentName name="RQ-Vera" /></span>
                </span>
              </div>

              {/* Watch-intro button — the clear, playable control (opens the video modal) */}
              <button
                type="button"
                onClick={() => setVideoOpen(true)}
                aria-label="Play RQ-Vera intro video"
                className="group inline-flex items-center gap-2.5 rounded-full border border-black/[0.08] bg-white/95 py-2 pl-2 pr-4 text-[14px] font-semibold tracking-[-0.01em] text-ink shadow-[0_8px_22px_-12px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.02] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange/40 hover:shadow-[0_14px_30px_-12px_rgba(255,106,47,0.55)]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-orange to-orange-dark text-white shadow-[0_4px_10px_-3px_rgba(255,106,47,0.6)] ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105">
                  <Play className="h-3.5 w-3.5 translate-x-[0.5px] fill-current" strokeWidth={0} aria-hidden />
                </span>
                Watch intro
              </button>
            </div>
          </motion.div>

          <motion.h1
            variants={reduce ? undefined : itemVariants}
            className="mt-5 text-[34px] font-bold leading-[1.02] tracking-[-0.04em] text-ink sm:text-[40px] md:text-[58px] xl:text-[64px]"
          >
            Ace Your Upcoming
            <br />
            <span className="text-orange">Job Interviews.</span>
          </motion.h1>

          <motion.p
            variants={reduce ? undefined : itemVariants}
            className="mt-6 max-w-[480px] text-[18px] leading-[1.7] text-ink-2 md:text-[20px]"
          >
Practice real questions. Get instant feedback.
          </motion.p>

          <motion.ul
            variants={reduce ? undefined : itemVariants}
            className="mt-8 flex flex-col gap-3.5"
          >
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-[16px] font-semibold text-ink md:text-[18px]">
                  {b}
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={reduce ? undefined : itemVariants} className="mt-10">
            {isWaitlist ? (
              <button
                type="button"
                onClick={() => {
                  trackAppCta({
                    ctaLabel: "Join the Waitlist",
                    ctaLocation: "vera-hero",
                    ctaAction: "waitlist",
                  });
                  openWaitlist("vera-hero");
                }}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-orange py-4 pl-7 pr-5 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark sm:w-auto sm:justify-start"
              >
                Join the Waitlist
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                </span>
              </button>
            ) : (
              <a
                href={AGENT_URL["RQ-Vera"]}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-xl bg-orange py-4 pl-7 pr-5 text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark sm:w-auto sm:justify-start"
              >
                Start Mock Interview
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                </span>
              </a>
            )}
          </motion.div>
        </motion.div>

        {/* RIGHT - provided hero image on a soft gradient backdrop */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="relative hidden md:block"
        >
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-lighter via-white to-orange-light/40 p-5 shadow-soft md:p-8">
            <Image
              src="/agent-subpage/sample/hero-interview.png"
              alt="AI mock interview interface showing a candidate on video with live interview questions"
              width={1400}
              height={1150}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-auto w-full drop-shadow-[0_24px_48px_rgba(0,0,0,0.10)]"
            />
          </div>
        </motion.div>
      </div>

      {/* video modal */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setVideoOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Meet RQ-Vera video"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setVideoOpen(false)}
                aria-label="Close video"
                className="absolute -top-4 -right-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-lg transition-colors hover:bg-orange hover:text-white"
              >
                <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              </button>
              <video
                src="/agents-video/vera.mp4"
                controls
                autoPlay
                playsInline
                className="block h-[85vh] max-h-[85vh] w-auto max-w-[92vw] rounded-[28px] bg-black object-contain shadow-2xl ring-1 ring-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
