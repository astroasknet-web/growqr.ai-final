"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { withAgentMarks } from "@/components/ui/AgentName";

type Props = {
  /** Centered heading, can include <span className="text-orange"> accent. */
  heading: ReactNode;
  subtitle: string;
};

export default function SectionIntro({ heading, subtitle }: Props) {
  const reduce = useReducedMotion();

  return (
    <section className="bg-white px-6 pt-12 pb-4 md:px-14 md:pt-20">
      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-[720px] text-center"
      >
        <h2 className="text-[32px] font-bold leading-[1.04] tracking-[-0.04em] text-ink sm:text-[40px] md:text-[56px]">
          {heading}
        </h2>
        <p className="mx-auto mt-5 max-w-[520px] text-balance text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">
          {withAgentMarks(subtitle)}
        </p>
      </motion.div>
    </section>
  );
}
