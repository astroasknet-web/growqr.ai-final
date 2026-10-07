/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { visibleExperts, DEFAULT_EXPERT_SHADE } from "@/features/experts/data/experts-data";
import { ExpertCard } from "@/features/experts/components/ExpertCard";

/* ══════════════════════════════════════════════════════════════════════════
   ExpertsPage — React sample UI ported to Next.js
   Only change from original: green-500 → orange (#FF6A2F)
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── SectionHeader ─────────────────────────────────────────────────────── */
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-orange text-lg leading-[25.2px]">{label}</h6>
      <h3 className="text-ink text-3xl font-semibold leading-9 md:text-5xl md:leading-[57.6px]">
        {title}
      </h3>
    </div>
  );
}

/* ─── StatItem (count-up on scroll) ─────────────────────────────────────── */
function StatItem({
  value,
  suffix = "",
  label,
}: {
  value: string;
  suffix?: string;
  label: string;
}) {
  const numeric = parseInt(value.replace(/,/g, ""), 10);
  const isNumeric = !Number.isNaN(numeric) && /^[\d,]+$/.test(value);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (!isNumeric) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numeric));
            if (progress < 1) requestAnimationFrame(animate);
            else setCount(numeric);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numeric, isNumeric]);

  return (
    <div ref={ref} className="flex flex-col gap-2 text-center md:text-left">
      <h2 className="text-ink text-[26px] font-semibold leading-8 text-center md:text-6xl md:leading-[60px] md:text-left">
        <span className="tabular-nums">
          {isNumeric ? count.toLocaleString() : value}
        </span>
        {suffix}
      </h2>
      <h6 className="text-black/70 text-sm leading-snug md:text-lg md:leading-[25.2px]">{label}</h6>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════════════ */
export default function ExpertsPage() {
  return (
    <div className="text-black text-base font-normal bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        {/* Hidden for now — restore when ready */}
        {/* <TestimonialsSection /> */}
        <RQScoreSection />
        <BenefitsSection />
        {/* PricingSection hidden for launch — re-add <PricingSection /> to restore */}
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

/* ─── TrustBadge (PFP stack + animated stars) ───────────────────────────── */
const TRUST_PFPS = [
  "/experts/testimonials/kanika/jaybhateja.jpeg",
  "/experts/testimonials/khyati/nandita.jpeg",
  "/experts/testimonials/NireeshKumari.webp",
  "/experts/testimonials/dinesh/irina.png",
];

function TrustBadge() {
  return (
    <div className="flex items-center gap-3.5">
      {/* Overlapping profile pictures */}
      <div className="flex -space-x-3">
        {TRUST_PFPS.map((src) => (
          <div
            key={src}
            className="h-11 w-11 rounded-full ring-2 ring-white overflow-hidden bg-cream-2 shadow-sm"
          >
            <img
              alt="Member"
              src={src}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Stars + label */}
      <div className="flex flex-col items-start">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              aria-hidden
              className="star-pop-in h-4 w-4 fill-[#F59E0B] drop-shadow-[0_1px_3px_rgba(245,158,11,0.4)]"
            >
              <path d={STAR_PATH} />
            </svg>
          ))}
        </div>
        <p className="mt-1 text-sm font-medium text-black/60">Trusted by professionals</p>
      </div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="bg-cream">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="pt-32 md:pt-52 pb-16 md:pb-20">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <h1 className="text-ink text-[40px] tracking-[-1px] leading-10 md:text-6xl md:tracking-[-1.5px] md:leading-[60px]" style={{ fontWeight: 900 }}>
                Access World-Class Experts.
              </h1>
              <h6 className="text-black/70 text-lg leading-[25.2px] max-w-[600px]">
                Book personalized sessions with vetted specialists across domains.
                <br />
                Available as part of your subscription.
              </h6>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              <Link
                href="/experts/all"
                className="group items-center bg-orange text-white shadow-[0_6px_0_0_rgb(0,0,0)] inline-flex gap-2 w-fit border border-orange px-7 py-4 rounded-full hover:bg-orange-dark hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 transition-all duration-200 active:translate-y-1"
              >
                <span className="font-semibold">Explore Experts</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path d="M7 17L17 7M17 7H8M17 7v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <TrustBadge />
            </div>
          </div>
        </div>
      </div>

      {/* Instructor rail — drag to scroll (mouse + touch) */}
      <InstructorRail />
    </section>
  );
}

/* ─── Instructor rail — drag-to-scroll on mouse & touch, gentle auto-scroll ──── */
function InstructorRail() {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false, captured: false });
  const hover = useRef(false);
  const lastInteract = useRef(0);

  /* Keep scrollLeft inside the middle copy so the loop is seamless both ways. */
  const wrap = (el: HTMLDivElement) => {
    const third = el.scrollWidth / 3;
    if (third <= 0) return;
    if (el.scrollLeft >= third * 2) el.scrollLeft -= third;
    else if (el.scrollLeft < third) el.scrollLeft += third;
  };

  /* Start centred on the middle copy. */
  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = el.scrollWidth / 3;
  }, []);

  /* Gentle auto-scroll — pauses on hover and for a beat after any interaction.
     For mobile battery/CPU the RAF loop only runs while the rail is on-screen
     and the tab is visible, and is skipped entirely under prefers-reduced-motion. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // rail stays manually swipeable

    let raf = 0;
    let onScreen = false;
    const step = () => {
      const idle = performance.now() - lastInteract.current > 1200;
      if (!hover.current && !drag.current.active && idle) el.scrollLeft += 0.5;
      wrap(el);
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (raf || onScreen === false || document.hidden) return;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(el);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    lastInteract.current = performance.now();
    if (e.pointerType !== "mouse") return; // touch / pen use native scrolling
    const el = trackRef.current;
    if (!el) return;
    // NOTE: don't capture the pointer here — capturing on press redirects the
    // trailing click to the rail and breaks the card links. We only capture
    // once a real drag begins (see onPointerMove), so a plain click still
    // reaches the <Link> and navigates.
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false, captured: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    lastInteract.current = performance.now();
    if (!drag.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    // Only treat as a drag (and capture the pointer) past a small threshold.
    if (!drag.current.moved && Math.abs(dx) > 4) {
      drag.current.moved = true;
      try { el.setPointerCapture(e.pointerId); drag.current.captured = true; } catch {}
    }
    if (!drag.current.moved) return; // sub-threshold movement → let it be a click
    el.scrollLeft = drag.current.startScroll - dx;
    wrap(el);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.captured) {
      trackRef.current?.releasePointerCapture?.(e.pointerId);
      drag.current.captured = false;
    }
  };
  /* Swallow the click that fires right after a real drag so it doesn't navigate. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div className="relative overflow-hidden" style={{ contain: "layout paint" }}>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onMouseEnter={() => { hover.current = true; }}
        onMouseLeave={() => { hover.current = false; }}
        onWheel={() => { lastInteract.current = performance.now(); }}
        className="flex overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none [touch-action:pan-x_pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {[...instructors, ...instructors, ...instructors].map((ins, i) => {
          // The rail starts centred on the middle copy, so the first cards of
          // that copy are the ones actually visible on load — prioritise those.
          const isFirstVisible = i === instructors.length || i === instructors.length + 1;
          return (
          <div key={i} className="flex items-center w-[236px] sm:w-[300px] md:w-[350px] shrink-0">
            <ExpertCard
              expert={ins}
              frameClassName="h-[300px] w-[208px] sm:h-[380px] sm:w-[264px] md:h-[420px] md:w-80"
              sizes="(max-width: 640px) 208px, (max-width: 768px) 264px, 320px"
              priority={isFirstVisible}
            />
          </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── About ──────────────────────────────────────────────────────────────── */
