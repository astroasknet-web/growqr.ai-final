"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { eligibility, APPLICATIONS_OPEN } from "./ambassadors-data";

export default function AmbassadorsEligibility() {
  return (
    <section className="bg-white py-20 md:py-28 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">

        {/* Two-column: image left, criteria right — equal heights via stretch */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-stretch">

          {/* Left — image fills the full column height */}
          <Reveal direction="left" offset={32} className="h-full">
            <div className="relative h-full min-h-[420px] mx-auto w-full max-w-[480px] lg:max-w-none">
              {/* Scan brackets */}
              {[
                "top-0 left-0 border-t-2 border-l-2",
                "top-0 right-0 border-t-2 border-r-2",
                "bottom-0 left-0 border-b-2 border-l-2",
                "bottom-0 right-0 border-b-2 border-r-2",
              ].map((cls) => (
                <span key={cls} aria-hidden className={`absolute w-5 h-5 border-orange z-10 ${cls}`} style={{ margin: "-6px" }} />
              ))}
              <div className="absolute inset-0 overflow-hidden shadow-[0_24px_60px_-18px_rgba(17,24,39,0.22)]">
                <Image
                  src="/ambassador/networking.webp"
                  alt="Campus ambassadors connecting"
                  fill
                  sizes="(max-width: 1024px) 80vw, 560px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          </Reveal>

          {/* Right — criteria drives the row height */}
          <Reveal direction="right" offset={32} className="h-full">
            <div className="h-full flex flex-col justify-between py-2">

              {/* Heading */}
              <div>
                <Eyebrow>Requirements</Eyebrow>
                <h2 className="mt-3 text-[34px] md:text-[44px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
                  Who we&apos;re <span className="text-orange">looking for.</span>
                </h2>
              </div>

              {/* Numbered criteria rows — flex-1 fills remaining space */}
              <div className="flex flex-col divide-y divide-black/[0.06] my-8 flex-1">
                {eligibility.map((item, idx) => (
                  <div key={item.title} className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-orange/[0.02] -mx-3 px-3 rounded-lg flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-orange shrink-0 w-6">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-[16px] md:text-[18px] font-semibold tracking-[-0.02em] text-ink leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-black/[0.04] text-ink-4 px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div>
                <Link
                  href="/ambassadors/apply"
                  className="inline-flex items-center gap-2 bg-orange text-white text-[14px] font-semibold px-6 py-3 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {APPLICATIONS_OPEN ? "Apply Now" : "Get Notified"} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

            </div>
          </Reveal>
        </div>



      </div>
    </section>
  );
}
