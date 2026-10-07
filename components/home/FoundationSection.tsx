"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import GrowthJourney, { BUSINESS_JOURNEY } from "./GrowthJourney";
import { Eyebrow, SectionHeading } from "./SectionHeader";
import { useHomeMode } from "@/components/layout/HomeMode";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/*  Motion                                                             */
/* ------------------------------------------------------------------ */

const colVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export default function FoundationSection() {
  const reduce = useReducedMotion();
  const { mode } = useHomeMode();
  const isEnterprise = mode === "enterprise";

  return (
    <section
      role="region"
      aria-label="Your journey, powered by our intelligence"
      className="relative w-full overflow-x-hidden border-y border-black/5 bg-white px-6 py-14 md:px-14 lg:py-20"
    >
      <div className="relative mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col items-center gap-8 lg:gap-10">
          {/* Centered header — badge + heading */}
          <motion.div
            variants={reduce ? undefined : colVariants}
            initial={reduce ? undefined : "hidden"}
            animate={reduce ? undefined : "show"}
            className="w-full text-center"
          >
            <motion.div variants={reduce ? undefined : itemVariants}>
              <Eyebrow center>A Unified Intelligent System</Eyebrow>
            </motion.div>

            <motion.div variants={reduce ? undefined : itemVariants}>
              <SectionHeading className="font-semibold leading-[1.08] tracking-[-0.03em] text-[22px] sm:text-[30px] md:text-[38px] md:leading-[1.04] lg:text-[clamp(28px,3.4vw,46px)] whitespace-nowrap">
                Your <span className="text-orange">Growth</span> Starts Here
              </SectionHeading>
            </motion.div>
          </motion.div>

          {/* Centered growth-journey roadmap — business content in enterprise mode */}
          <div className="flex w-full items-center justify-center">
            {isEnterprise ? <GrowthJourney {...BUSINESS_JOURNEY} /> : <GrowthJourney />}
          </div>
        </div>
      </div>
    </section>
  );
}
