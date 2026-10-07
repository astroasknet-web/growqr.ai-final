"use client";

import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { STATS } from "./community-data";

export default function CommunityImpact() {
  return (
    <section className="bg-white py-12 md:py-20 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={20}>
          <div className="mb-10 lg:mb-12 text-center">
            <Eyebrow center>Community Impact</Eyebrow>
            <h2 className="mt-3 text-[32px] md:text-[44px] font-medium tracking-[-0.04em] leading-[1.1] text-ink lg:whitespace-nowrap">
              Built by an unstoppable <span className="text-orange">network.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((stat, idx) => (
            <Reveal key={stat.label} direction="up" offset={20} delay={idx * 0.06}>
              <div className="group flex h-full flex-col items-center justify-center rounded-xl border border-black/8 bg-white px-3 py-6 sm:px-4 sm:py-10 text-center transition-all duration-300 hover:border-orange/20 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(17,24,39,0.14)]">
                <div className="w-full whitespace-nowrap text-[26px] min-[380px]:text-[32px] sm:text-[40px] lg:text-[3.25rem] font-medium tracking-[-0.04em] leading-[0.95] text-ink tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-2.5 text-[15px] md:text-[17px] font-semibold text-ink-3">
                  {stat.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
