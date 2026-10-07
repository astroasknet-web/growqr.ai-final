import Link from "next/link";
import { ArrowRight } from "lucide-react";
import InternshipVideo from "./InternshipVideo";
import { APPLY_PATH } from "./internship-data";

export default function InternshipHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-14 pt-28 md:px-14 md:pb-20 md:pt-36 lg:pt-40">
      {/* Ambient glow, same recipe as the other program pages */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 70% 0%, rgba(255,106,47,0.12), transparent 65%)",
        }}
      />

      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        {/* Left, the pitch */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange to-[#ff8c55] px-4 py-2 shadow-[0_6px_20px_rgba(255,106,47,0.4)]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-white md:text-[13px]">
              GrowQR Internship Program
            </span>
          </div>

          <h1 className="text-[36px] font-medium leading-[0.95] tracking-[-0.04em] text-ink sm:text-[48px] md:text-[60px] md:tracking-[-0.05em] lg:text-[68px]">
            Start your career<br />
            where <span className="text-orange">AI gets built.</span>
          </h1>

          <p className="mt-6 max-w-[480px] text-[15px] leading-relaxed text-ink-3 md:text-[16px]">
            Remote, 3 to 6 months, mentored throughout. Watch the walkthrough,
            then apply in three minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <a
              href="#roles"
              className="inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_30px_-10px_rgba(255,106,47,0.55)]"
            >
              See open roles <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href={APPLY_PATH}
              className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white px-7 py-3.5 text-[14px] font-semibold text-ink transition hover:border-orange/40 hover:text-orange-deep"
            >
              Apply now
            </Link>
          </div>
        </div>

        {/* Right, the intro film. Nudged in from the container edge on
            desktop so it sits closer to the copy it belongs to. */}
        <div className="lg:-translate-x-6">
          <InternshipVideo />
        </div>
      </div>
    </section>
  );
}
