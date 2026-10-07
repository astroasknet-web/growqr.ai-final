"use client";

import { motion, useReducedMotion } from "framer-motion";

const LOGOS = ["Netflix", "amazon", "airbnb", "Spotify", "TESLA", "Bloomberg"];

export default function TrustedLogos() {
  const reduce = useReducedMotion();

  // Temporarily hidden across all agent pages — remove this line to restore.
  return null;

  return (
    <section className="border-y border-ink/[0.06] bg-cream-2 py-16 md:py-20">
      <div className="mx-auto max-w-[1240px] px-6 text-center md:px-14">
        <motion.h2
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-[24px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[28px] md:text-[40px]"
        >
          Trusted Interview Preparation for Leading Organizations
        </motion.h2>
      </div>

      {reduce ? (
        <div className="mx-auto mt-12 flex max-w-[1240px] flex-wrap items-center justify-center gap-x-12 gap-y-8 px-6 md:gap-x-20 md:px-14">
          {LOGOS.map((name) => (
            <span
              key={name}
              className="select-none text-2xl font-bold tracking-tight text-ink-4 opacity-70 grayscale md:text-[28px]"
            >
              {name}
            </span>
          ))}
        </div>
      ) : (
        <div className="group relative mt-12 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={i}
                className="mx-8 shrink-0 select-none whitespace-nowrap text-2xl font-bold tracking-tight text-ink-4 opacity-70 grayscale transition hover:opacity-100 md:mx-12 md:text-[28px]"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
