"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AGENT_URL } from "@/lib/agentMedia";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { trackAppCta } from "@/lib/analytics";

export default function FinalCTA() {
  const reduce = useReducedMotion();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — keep the CTA's existing label but
  // trigger the waitlist modal instead of navigating away, for USD visitors.
  const isWaitlist = !isLive;

  return (
    <section className="px-6 py-16 md:px-14 md:py-24">
      <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[36px] bg-ink px-6 py-14 text-center sm:py-20 md:px-14 md:py-28">
        {/* subtle gradient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,106,47,.35) 0%, rgba(255,106,47,.10) 30%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,106,47,.5) 0%, transparent 70%)",
          }}
        />

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 22 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-[820px]"
        >
          <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.04em] text-white sm:text-[32px] md:whitespace-nowrap md:text-[44px]">
            Your Next Interview Could Be{" "}
            <span className="text-orange">the One.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-[18px] leading-[1.7] text-white/80 md:text-[20px]">
            Turn interview nerves into your advantage.
          </p>
          {isWaitlist ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({
                  ctaLabel: "Start your free mock interview",
                  ctaLocation: "vera-final-cta",
                  ctaAction: "waitlist",
                });
                openWaitlist("vera-final-cta");
              }}
              className="group mt-10 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-5 text-[17px] font-bold text-white shadow-[0_18px_40px_-12px_rgba(255,106,47,0.7)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark sm:w-auto"
            >
              Start your free mock interview
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </span>
            </button>
          ) : (
            <a
              href={AGENT_URL["RQ-Vera"]}
              className="group mt-10 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-5 text-[17px] font-bold text-white shadow-[0_18px_40px_-12px_rgba(255,106,47,0.7)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark sm:w-auto"
            >
              Start your free mock interview
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </span>
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
}
