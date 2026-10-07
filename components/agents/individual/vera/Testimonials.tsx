"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

type Testimonial = {
  name: string;
  title: string;
  img: string;
  quote: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ajay Rathod",
    title: "Full Stack Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-ajay.jpeg",
    quote:
      "The AI caught every rambling answer and pushed me to be concise. I walked in calm and got the offer.",
  },
  {
    name: "Prasad Khandekar",
    title: "Software Engineer @Amdocs",
    img: "/agent-subpage/sample/testimonials/testimonial-prasad.jpeg",
    quote:
      "The instant feedback told me I was talking too fast and where to add structure. Fixed it before the real thing.",
  },
  {
    name: "Abhishek Karle",
    title: "Cybersecurity Engineer @Two",
    img: "/agent-subpage/sample/testimonials/testimonials-abhi.png",
    quote:
      "I practiced until the nerves were gone. By the real interview it felt like I had already done it.",
  },
  {
    name: "Atharva Daphal",
    title: ".NET Developer",
    img: "/agent-subpage/sample/testimonials/testimonial-atahrva-daphal.jpeg",
    quote:
      "The role-specific questions felt scarily accurate. Half of them came up in my real interview.",
  },
];

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_18px_40px_-16px_rgba(26,26,26,0.14)] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.05),0_30px_60px_-20px_rgba(26,26,26,0.22)] sm:p-9 md:p-10">
      <div className="flex items-center gap-1 text-orange">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-current" aria-hidden />
        ))}
      </div>
      <p className="mt-6 flex-1 text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">
        “{t.quote}”
      </p>
      <div className="mt-8 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.img}
          alt={t.name}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-orange/20"
        />
        <div>
          <p className="text-[17px] font-bold leading-tight text-ink">{t.name}</p>
          <p className="text-[14px] text-ink-4">{t.title}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const reduce = useReducedMotion();
  const [start, setStart] = useState(0);
  const total = TESTIMONIALS.length;

  // three visible on desktop, computed from the start index
  const visible = [0, 1, 2].map((o) => TESTIMONIALS[(start + o) % total]);

  const move = (dir: number) => setStart((s) => (s + dir + total) % total);

  return (
    <section className="bg-white px-6 py-20 md:px-14 md:py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[32px] md:whitespace-nowrap md:text-[46px]">
            Loved by People Who{" "}
            <span className="text-orange">Secured the Job</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] text-[18px] leading-[1.7] text-ink-2 md:text-[20px]">
            From interview anxiety to real job offers.
          </p>
        </div>

        {/* desktop: 3 cards with slider controls */}
        <div className="mt-14 hidden lg:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={start}
              initial={reduce ? undefined : { opacity: 0, x: 24 }}
              animate={reduce ? undefined : { opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-3 gap-6"
            >
              {visible.map((t, i) => (
                <Card key={`${start}-${i}`} t={t} />
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous testimonials"
              onClick={() => move(-1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-ink transition-colors hover:border-orange hover:text-orange"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to testimonial ${i + 1}`}
                  onClick={() => setStart(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === start ? "w-6 bg-orange" : "w-2 bg-black/15"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next testimonials"
              onClick={() => move(1)}
              className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-ink transition-colors hover:border-orange hover:text-orange"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>

        {/* mobile/tablet: snap-scroll rail */}
        <div className="-mx-6 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scroll-padding-left:1.5rem] lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-14 md:[scroll-padding-left:3.5rem] md:-mx-14">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="w-[85vw] max-w-[340px] shrink-0 snap-start sm:w-[360px]"
            >
              <Card t={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
