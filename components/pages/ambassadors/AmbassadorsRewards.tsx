"use client";

import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { rewardCards, APPLICATIONS_OPEN } from "./ambassadors-data";

const rewardImages = [
  "/ambassador/rewards-vectors /swag-kit.png",
  "/ambassador/rewards-vectors /Public-Recognition.png",
  "/ambassador/rewards-vectors /exclusive-events.png",
  "/ambassador/rewards-vectors /monetary-rewards.png",
  "/ambassador/rewards-vectors /event-sponsorship.png",
  "/ambassador/rewards-vectors /Certificate -LoR.png",
];

export default function AmbassadorsRewards() {
  return (
    <section id="rewards" className="bg-[#FAFAF9] py-10 md:py-14 lg:py-16 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">

        <Reveal direction="up" offset={20}>
          <div className="mb-6 lg:mb-8">
            <Eyebrow>Rewards &amp; Recognition</Eyebrow>
            <h2 className="mt-3 text-[36px] md:text-[48px] lg:text-[52px] font-medium tracking-[-0.05em] leading-[1.05] text-ink lg:whitespace-nowrap">
              Elite access for <span className="text-orange">elite performance.</span>
            </h2>
          </div>
        </Reveal>

        {/* Reward cards — vector left, text right */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rewardCards.map((reward, idx) => (
            <Reveal key={reward.title} direction="up" offset={20} delay={idx * 0.05}>
              <div className="group h-full flex rounded-2xl border border-black/[0.07] bg-white overflow-hidden transition-all duration-300 hover:border-orange/22 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-14px_rgba(17,24,39,0.12)]">

                {/* Left — illustration panel */}
                <div className="relative w-[120px] lg:w-[130px] shrink-0 bg-gradient-to-b from-[#F2F2F2] to-[#F8F8F8] flex items-center justify-center overflow-hidden">
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 100% 90% at 50% 60%, rgba(0,0,0,0.04), transparent 68%)",
                    }}
                  />
                  <div className="relative z-10 w-[90px] h-[90px] md:w-[100px] md:h-[100px] lg:w-[104px] lg:h-[104px] transition-transform duration-500 group-hover:scale-[1.09]">
                    <Image
                      src={rewardImages[idx]}
                      alt={reward.title}
                      fill
                      sizes="120px"
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px shrink-0 bg-black/[0.05]" />

                {/* Right — content */}
                <div className="flex flex-col justify-center flex-1 px-5 md:px-6 py-5 lg:py-6 gap-1.5">
                  <span className="inline-flex w-fit items-center rounded-full bg-orange/8 text-orange px-2.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.12em] mb-0.5">
                    {reward.badge}
                  </span>
                  <h4 className="text-[15px] md:text-[16px] font-semibold tracking-[-0.02em] text-ink leading-snug">
                    {reward.title}
                  </h4>
                  <p className="text-[12px] md:text-[12.5px] text-ink-4 leading-relaxed">
                    {reward.copy}
                  </p>
                </div>

              </div>
            </Reveal>
          ))}

          {/* Internship — premium full-width card */}
          <Reveal direction="up" offset={20} delay={0.3} className="sm:col-span-2 lg:col-span-3">
            <div className="group relative flex rounded-2xl overflow-hidden bg-[#1C1C1A] border border-white/[0.08] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_-12px_rgba(255,106,47,0.22)]">

              {/* Subtle left glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 40% 100% at 0% 50%, rgba(255,106,47,0.10), transparent 70%)" }}
              />

              {/* Image panel — hidden on mobile to save space */}
              <div className="hidden sm:flex relative w-[140px] md:w-[160px] shrink-0 bg-[#0F0F0E] items-center justify-center overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{ background: "radial-gradient(ellipse 100% 80% at 50% 60%, rgba(255,106,47,0.10), transparent 70%)" }}
                />
                <div className="relative z-10 w-[88px] h-[88px] md:w-[100px] md:h-[100px] transition-transform duration-500 group-hover:scale-[1.08]">
                  <Image
                    src="/ambassador/rewards-vectors /internship.png"
                    alt="Internship Opportunities"
                    fill
                    sizes="100px"
                    className="object-contain drop-shadow-[0_0_28px_rgba(255,106,47,0.40)]"
                  />
                </div>
              </div>

              {/* Divider — hidden on mobile */}
              <div className="hidden sm:block w-px shrink-0 bg-white/[0.06]" />

              {/* Content */}
              <div className="relative z-10 flex flex-1 flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-7 md:px-9 py-5 md:py-6">

                {/* Text block */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/[0.08] text-amber-300 px-2.5 py-[3px] text-[9px] font-bold uppercase tracking-[0.14em] mb-0.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    Top Tier Unlock
                  </span>
                  <h4 className="text-[17px] md:text-[22px] font-semibold tracking-[-0.03em] text-white leading-snug">
                    Internship Opportunities
                  </h4>
                  <p className="text-[12px] md:text-[12.5px] text-white/40 leading-relaxed max-w-[480px]">
                    Priority access to high-impact roles and industry connections across the GrowQR partner ecosystem — fast-track to real offers.
                  </p>
                </div>

                {/* CTA */}
                <a
                  href="/ambassadors/apply"
                  className="shrink-0 inline-flex w-fit items-center gap-2 rounded-full bg-orange px-5 py-2.5 text-[13px] font-semibold text-white tracking-[-0.01em] transition-all duration-200 hover:bg-orange/90 hover:shadow-[0_0_24px_rgba(255,106,47,0.4)]"
                >
                  {APPLICATIONS_OPEN ? "Apply & Unlock" : "Get Notified"}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>

              </div>

            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}
