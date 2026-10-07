"use client";

import { ArrowRight, Phone, Mail } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export default function CommunityCTA() {
  return (
    <section className="relative isolate overflow-hidden border-y border-black/5 bg-white py-12 sm:py-16 md:py-28 px-6 md:px-14">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(255,106,47,0.09)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl flex flex-col items-center text-center">
        <Reveal direction="up" offset={24}>

          <h2 className="text-[38px] sm:text-[50px] md:text-[62px] font-medium tracking-[-0.04em] text-ink leading-[1.05]">
            Find your people.
            <br />
            <span className="text-orange">Build your future.</span>
          </h2>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#finder"
              className="group inline-flex items-center justify-center gap-2 bg-orange text-white text-[15px] font-semibold px-7 py-3.5 rounded-[14px] border border-orange/80 transition-all duration-300 shadow-[0_0_28px_-8px_rgba(255,106,47,0.5)] hover:bg-orange-dark hover:shadow-[0_0_38px_-8px_rgba(255,106,47,0.65)] hover:scale-[1.02] active:scale-[0.99]"
            >
              Explore Communities
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-2 px-5 py-2.5 rounded-2xl bg-white/70 border border-black/7 backdrop-blur-sm shadow-[0_2px_12px_-6px_rgba(0,0,0,0.08)]">
            <a
              href="tel:+917851943366"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-4 px-3 transition hover:text-orange"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              +91-7851943366
            </a>
            <span className="h-4 w-px bg-black/10" />
            <a
              href="mailto:community@growqr.ai"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-4 px-3 transition hover:text-orange"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              community@growqr.ai
            </a>
          </div>

        </Reveal>
      </div>
    </section>
  );
}
