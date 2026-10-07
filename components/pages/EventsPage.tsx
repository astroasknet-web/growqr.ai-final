/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import type { EventRow } from "@/features/events/types/event";

/* ══════════════════════════════════════════════════════════════════════════
   EventsPage — event-focused landing page.
   Shares the ExpertsPage visual language (cream hero, SectionHeader, rounded
   cards, hard-shadow CTAs) but is structured entirely around events and
   registration. Events are primary; speakers are supporting detail.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function isUpcoming(event: EventRow): boolean {
  const today = new Date().toISOString().split("T")[0];
  return event.event_date >= today;
}

function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/* ─── Shared bits ────────────────────────────────────────────────────────── */
function SectionHeader({ label, title }: { label: string; title: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-orange text-lg leading-[25.2px]">{label}</h6>
      <h3 className="text-ink text-3xl font-semibold leading-9 md:text-5xl md:leading-[57.6px] max-w-3xl">{title}</h3>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  const numeric = parseInt(value.replace(/,/g, ""), 10);
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
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
  }, [numeric]);

  return (
    <div ref={ref} className="flex flex-col gap-2 text-center md:text-left">
      <h2 className="text-ink text-[32px] min-[400px]:text-[40px] sm:text-5xl font-semibold leading-tight text-center md:text-7xl md:leading-[72px] md:text-left whitespace-nowrap">
        <span className="tabular-nums">{count.toLocaleString()}</span>+
      </h2>
      <h6 className="text-black/70 text-lg leading-[25.2px]">{label}</h6>
    </div>
  );
}

/* ─── TrustBadge (PFP stack + animated stars — ported from ExpertsPage) ───── */
const TRUST_PFPS = [
  "/shared/avatars/male2.jpg",
  "/shared/avatars/female2.jpeg",
  "/shared/avatars/maleindian5.webp",
  "/shared/avatars/male7.webp",
];

function TrustBadge() {
  return (
    <a href="#testimonials" className="flex items-center gap-3.5 group cursor-pointer">
      <div className="flex -space-x-3">
        {TRUST_PFPS.map((src) => (
          <div key={src} className="h-11 w-11 rounded-full ring-2 ring-white overflow-hidden bg-cream-2 shadow-sm">
            <img alt="Attendee" src={src} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <motion.svg
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: "spring", bounce: 0.2, duration: 0.45 }}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-[#F59E0B] drop-shadow-[0_1px_3px_rgba(245,158,11,0.4)]"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </motion.svg>
          ))}
        </div>
        <p className="mt-1 text-sm font-medium text-black/60 group-hover:text-orange transition-colors duration-200 underline-offset-4 group-hover:underline">What Attendees Are Saying</p>
      </div>
    </a>
  );
}

/* ─── Hero rotating visual ───────────────────────────────────────────────── */
const HERO_IMAGES = [
  "/events/hero/hero1.webp",
  "/events/hero/hero2.webp",
];

