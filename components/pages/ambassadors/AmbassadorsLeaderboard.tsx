"use client";

import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";

import Image from "next/image";

const tiers = [
  { image: "/badges/gold.png", title: "Gold", desc: "Top 1–3" },
  { image: "/badges/silver.png", title: "Silver", desc: "Top 4–10" },
  { image: "/badges/bronze.png", title: "Bronze", desc: "Top 10–20" },
  { image: "/badges/rising_star.png", title: "Rising Star", desc: "New Joiners" },
];

export default function AmbassadorsLeaderboard() {
  return (
    <section className="bg-white border-t border-black/5 py-16 md:py-24 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={20}>
          <div className="mb-12 text-center max-w-[680px] mx-auto flex flex-col items-center">
            <Eyebrow>Ambassador of the Month</Eyebrow>
            <h2 className="mt-4 text-[28px] md:text-[36px] lg:text-[42px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
              Achievement badges that turn every action into <span className="text-orange">impact.</span>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-10">
          {tiers.map((tier, idx) => (
            <Reveal key={tier.title} direction="up" offset={20} delay={idx * 0.1}>
              <div 
                className="group flex flex-col items-center justify-center py-10 px-6 rounded-2xl border border-black/[0.06] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.08)] hover:border-black/10"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28 mb-5 transition-transform duration-300 group-hover:scale-[1.08] drop-shadow-sm">
                  <Image 
                    src={tier.image} 
                    alt={`${tier.title} badge`}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-[18px] md:text-[20px] font-semibold tracking-[-0.02em] text-ink">
                  {tier.title}
                </h3>
                <p className="text-[12px] md:text-[12.5px] font-semibold text-ink-4 mt-2 uppercase tracking-[0.1em]">
                  {tier.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
