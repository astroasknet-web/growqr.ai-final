"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { JOURNEY_STEPS } from "./community-data";

const STEP_INTERVAL = 1600;

export default function CommunityJourney() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % JOURNEY_STEPS.length);
    }, STEP_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="bg-cream py-12 md:py-20 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={20}>
          <div className="mb-12 lg:mb-14 text-center max-w-[560px] mx-auto">
            <Eyebrow center>Community Journey</Eyebrow>
              <h2 className="mt-3 text-[32px] md:text-[42px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
              Grow Together. <span className="text-orange">Go Further.</span>
            </h2>
          </div>
        </Reveal>

        <div className="relative">

          <div className="grid grid-cols-2 gap-y-10 gap-x-4 sm:grid-cols-3 lg:grid-cols-6">
            {JOURNEY_STEPS.map((step, idx) => {
              const isActive = idx === active;
              const isDone = idx < active;

              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Step number chip */}
                  <span
                    className={`absolute -top-2 right-1/2 z-10 grid h-5 w-5 translate-x-[40px] place-items-center rounded-full text-[10px] font-bold transition-all duration-300 sm:translate-x-[36px] ${
                      isActive
                        ? "bg-orange text-white shadow-[0_4px_10px_-2px_rgba(255,106,47,0.6)]"
                        : isDone
                        ? "bg-orange/70 text-white"
                        : "bg-black/10 text-ink-4"
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Icon tile */}
                  <motion.div
                    animate={{ scale: isActive ? 1.08 : 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={`grid h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 place-items-center rounded-3xl border transition-all duration-300 ${
                      isActive
                        ? "border-orange/20 bg-orange text-white shadow-[0_16px_40px_-12px_rgba(255,106,47,0.55)]"
                        : isDone
                        ? "border-orange/20 bg-orange/10 text-orange shadow-[0_6px_20px_-12px_rgba(255,106,47,0.25)]"
                        : "border-black/[0.07] bg-white text-orange/40 shadow-[0_8px_24px_-12px_rgba(17,24,39,0.10)]"
                    }`}
                  >
                    <Icon icon={step.icon} className="h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11" />
                  </motion.div>

                  {/* Label */}
                  <span
                    className={`mt-4 text-[16px] md:text-[17px] font-semibold tracking-[-0.01em] transition-colors duration-300 ${
                      isActive ? "text-ink" : isDone ? "text-ink" : "text-ink/35"
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