function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-black/[0.07] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)] bg-cream-2">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={index}
          src={HERO_IMAGES[index]}
          alt="GrowQR event"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }, scale: { duration: 3.2, ease: "easeOut" } }}
          className="absolute inset-0 h-full w-full object-cover object-bottom"
        />
      </AnimatePresence>

      {/* progress dots */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show image ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-cream pt-36 md:pt-44 pb-16 md:pb-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute right-0 top-0 w-[55%] h-full bg-gradient-to-bl from-orange/[0.07] via-transparent to-transparent" />
        <div className="absolute right-[8%] top-[16%] h-[380px] w-[380px] rounded-full bg-orange/[0.08] blur-[90px]" />
      </div>

      <div className="relative max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 sm:gap-10 lg:gap-16 items-center">
          {/* LEFT */}
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 bg-orange/10 text-orange text-sm font-semibold px-4 py-2 rounded-full w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange" />
              </span>
              Live Expert Sessions
            </span>

            <h1
              className="text-ink text-[30px] sm:text-[36px] tracking-[-1px] leading-[1.05] md:text-6xl md:tracking-[-1.5px] md:leading-[1.04]"
              style={{ fontWeight: 900 }}
            >
              More Than Events,{" "}
              <span className="text-orange">Experiences That Transform.</span>
            </h1>

            <p className="text-black/70 text-lg leading-[25.2px] max-w-md">
              Live sessions with verified experts.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 pt-2">
              <Link
                href="/events/all"
                className="group items-center bg-orange text-white shadow-[0_6px_0_0_rgb(0,0,0)] inline-flex gap-2 w-fit whitespace-nowrap border border-orange px-7 py-4 rounded-full hover:bg-orange-dark hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 transition-all duration-200 active:translate-y-1"
              >
                <span className="font-semibold">Browse Events</span>
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

          {/* RIGHT — portrait visual with on-brand orange corner brackets */}
          <div className="relative w-full max-w-[400px] mx-auto lg:ml-auto">
            <span className="absolute -top-2.5 -left-2.5 w-7 h-7 border-t-[2.5px] border-l-[2.5px] border-orange z-20 pointer-events-none" />
            <span className="absolute -top-2.5 -right-2.5 w-7 h-7 border-t-[2.5px] border-r-[2.5px] border-orange z-20 pointer-events-none" />
            <span className="absolute -bottom-2.5 -left-2.5 w-7 h-7 border-b-[2.5px] border-l-[2.5px] border-orange z-20 pointer-events-none" />
            <span className="absolute -bottom-2.5 -right-2.5 w-7 h-7 border-b-[2.5px] border-r-[2.5px] border-orange z-20 pointer-events-none" />
            <HeroCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ──────────────────────────────────────────────────────────────── */
function StatsSection() {
  return (
    <section className="bg-white border-y border-black/5">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader
            label="About us"
            title="Learn, Grow, and Thrive"
          />
          <p className="text-black/70 text-lg leading-relaxed max-w-3xl -mt-4 md:-mt-6">
            We believe the right room can change your trajectory. Our events bring together ambitious minds, thought leaders, and changemakers to create experiences that inspire growth, unlock opportunities, and shape what&rsquo;s next.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:pt-6 text-center md:text-left">
            <StatItem value="15" label="Industries covered" />
            <StatItem value="20" label="Events hosted" />
            <StatItem value="30" label="Expert speakers" />
            <StatItem value="2000" label="Attendees" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Event card ─────────────────────────────────────────────────────────── */
function EventCard({ event, isPast = false }: { event: EventRow; isPast?: boolean }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-md border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.25)] active:translate-y-0 active:scale-[0.985] active:duration-100 ${isPast ? "border-black/[0.08] opacity-90 hover:opacity-100 hover:border-black/15" : "border-black/[0.08] hover:border-orange/30"}`}
    >
      {/* Poster */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-md bg-cream">
        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className={`h-full w-full object-cover transition-transform duration-500 ${isPast ? "" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange/15 via-orange/5 to-cream">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink/40">GrowQR Events</span>
          </div>
        )}
        {isPast && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80">Ended</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* date + time */}
        <div className="flex items-center gap-3 text-sm font-medium text-black/55">
          <span className="inline-flex items-center gap-1.5">
            <Icon icon="solar:calendar-bold-duotone" className="text-orange" width={16} height={16} />
            {formatEventDate(event.event_date)}
          </span>
          {event.start_time && (
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="solar:clock-circle-bold-duotone" className="text-orange" width={16} height={16} />
              {event.start_time}
            </span>
          )}
        </div>

        <h4 className="text-ink text-xl font-semibold leading-7 line-clamp-2 min-h-[3.5rem] group-hover:text-orange transition-colors duration-200">
          {event.title}
        </h4>

        {/* Speaker — supporting detail */}
        {event.speaker_name && (
          <div className="flex items-center gap-3 border-t border-black/[0.06] pt-4">
            {event.speaker_image ? (
              <img src={event.speaker_image} alt={event.speaker_name} className="h-9 w-9 rounded-full object-cover object-top" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange">
                {initials(event.speaker_name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-black/35 leading-none">Speaker</p>
              <p className="text-ink text-sm font-semibold leading-tight truncate">{event.speaker_name}</p>
            </div>
          </div>
        )}

        {/* Whole card is clickable; past cards skip the redundant CTA */}
        {!isPast && (
          <>
            <div className="flex-1" />
            <div className="mt-1 flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-semibold bg-orange text-white transition-all duration-200 group-hover:bg-orange-dark group-hover:shadow-[0_10px_24px_-10px_rgba(255,106,47,0.6)]">
              Register Now
              <Icon icon="solar:arrow-right-linear" width={16} height={16} />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

/* ─── Events listing (Upcoming / Past toggle) ────────────────────────────── */
type EventTab = "upcoming" | "past";

function EventsListing({ events }: { events: EventRow[] }) {
  const upcoming = events.filter(isUpcoming);
  // Most-recent past events first, that's what people scan for.
  const past = events
    .filter((e) => !isUpcoming(e))
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  // Default to upcoming when available, otherwise fall back to past.
  const [tab, setTab] = useState<EventTab>(upcoming.length > 0 ? "upcoming" : "past");

  // Only offer a toggle option for a category that actually has events.
  const toggles = [
    { key: "upcoming" as const, label: "Upcoming Events", count: upcoming.length },
    { key: "past" as const, label: "Past Events", count: past.length },
  ].filter((t) => t.count > 0);

  const isPast = tab === "past";
  // Past sessions auto-scroll as a marquee once there are enough to scroll (3+).
  const pastAutoScroll = isPast && past.length >= 3;
  const gridList = (isPast ? past : upcoming).slice(0, 3);
  const bothEmpty = toggles.length === 0;

  return (
    <section id="events" className="scroll-mt-24 bg-cream">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              label={isPast ? "Past Events" : "Upcoming Events"}
              title={isPast ? "Highlights from past sessions" : "What's happening next"}
            />
            <Link
              href="/events/all"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange hover:gap-3 transition-all shrink-0"
            >
              View all events
              <Icon icon="solar:arrow-right-linear" width={16} height={16} />
            </Link>
          </div>

          {/* Toggle — shown only when both categories have events */}
          {toggles.length > 1 && (
            <div className="flex flex-wrap gap-2 -mt-2">
              {toggles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  aria-pressed={tab === t.key}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    tab === t.key
                      ? "bg-orange text-white shadow-[0_8px_20px_-10px_rgba(255,106,47,0.7)]"
                      : "bg-white text-ink/70 border border-black/[0.1] hover:border-black/25 hover:text-ink"
                  }`}
                >
                  {t.label}
                  <span className={tab === t.key ? "text-white/75" : "text-ink/40"}>({t.count})</span>
                </button>
              ))}
            </div>
          )}

          {bothEmpty ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-black/10 bg-cream/40 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                <Icon icon="solar:calendar-mark-bold-duotone" width={28} height={28} />
              </span>
              <div className="flex flex-col gap-1">
                <h4 className="text-ink text-xl font-semibold">No events right now</h4>
                <p className="text-black/55 max-w-sm">
                  We&apos;re lining up the next session. Check back soon.
                </p>
              </div>
              <a
                href="mailto:hello@growqr.ai?subject=Notify me about upcoming events"
                className="inline-flex items-center gap-2 rounded-full bg-orange text-white text-sm font-semibold px-5 py-2.5 hover:bg-orange-dark transition-colors"
              >
                <Icon icon="solar:bell-bold-duotone" width={16} height={16} />
                Notify Me
              </a>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {pastAutoScroll ? (
                  /* Auto-scrolling marquee — track duplicated for a seamless loop, pauses on hover */
                  <div className="relative flex overflow-hidden group">
                    <div className="flex w-max gap-4 sm:gap-6 md:gap-8 marquee group-hover:[animation-play-state:paused]">
                      {[...past, ...past].map((ev, i) => (
                        <div
                          key={`${ev.id || ev.slug}-${i}`}
                          aria-hidden={i >= past.length || undefined}
                          className="w-[300px] sm:w-[340px] md:w-[380px] shrink-0"
                        >
                          <EventCard event={ev} isPast />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {gridList.map((ev) => (
                      <EventCard key={ev.id || ev.slug} event={ev} isPast={isPast} />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Why Attend ─────────────────────────────────────────────────────────── */
const whyAttend = [
  { icon: "solar:book-bookmark-bold-duotone", title: "Real Learning", desc: "Practical frameworks and skills you can apply instantly, no fluff." },
  { icon: "solar:users-group-rounded-bold-duotone", title: "Networking", desc: "Meet ambitious professionals, founders, and operators committed to growth." },
  { icon: "solar:graph-up-bold-duotone", title: "Career Growth", desc: "Sharpen your edge with insights that move you toward your next opportunity." },
  { icon: "solar:rocket-2-bold-duotone", title: "New Possibilities", desc: "Discover roles, collaborations, and ideas you won't find anywhere else." },
  { icon: "solar:lightbulb-bold-duotone", title: "Expert Insights", desc: "Learn directly from industry experts with proven track records." },
  { icon: "solar:hand-heart-bold-duotone", title: "Community", desc: "Growth is easier when you're surrounded by like-minded individuals." },
];

function WhyAttendSection() {
  return (
    <section id="why" className="scroll-mt-24 bg-white border-y border-black/5">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader label="Here's why you should join" title="Events Designed for Growth" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {whyAttend.map((b) => (
              <div
                key={b.title}
                className="group flex flex-col gap-4 rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.22)] hover:border-orange/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange transition-colors group-hover:bg-orange group-hover:text-white">
                  <Icon icon={b.icon} width={26} height={26} />
                </span>
                <h4 className="text-ink text-xl font-semibold">{b.title}</h4>
                <p className="text-black/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials (ExpertsPage card style) ──────────────────────────────── */
const STAR_PATH =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

const eventTestimonials = [
  {
    name: "Dr. Meenakshi Verma",
    title: "Associate Professor",
    rating: 5,
    quote:
      "I attend many academic workshops every year, but GrowQR's sessions stand apart for their practical relevance. The blend of AI, employability, and future skills was refreshing and immediately applicable to both teaching and student mentoring.",
  },
  {
    name: "Rohan Gupta",
    title: "Final-Year Engineering Student",
    rating: 4.5,
    quote:
      "I joined expecting another career talk and left with a completely different perspective on LinkedIn, networking, and AI. The workshop gave me actionable strategies that I started implementing the very next day.",
  },
  {
    name: "Priya Nair",
    title: "Learning & Development Manager",
    rating: 5,
    quote:
      "GrowQR understands the future workplace. The workshop was insightful, engaging, and focused on real challenges organizations face in preparing talent for a rapidly changing world.",
  },
  {
    name: "Dr. Arvind Kumar",
    title: "Dean, School of Management",
    rating: 4,
    quote:
      "The discussions were intellectually stimulating yet highly practical. It was encouraging to see AI presented not as a replacement for human potential but as a powerful collaborator.",
  },
  {
    name: "Shreya Malhotra",
    title: "MBA Student",
    rating: 4.5,
    quote:
      "The personal branding session helped me rethink how I present myself professionally. The facilitators shared strategies that felt authentic, achievable, and highly relevant to today's job market.",
  },
  {
    name: "Vikram Sethi",
    title: "Senior HR Business Partner",
    rating: 5,
    quote:
      "What impressed me most was the focus on employability intelligence and measurable skill development. GrowQR brings a fresh and data-driven perspective to talent readiness.",
  },
];

/* Renders 5 stars with support for half-filled (e.g. 4.5). */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="relative flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const fill = Math.max(0, Math.min(1, rating - i)); // 0, 0.5, or 1
        return (
          <svg key={i} viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(245,158,11,0.35)]">
            <defs>
              <linearGradient id={`star-${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="#F59E0B" />
                <stop offset={`${fill * 100}%`} stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill={`url(#star-${i}-${fill})`} />
          </svg>
        );
      })}
    </div>
  );
}

function EventTestimonialsSection() {
  // Duplicated so the .marquee track (translateX 0 → -50%) loops seamlessly.
  const track = [...eventTestimonials, ...eventTestimonials];
  return (
    <section id="testimonials" className="scroll-mt-24 bg-white border-y border-black/5">
      <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
        <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
          <SectionHeader label="Testimonials" title="What attendees say about us" />
        </div>

        {/* Desktop: auto-scrolling marquee (pauses on hover).
            Mobile: animation off — users swipe through with native touch scroll. */}
        <div className="relative flex overflow-x-auto md:overflow-hidden group [touch-action:pan-x_pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-5 md:gap-6 px-5 md:px-7 marquee max-md:[animation:none] group-hover:[animation-play-state:paused]">
            {track.map((t, i) => (
              <figure
                key={`${t.name}-${i}`}
                aria-hidden={i >= eventTestimonials.length || undefined}
                className="group/card relative flex w-[248px] sm:w-[320px] md:w-[380px] shrink-0 min-h-[200px] sm:min-h-[320px] flex-col overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-orange/[0.05] via-white to-white p-4 sm:p-6 md:p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-orange/30 hover:shadow-[0_24px_55px_-28px_rgba(0,0,0,0.3)]"
              >
                {/* Oversized decorative quote mark */}
                <span className="pointer-events-none absolute -top-3 right-3.5 sm:-top-4 sm:right-4 select-none font-serif text-[54px] sm:text-[100px] leading-none text-orange/10">
                  &rdquo;
                </span>

                {/* Rating */}
                <StarRating rating={t.rating} />

                {/* Quote */}
                <blockquote className="relative mt-3 sm:mt-4 flex-1 text-ink/85 text-[13px] sm:text-[16px] md:text-[17px] leading-relaxed sm:leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <figcaption className="relative mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-3 border-t border-black/[0.06] pt-3.5 sm:pt-5">
                  <div className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange/20 to-orange/5 text-orange ring-2 ring-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.3)]">
                    <Icon icon="solar:user-bold" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-ink font-semibold text-[13.5px] sm:text-[15px] leading-tight">{t.name}</p>
                    <p className="text-ink/60 text-[11.5px] sm:text-[12.5px] leading-snug mt-0.5">{t.title}</p>
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

/* ─── Learn, Grow & Succeed ──────────────────────────────────────────────── */
function LearnGrowSection() {
  return (
    <section className="bg-cream">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="flex flex-col gap-10 md:gap-12 py-11 md:py-20">
          <SectionHeader label="The GrowQR Way" title="Learn Today. Lead Tomorrow." />
          <img
            alt="Learn, grow and succeed with GrowQR"
            src="/shared/banner-img.webp"
            loading="lazy"
            decoding="async"
            className="w-full max-h-[75vh] object-cover"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ (ExpertsPage accordion style) ──────────────────────────────────── */
const faqs = [
  {
    q: "Who can attend these events?",
    a: "Anyone looking to learn, grow, and build meaningful professional skills is welcome. Our events are designed for students, working professionals, educators, entrepreneurs, and organizations. Each event page clearly mentions the intended audience, so you can easily find sessions relevant to your goals.",
  },
  {
    q: "Are the events conducted online or offline?",
    a: "We host both online and in-person events. The event details specify the mode of delivery, venue (if applicable), date, and timings so you know exactly what to expect before registering.",
  },
  {
    q: "Will I receive a certificate after attending?",
    a: "Yes, certificates are provided for eligible events. If a session includes a certificate of participation or completion, it will be clearly mentioned in the event details along with any attendance requirements.",
  },
  {
    q: "Are the seats limited?",
    a: "Yes. Many of our events have limited seats to ensure a high-quality learning experience. We recommend registering early to secure your spot.",
  },
];

function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="bg-white border-y border-black/5">
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
                      isOpen ? "max-h-96 pb-5 md:pb-7" : "max-h-0"
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

/* ─── Final CTA (ExpertsPage CtaSection style) ──────────────────────────── */
function FinalCtaSection() {
  return (
    <section className="bg-white border-y border-black/5">
      <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
        <div className="py-11 md:py-20 flex flex-col items-center text-center gap-10 md:gap-14">
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-black/15" />

          <div className="flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/15 to-orange/5 ring-1 ring-inset ring-orange/20 shadow-[0_12px_32px_-12px_rgba(255,106,47,0.45)]">
              <Icon icon="solar:graph-up-bold-duotone" className="text-orange" width={32} height={32} aria-hidden />
            </div>
            <h2 className="text-ink text-3xl sm:text-4xl font-semibold leading-tight md:text-7xl md:leading-[72px]">
              Learn, Grow, and Succeed.
            </h2>
            <p className="text-black/50 text-lg leading-relaxed max-w-md">
              Register for your next event today, with real insights from experts who&apos;ve been where you want to go.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5">
            <Link
              href="/events/all"
              className="inline-flex items-center gap-2 whitespace-nowrap bg-orange text-white text-base sm:text-lg font-semibold px-5 sm:px-7 py-3 sm:py-4 rounded-full border border-orange shadow-[0_6px_0_0_rgb(0,0,0)] hover:bg-orange-dark hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 transition-all duration-200 active:translate-y-1"
            >
              Browse All Events
            </Link>
            <Link
              href="/experts"
              className="inline-flex items-center gap-2 whitespace-nowrap text-ink text-base sm:text-lg font-semibold px-5 sm:px-7 py-3 sm:py-4 rounded-full border border-black/20 shadow-[0_6px_0_0_rgb(0,0,0)] hover:bg-ink hover:text-white hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 transition-all duration-200 active:translate-y-1"
            >
              Find an Expert
            </Link>
          </div>

          <div className="w-px h-16 bg-gradient-to-b from-black/15 to-transparent" />
        </div>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function EventsPage({ events = [] }: { events?: EventRow[] }) {
  return (
    <div className="text-black text-base font-normal bg-white overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <EventsListing events={events} />
        <WhyAttendSection />
        <EventTestimonialsSection />
        <LearnGrowSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
