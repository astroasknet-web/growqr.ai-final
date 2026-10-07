"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Reveal from "@/components/ui/Reveal";
import { PULSE_ACTIVITY } from "./community-data";

/**
 * CommunityPulse — a single live "what's happening right now" card that cycles
 * through real community moments one at a time, so the section always feels in
 * motion. Sits under the impact stats on the community landing page.
 */
const TICK_MS = 2800;

export default function CommunityPulse() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % PULSE_ACTIVITY.length);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const activity = PULSE_ACTIVITY[index];

  return (
    <section className="relative overflow-hidden bg-cream py-14 md:py-20 px-6 md:px-14">
      <div className="mx-auto max-w-4xl">
        <Reveal direction="up" offset={20}>
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 flex items-center justify-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange/70 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange" />
              </span>
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-orange">
                Happening now
              </span>
            </div>

            <h2 className="text-[28px] md:text-[38px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
              The community is <span className="text-orange">in motion.</span>
            </h2>
          </div>
        </Reveal>

        {/* Live card */}
        <Reveal direction="up" offset={20} delay={0.08}>
          <div className="group relative mt-10 flex items-center gap-5 overflow-hidden rounded-[24px] border border-black/8 bg-gradient-to-br from-orange/[0.05] via-white to-white px-6 py-6 md:px-9 md:py-8 shadow-[0_24px_60px_-40px_rgba(17,24,39,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:border-orange/25 hover:shadow-[0_24px_60px_-30px_rgba(255,106,47,0.35)]">
            {/* soft corner glow */}
            <div className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-orange/10 blur-3xl" aria-hidden />

            {/* Swapping content (icon + text) */}
            <div className="relative min-h-[64px] min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activity.text}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4 md:gap-5"
                >
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/15 to-orange/5 text-orange ring-1 ring-inset ring-orange/15 shadow-[0_8px_20px_-10px_rgba(255,106,47,0.5)]">
                    <Icon icon={activity.icon} width={30} height={30} aria-hidden />
                  </span>
                  <p className="text-[17px] md:text-[19px] font-medium leading-snug tracking-[-0.01em] text-ink">
                    {activity.text}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Static live pill — anchors the right edge */}
            <div className="relative hidden shrink-0 items-center gap-2 rounded-full border border-orange/20 bg-orange/[0.07] px-4 py-2 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange/70 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange" />
              </span>
              <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-orange">
                Live
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