function AboutSection() {
  return (
    <section className="bg-white border-y border-black/5">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader
            label="About us"
            title="Connecting Ambitious People With The World's Best Experts, One Session At A Time."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 text-center md:text-left md:pt-6">
            <StatItem value="1:1" label="Expert Sessions" />
            <StatItem value="50" suffix="+" label="Industries Covered" />
            <StatItem value="5000" suffix="+" label="Career Conversations" />
            <StatItem value="10000" suffix="+" label="Hours of Mentorship" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */
const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

function TestimonialsSection() {
  return (
    <section>
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader label="Testimonials" title="Success Stories That Inspire" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {participantTestimonials.map((t) => (
              <figure
                key={t.name}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-orange/[0.05] via-white to-white p-7 md:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-orange/30 hover:shadow-[0_24px_55px_-28px_rgba(0,0,0,0.3)]"
              >
                {/* Oversized decorative quote mark */}
                <span className="pointer-events-none absolute -top-3 right-5 select-none font-serif text-[120px] leading-none text-orange/10">
                  &rdquo;
                </span>

                {/* Rating */}
                <div className="relative flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-[#F59E0B] drop-shadow-[0_1px_2px_rgba(245,158,11,0.35)]">
                      <path d={STAR_PATH} />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="relative mt-5 flex-1 text-ink/85 text-[15px] md:text-base leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <figcaption className="relative mt-7 flex items-center gap-4 border-t border-black/[0.06] pt-6">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-cream-2 ring-2 ring-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.3)]">
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      sizes="56px"
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-ink font-semibold leading-tight">{t.name}</p>
                    <p className="text-ink/60 text-[12.5px] leading-snug mt-0.5">{t.title}</p>
                    <p className="text-ink/45 text-[12px] leading-snug">{t.org}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── RQ-Score trust band ────────────────────────────────────────────────── */
function RQScoreSection() {
  const pillars = ["25+ Signals", "Dynamic", "Verified", "Score /100"];
  return (
    <section className="bg-cream">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="py-11 md:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-orange/15 bg-gradient-to-br from-orange/[0.07] via-white to-white px-5 py-8 md:px-14 md:py-14 shadow-[0_24px_60px_-40px_rgba(255,106,47,0.45)]">
            {/* soft decorative glow */}
            <div className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-orange/10 blur-3xl" aria-hidden />

            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center md:gap-6">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-2 pr-4 ring-1 ring-black/[0.06] shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange text-white">
                  <Icon icon="solar:verified-check-bold" width={16} height={16} aria-hidden />
                </span>
                <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink/70">RQ-Score</span>
              </span>

              <h3 className="text-ink text-3xl md:text-4xl font-semibold tracking-[-0.5px] leading-tight">
                Powered by RQ-Score
              </h3>

              <p className="text-black/65 text-base md:text-lg leading-relaxed">
                A single verified score built from 25+ signals, reflecting real experience and
                credibility so you can choose any expert with confidence.
              </p>

              {/* Pillars */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 pt-1">
                {pillars.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-white px-3.5 py-1.5 text-[12.5px] md:text-[13px] font-semibold text-ink/70 shadow-[0_4px_14px_-10px_rgba(0,0,0,0.4)]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Benefits ───────────────────────────────────────────────────────────── */
function BenefitsSection() {
  return (
    <section className="bg-white border-y border-black/5">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader label="Benefits" title="Learn Today. Lead Tomorrow." />

          <div className="flex flex-col gap-12">
            {/* Banner image */}
            <div className="relative w-full max-h-[75vh] overflow-hidden">
              <Image
                alt="banner"
                src="/shared/banner-img.webp"
                width={1536}
                height={1024}
                sizes="(max-width: 768px) 100vw, 1195px"
                className="w-full max-h-[75vh] object-cover"
              />
            </div>

            {/* 2×2 benefit grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-6">
                  <img alt={b.title} src={b.icon} loading="lazy" decoding="async" className="w-10 shrink-0" />
                  <div className="flex flex-col gap-2">
                    <h5 className="text-ink text-xl font-semibold leading-7 md:text-2xl md:leading-8">
                      {b.title}
                    </h5>
                    <h6 className="text-black/70 text-lg leading-[25.2px]">{b.description}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ────────────────────────────────────────────────────────────── */
function PricingSection() {
  return (
    <section>
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader label="Pricing" title="Invest in Your Growth" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.title}
                className="group flex flex-col gap-4 md:gap-6 border border-black/20 p-4 md:p-6 rounded-2xl bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <img alt="" src={plan.iconUrl} loading="lazy" decoding="async" className="w-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h5 className="text-ink text-xl font-semibold leading-7 md:text-2xl md:leading-8">
                    {plan.title}
                  </h5>
                  <h6 className="text-black/70 text-lg leading-[25.2px]">{plan.description}</h6>
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-ink text-2xl font-semibold leading-none md:text-[32px]">
                    {plan.price}
                  </h4>
                  <p className="text-black/70">{plan.billingPeriod}</p>
                </div>
                <div className="border-t border-black/20" />
                <ul className="flex flex-col gap-2.5 md:gap-4 list-none pl-0">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5" aria-hidden>
                        <circle cx="12" cy="12" r="12" fill="#FF6A2F" opacity="0.12"/>
                        <path d="M7 12.5L10.5 16L17 9" stroke="#FF6A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-lg leading-7">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link
                    href="https://app.growqr.ai"
                    className="flex items-center justify-center gap-2 bg-orange text-white text-lg font-semibold w-full px-7 py-4 rounded-full border border-orange
                      shadow-[0_6px_0_0_rgb(0,0,0)]
                      hover:bg-orange-dark
                      hover:shadow-[0_4px_0_0_rgb(0,0,0)]
                      hover:translate-y-0.5
                      transition-all duration-200
                      active:translate-y-1"
                  >
                    {plan.ctaText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="bg-cream">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader label="FAQs" title="Frequently Asked Questions" />
          <div className="flex flex-col gap-4">
            {faqs.map((item, i) => {
              const isOpen = openIdx === i;
              return (
                <div
                  key={i}
                  className={`border rounded-2xl px-4 md:px-6 transition-colors duration-200 ${
                    isOpen ? "border-orange/40 bg-orange/[0.03]" : "border-black/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 md:py-7 text-left"
                  >
                    <h5 className="text-ink text-xl font-semibold leading-7 md:text-2xl md:leading-8">
                      {item.q}
                    </h5>
                    <div
                      className={`shrink-0 border p-2 md:p-3 rounded-full transition-all duration-300 ${
                        isOpen
                          ? "border-orange bg-orange text-white rotate-45"
                          : "border-black/20 rotate-0"
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M10 4V16M4 10H16"
                          stroke={isOpen ? "white" : "#1A1A1A"}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-40 pb-5 md:pb-7" : "max-h-0"
                    }`}
                  >
                    <p className="text-black/70 text-lg leading-relaxed">{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section className="bg-white border-y border-black/5">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="py-11 md:py-20 flex flex-col items-center text-center gap-10 md:gap-14">

          {/* Decorative top line */}
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-black/15" />

          <div className="flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/15 to-orange/5 ring-1 ring-inset ring-orange/20 shadow-[0_12px_32px_-12px_rgba(255,106,47,0.45)]">
              <Icon icon="solar:graph-up-bold-duotone" className="text-orange" width={32} height={32} aria-hidden />
            </div>
            <h2 className="text-ink text-3xl sm:text-4xl font-semibold leading-tight md:text-7xl md:leading-[72px]">
              Learn, Grow, and Succeed.
            </h2>
            <p className="text-black/50 text-lg leading-relaxed max-w-md">
              Book your first session today, with real advice from experts who&apos;ve been where you want to go.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <Link
              href="https://app.growqr.ai"
              className="inline-flex items-center gap-2 bg-orange text-white text-lg font-semibold px-7 py-4 rounded-full border border-orange
                shadow-[0_6px_0_0_rgb(0,0,0)]
                hover:bg-orange-dark
                hover:shadow-[0_4px_0_0_rgb(0,0,0)]
                hover:translate-y-0.5
                transition-all duration-200
                active:translate-y-1"
            >
              Join for Free
            </Link>
            <Link
              href="/experts/all"
              className="inline-flex items-center gap-2 text-ink text-lg font-semibold px-7 py-4 rounded-full border border-black/20
                shadow-[0_6px_0_0_rgb(0,0,0)]
                hover:bg-ink hover:text-white
                hover:shadow-[0_4px_0_0_rgb(0,0,0)]
                hover:translate-y-0.5
                transition-all duration-200
                active:translate-y-1"
            >
              Explore Experts
            </Link>
          </div>

          {/* Decorative bottom line */}
          <div className="w-px h-16 bg-gradient-to-b from-black/15 to-transparent" />

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Data (straight from the React sample)
   ══════════════════════════════════════════════════════════════════════════ */
const instructors = visibleExperts.map((e) => ({
  href: `/experts/${e.slug}`,
  name: e.displayName ?? e.name,
  imageUrl: e.image,
  role: e.tag,
  bg: e.cardBg ?? DEFAULT_EXPERT_SHADE,
  rqScore: e.rqScore,
}));

const participantTestimonials = [
  {
    name: "Bhuvin Singla",
    title: "Software Analyst",
    org: "SmartData Enterprises, Mohali",
    image: "/experts/testimonials/bhuvin.webp",
    quote:
      "The session provided practical frameworks that I could apply immediately. Clear, actionable, and highly relevant to my day-to-day work.",
  },
  {
    name: "Bhavani Singh",
    title: "Teaching Assistant",
    org: "Woxsen University, Hyderabad",
    image: "/experts/testimonials/bhavani.webp",
    quote:
      "The workshop balanced strategy with execution. The concepts were easy to understand and directly applicable in professional environments.",
  },
  {
    name: "Dr. Tulika Anand",
    title: "Assistant Professor",
    org: "Guru Nanak University, Hyderabad",
    image: "/experts/testimonials/tulika.webp",
    quote:
      "A thoughtful learning experience with valuable insights. The discussions encouraged practical thinking and meaningful professional growth.",
  },
];

const benefits = [
  { icon: "/platform/icons/icon-1.svg", title: "1:1 Expert Sessions", description: "Honest, personalised advice from vetted industry experts." },
  { icon: "/platform/icons/icon-2.svg", title: "Flexible Scheduling", description: "Book mornings, evenings, or weekends. On your schedule." },
  { icon: "/platform/icons/icon-3.svg", title: "Verified Expertise", description: "Every expert is reviewed, vetted, and community-rated." },
  { icon: "/platform/icons/icon-4.svg", title: "Community Connection", description: "Grow your network with ambitious professionals." },
];

const pricingPlans = [
  {
    iconUrl: "/platform/icons/basic-icon.svg",
    title: "Weekly",
    description: "Try it out, perfect for a focused, single-week sprint.",
    price: "$29",
    billingPeriod: "per week",
    features: ["2 Expert Sessions / week", "Any expert, any topic", "Community Access", "Session recording included", "No commitment"],
    ctaText: "Get Started",
  },
  {
    iconUrl: "/platform/icons/growth-icon.svg",
    title: "Monthly",
    description: "Build momentum with consistent expert-led sessions.",
    price: "$79",
    billingPeriod: "per month",
    features: ["10 Expert Sessions / month", "Priority booking", "Session recordings", "Community Access", "Cancel anytime"],
    ctaText: "Get Started",
  },
  {
    iconUrl: "/platform/icons/scale-icon.svg",
    title: "Yearly",
    description: "Unlimited access for serious, long-term career growth.",
    price: "$499",
    billingPeriod: "per year",
    features: ["Unlimited sessions", "All experts unlocked", "Session recordings", "Priority support", "Community Access"],
    ctaText: "Get Started",
  },
];

const faqs = [
  {
    q: "How do I book a session with an expert?",
    a: "Browse the experts directory, pick a profile that fits your goal, and choose an available time slot. Booking takes under a minute and you'll get a confirmation instantly.",
  },
  {
    q: "Who are these expert sessions for?",
    a: "These sessions are designed for students, professionals, founders, career switchers, and individuals seeking clarity, guidance, mentorship, or career growth.",
  },
  {
    q: "What happens if I'm not happy with a session?",
    a: "If a session doesn't meet your expectations, reach out within 24 hours and we'll either arrange a free replacement session or issue a full refund, no questions asked.",
  },
  {
    q: "Can I switch plans or experts at any time?",
    a: "Absolutely. You can upgrade, downgrade, or switch plans at any time. You're also free to book sessions with different experts across your subscription.",
  },
];
