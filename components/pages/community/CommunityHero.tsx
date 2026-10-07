"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";

const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

const TRUST_PFPS = [
  "/shared/avatars/male2.jpg",
  "/shared/avatars/female2.jpeg",
  "/shared/avatars/maleindian5.webp",
  "/shared/avatars/male7.webp",
];

function CommunityTrustBadge() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex -space-x-3">
        {TRUST_PFPS.map((src) => (
          <div key={src} className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white bg-cream shadow-sm">
            <Image alt="Member" src={src} fill sizes="40px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden
              className="star-pop-in h-3.5 w-3.5 fill-[#F59E0B] drop-shadow-[0_1px_3px_rgba(245,158,11,0.4)]"
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>
        <p className="mt-0.5 text-[13px] font-medium text-black/55">Loved by people like you</p>
      </div>
    </div>
  );
}

const IMAGES = [
  { src: "/community/c0.webp", alt: "GrowQR community members collaborating" },
  { src: "/community/c1.webp", alt: "Community networking event" },
  { src: "/community/member-c2.webp",  alt: "Students growing together" },
  { src: "/community/member-c3.webp",  alt: "GrowQR network" },
];

export default function CommunityHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-cream pt-28 md:pt-36 lg:pt-44 pb-14 md:pb-20 px-6 md:px-14">
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
            <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange to-[#ff8c55] px-4 py-2 mb-7 shadow-[0_6px_20px_rgba(255,106,47,0.4)]">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-[12px] md:text-[13px] font-bold uppercase tracking-[0.12em] text-white">
                GrowQR Community
              </span>
            </div>

            <h1 className="text-[30px] min-[400px]:text-[34px] sm:text-[44px] md:text-[54px] lg:text-[62px] font-medium tracking-[-0.04em] md:tracking-[-0.05em] leading-[1.02] sm:leading-[0.97] text-ink text-balance">
              Where ambition<br className="hidden sm:inline" /> finds its{" "}
              <span className="text-orange">tribe.</span>
            </h1>

            <p className="mt-5 max-w-[420px] text-[15px] md:text-[16px] text-ink-3 leading-relaxed">
              Skills, Connections, and Opportunities.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5">
              <a
                href="#finder"
                className="inline-flex items-center gap-2 bg-orange text-white text-[15px] font-bold px-7 py-3.5 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_30px_-10px_rgba(255,106,47,0.55)]"
              >
                Explore Communities <ArrowRight className="h-4 w-4" />
              </a>
              <CommunityTrustBadge />
            </div>
          </div>
        </Reveal>

        {/* Right — cycling image */}
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={IMAGES[index].src}
                    alt={IMAGES[index].alt}
                    fill
                    sizes="(max-width: 1024px) 80vw, 420px"
                    className="object-cover object-center"
                    priority={index === 0}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Subtle bottom gradient */}
              <div
                aria-hidden
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to top, rgba(10,12,20,0.22) 0%, transparent 50%)" }}
              />
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-3">
              {IMAGES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? "w-5 bg-orange" : "w-1.5 bg-black/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
