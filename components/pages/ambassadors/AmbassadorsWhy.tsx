"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";

const slides = [
  {
    img: "/ambassador/heroambassador.jpg",
    alt: "Campus ambassadors organizing real-world events and campaigns",
    title: "Real World Exposure",
    copy: "Organize events, run campaigns, and solve real problems. Not just promote a brand.",
  },
  {
    img: "/ambassador/aipoweredgrowth.jpg",
    alt: "AI-powered growth tools for campus ambassadors",
    title: "AI Powered Growth",
    copy: "Early access to RQ-Score, career analytics, and personalized AI insights before anyone else.",
  },
  {
    img: "/ambassador/leadership.jpg",
    alt: "Ambassador leading a campus initiative",
    title: "Leadership Experience",
    copy: "Own campus initiatives, coordinate peers, and build real leadership credentials for your resume.",
  },
  {
    img: "/ambassador/elitenetworking.jpg",
    alt: "Students networking with working professionals and founders",
    title: "Elite Networking",
    copy: "Connect with ambitious students across the world and gain access to industry professionals, startup founders, and GrowQR's network.",
  },
];

const INTERVAL = 5500;

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const textVariants = {
  enter: { opacity: 0, y: 22 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function AmbassadorsWhy() {
  const [active, setActive] = useState(0);

  const go = useCallback((next: number) => setActive(next), []);
  const prev = () => go((active - 1 + slides.length) % slides.length);
  const next = () => go((active + 1) % slides.length);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="why" className="bg-cream/60 border-y border-black/5 py-10 md:py-14 lg:py-16 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        <Reveal direction="up" offset={20}>
          <div className="mb-6 lg:mb-8">
            <Eyebrow>Why GrowQR?</Eyebrow>
            <h2 className="mt-3 text-[32px] md:text-[42px] font-medium tracking-[-0.04em] leading-[1.1] text-ink">
              More Than a Title. <span className="text-orange">Real Growth</span>
            </h2>

          </div>
        </Reveal>

        <Reveal direction="up" offset={20}>
          <div className="relative overflow-hidden w-full min-h-[460px] md:min-h-[500px] lg:min-h-[540px]">
            {/* Slides — crossfade */}
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                variants={fadeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="absolute inset-0 overflow-hidden"
              >
                {/* Ken Burns zoom */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1.025 }}
                  animate={{ scale: 1.0 }}
                  transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                >
                  <Image
                    src={slides[active].img}
                    alt={slides[active].alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 1280px"
                    className="object-cover object-center"
                    priority={active === 0}
                  />
                </motion.div>

                {/* Gradient overlay */}
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,12,20,0.62) 0%, rgba(10,12,20,0.15) 38%, transparent 60%)",
                  }}
                />

                {/* Text */}
                <motion.div
                  variants={textVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 p-8 md:p-10 lg:p-12 pr-32 md:pr-40"
                >
                  <h3 className="text-[28px] md:text-[38px] font-medium tracking-[-0.03em] leading-tight text-white mb-2">
                    {slides[active].title}
                  </h3>
                  <p className="text-[15px] md:text-[16px] text-white/90 leading-relaxed max-w-[520px]">
                    {slides[active].copy}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md text-orange transition hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md text-orange transition hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-8 md:bottom-10 lg:bottom-12 right-8 md:right-10 lg:right-12 z-10 flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-6 bg-orange" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
              <motion.div
                key={`progress-${active}`}
                className="h-full bg-orange"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: INTERVAL / 1000, ease: "linear" }}
              />
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
