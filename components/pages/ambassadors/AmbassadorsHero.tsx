"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { SEATS_REMAINING, APPLICATIONS_OPEN } from "./ambassadors-data";

export default function AmbassadorsHero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36 lg:pt-44 pb-14 md:pb-20 px-6 md:px-14">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 0%, rgba(255,106,47,0.12), transparent 65%)",
        }}
      />

      <div className="max-w-[1280px] mx-auto relative z-10 grid gap-12 lg:gap-16 lg:grid-cols-[1fr_420px] items-center">
        {/* Left — copy */}
        <Reveal direction="up" offset={32}>
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Program badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange to-[#ff8c55] px-4 py-2 mb-7 shadow-[0_6px_20px_rgba(255,106,47,0.4)]">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-[12px] md:text-[13px] font-bold uppercase tracking-[0.12em] text-white">
                GrowQR AI Global Campus Program
              </span>
            </div>

            <h1 className="text-[36px] sm:text-[48px] md:text-[60px] lg:text-[72px] font-medium tracking-[-0.04em] md:tracking-[-0.05em] leading-[0.95] text-ink">
              Build <span className="text-orange">AI-ready</span> talent<br />
              campus by campus.
            </h1>

            <p className="mt-6 max-w-[480px] text-[15px] md:text-[16px] text-ink-3 leading-relaxed">
              Lead initiatives, expand your network, and unlock meaningful career opportunities as a GrowQR Campus Ambassador.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/ambassadors/apply"
                className="inline-flex items-center gap-2 bg-orange text-white text-[14px] font-semibold px-7 py-3.5 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_30px_-10px_rgba(255,106,47,0.55)]"
              >
                {APPLICATIONS_OPEN ? <>Claim Your Spot <ArrowRight className="h-4 w-4" /></> : <>Get Notified <ArrowRight className="h-4 w-4" /></>}
              </Link>
              <a
                href="#why"
                className="inline-flex items-center gap-2 bg-white border border-black/12 text-ink text-[14px] font-semibold px-7 py-3.5 rounded-full transition hover:border-orange/40 hover:text-orange-deep"
              >
                Learn more
              </a>
            </div>
          </div>
        </Reveal>

        {/* Right — image */}
        <Reveal direction="right" offset={36}>
          <div className="relative mx-auto w-full max-w-[420px]">
            {/* Scan brackets */}
            {[
              "top-0 left-0 border-t-2 border-l-2",
              "top-0 right-0 border-t-2 border-r-2",
              "bottom-0 left-0 border-b-2 border-l-2",
              "bottom-0 right-0 border-b-2 border-r-2",
            ].map((cls) => (
              <span key={cls} aria-hidden className={`absolute w-5 h-5 border-orange z-10 ${cls}`} style={{ margin: "-6px" }} />
            ))}
            <div className="relative aspect-[4/5] overflow-hidden shadow-[0_32px_72px_-20px_rgba(17,24,39,0.30)]">
              <Image
                src="/ambassador/hero-ambassador.webp"
                alt="Campus students collaborating with GrowQR"
                fill
                sizes="(max-width: 1024px) 80vw, 420px"
                className="object-cover"
                style={{ objectPosition: "center 20%" }}
                priority
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
