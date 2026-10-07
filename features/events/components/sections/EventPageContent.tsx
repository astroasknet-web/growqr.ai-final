"use client";

/**
 * EventPageContent
 *
 * The pure content body of the public event page — every section rendered
 * from an EventRow. Premium layout aligned with the Expert detail page:
 * strong type hierarchy, breathable spacing, a sticky registration card,
 * a timeline agenda and a polished speaker block.
 *
 * Still consumed by the admin EventPreviewModal (isPreview), which simply
 * disables the live register / join actions.
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  Share2,
  Ticket,
  Users,
} from "lucide-react";
import type { EventRow } from "../../types/event";

const ease = [0.22, 1, 0.36, 1] as const;

/* ── Helpers ───────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  if (!iso) return "Date to be announced";
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function timeRange(event: EventRow): string {
  if (event.start_time && event.end_time) return `${event.start_time} – ${event.end_time}`;
  return event.start_time ?? "Time TBA";
}


/* ── Props ─────────────────────────────────────────────────────────────── */
interface Props {
  event: EventRow;
  /** Called when any "Register Now" button is clicked. */
  onRegisterClick?: () => void;
  /** Admin preview: hides breadcrumb/share, drops nav offset, disables actions. */
  isPreview?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════
   Shared bits
   ══════════════════════════════════════════════════════════════════════════ */
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-orange text-base md:text-lg font-semibold">{label}</span>
      <h2 className="text-ink text-3xl font-semibold leading-tight tracking-[-0.01em] md:text-[44px] md:leading-[1.1]">
        {title}
      </h2>
    </div>
  );
}

export default function EventPageContent({ event, onRegisterClick, isPreview = false }: Props) {
  const isOnline =
    event.event_mode === "online" ||
    (event.format ?? "").toLowerCase().includes("online") ||
    (event.format ?? "").toLowerCase().includes("virtual");

  const platformLabel =
    event.meeting_platform === "zoom"
      ? "Zoom"
      : event.meeting_platform === "google_meet"
        ? "Google Meet"
        : null;

  // Past events: the date has already gone by. Registration is closed.
  const isPast =
    !!event.event_date && event.event_date < new Date().toISOString().split("T")[0];

  // Fixed 4-card 2×2 grid: Date · Time · Fee · Format/Location
  const formatValue = isOnline
    ? platformLabel ? `Online · ${platformLabel}` : "Online event"
    : [event.venue, event.city, event.country].filter(Boolean).join(", ") || "Venue TBA";

  const facts: { Icon: typeof Calendar; label: string; value: string }[] = [
    { Icon: Calendar, label: "Date", value: formatDate(event.event_date) },
    { Icon: Clock,    label: "Time", value: timeRange(event) + (event.duration ? ` · ${event.duration}` : "") },
    { Icon: Ticket,   label: "Fee",  value: event.price || "Free" },
    { Icon: isOnline ? Globe : MapPin, label: isOnline ? "Format" : "Location", value: formatValue },
  ];

  /* Breadcrumb back target: route to "All Events" when the user arrived from
     /events/all (tagged via ?from=all), otherwise the events home page. */
  const [backTo, setBackTo] = useState<{ href: string; label: string }>({
    href: "/events",
    label: "Events",
  });
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "all") setBackTo({ href: "/events/all", label: "All Events" });
  }, []);

  /* Share: native share sheet where supported, clipboard copy as fallback. */
  const [shared, setShared] = useState(false);
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.short_description ?? event.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* user dismissed the share sheet, or clipboard was blocked — no-op */
    }
  };

  /* Signature hard-shadow register button (matches Expert page CTA) */
  const RegisterButton = ({ full = false, className = "" }: { full?: boolean; className?: string }) =>
    isPast && !isPreview ? (
      <div
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-cream px-7 py-4 text-lg font-semibold text-ink/55 cursor-not-allowed select-none ${
          full ? "w-full" : "w-fit"
        } ${className}`}
      >
        Event ended
      </div>
    ) : isPreview ? (
      <div
        className={`group inline-flex items-center justify-center gap-2 rounded-full bg-orange/40 px-7 py-4 text-lg font-semibold text-white cursor-not-allowed select-none ${
          full ? "w-full" : "w-fit"
        } ${className}`}
      >
        Register Now
        <span className="text-[11px] font-medium opacity-80">(preview)</span>
      </div>
    ) : (
      <button
        type="button"
        onClick={onRegisterClick}
        className={`group inline-flex items-center justify-center gap-2 rounded-full border border-orange bg-orange px-7 py-4 text-lg font-semibold text-white shadow-[0_6px_0_0_rgb(0,0,0)] transition-all duration-200 hover:translate-y-0.5 hover:bg-orange-dark hover:shadow-[0_4px_0_0_rgb(0,0,0)] active:translate-y-1 ${
          full ? "w-full" : "w-fit"
        } ${className}`}
      >
        Register Now
        <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    );


  return (
    <main className={`bg-white text-ink ${isPreview ? "" : "pt-[68px]"}`}>
      {/* ════════════════════════════════════════════════
          Breadcrumb
      ════════════════════════════════════════════════ */}
      {!isPreview && (
        <div className="mx-auto w-full max-w-[1195.2px] px-5 md:px-7">
          <div className="flex items-center gap-2 pt-10 text-sm text-ink-4 md:pt-14">
            <Link href={backTo.href} className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-orange">
              <ArrowLeft className="h-3.5 w-3.5" />
              {backTo.label}
            </Link>
            <span className="text-ink-5">/</span>
            <span className="truncate text-ink/80">{event.title || "Event"}</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          SECTION 1 — Hero: speaker portrait left · content right
      ════════════════════════════════════════════════ */}
      <div className="mx-auto w-full max-w-[1195.2px] px-5 md:px-7">
        <div className="grid grid-cols-1 gap-8 pt-8 md:pt-12 lg:grid-cols-[260px_1fr] lg:items-start lg:gap-14">

          {/* LEFT — speaker portrait 3:4, sticky on desktop */}
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.08 }}
            className="w-full max-w-[260px] mx-auto lg:mx-0 lg:sticky lg:top-28 lg:self-start"
          >
            <div className="relative w-full overflow-hidden rounded-2xl bg-cream-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.28)] border border-black/[0.06]" style={{ aspectRatio: "3/4" }}>
              {event.speaker_image ? (
                <Image
                  src={event.speaker_image}
                  alt={event.speaker_name ?? "Speaker"}
                  fill
                  priority
                  sizes="260px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange/15 via-orange/5 to-cream">
                  <span className="text-xs font-semibold uppercase tracking-widest text-ink/30">Speaker</span>
                </div>
              )}
            </div>
            {/* Speaker name + role below photo */}
            {event.speaker_name && (
              <div className="mt-4 flex flex-col gap-1.5 text-center lg:text-left">
                <p className="text-[16px] font-semibold text-ink leading-snug">{event.speaker_name}</p>
                {(event.speaker_designation || event.speaker_company) && (
                  <p className="text-[13px] text-black/65 leading-relaxed">
                    {[event.speaker_designation, event.speaker_company].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            )}
          </motion.aside>

          {/* RIGHT — all hero content */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex min-w-0 flex-col gap-7"
          >
            {/* Eyebrow chips + share */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-sm font-semibold text-orange">
                <span className="h-2 w-2 rounded-full bg-orange animate-pulseDot" />
                {isOnline ? "Live online event" : "In-person event"}
              </span>
              {event.badge && (
                <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm font-medium text-ink/80">
                  {event.badge}
                </span>
              )}
              {isOnline && platformLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm font-medium text-ink/70">
                  <Globe className="h-3.5 w-3.5 text-orange" />
                  {platformLabel}
                </span>
              )}
              {!isPreview && (
                <button
                  onClick={handleShare}
                  className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink-4 transition-colors hover:border-black/25 hover:text-ink"
                  aria-label={shared ? "Link copied" : "Share event"}
                  title={shared ? "Link copied!" : "Share event"}
                >
                  {shared ? <Check className="h-4 w-4 text-orange" /> : <Share2 className="h-4 w-4" />}
                </button>
              )}
            </div>

            {/* Title + description */}
            <div className="flex flex-col gap-4">
              <h1 className="text-balance text-[30px] font-semibold leading-[1.1] tracking-[-1px] text-ink md:text-[42px] md:leading-[1.06]">
                {event.title || <span className="italic text-ink-5">Untitled event</span>}
              </h1>
              {event.short_description && (
                <p className="max-w-2xl text-lg leading-relaxed text-ink-3">
                  {event.short_description}
                </p>
              )}
            </div>

            {/* Facts grid — always 2×2 */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-w-2xl">
              {facts.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4 transition-colors duration-200 hover:border-orange/30"
                >
                  <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <Icon className="h-[19px] w-[19px]" strokeWidth={1.9} />
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-5">{label}</span>
                    <span className="text-[15px] font-semibold leading-snug text-ink">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <RegisterButton className="max-sm:w-full max-sm:justify-center" />
            </div>
          </motion.section>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          Body sections
      ════════════════════════════════════════════════ */}
      <div className="mx-auto w-full max-w-[1195.2px] px-5 md:px-7">
        <div className="flex flex-col gap-20 pb-8 pt-20 md:gap-28 md:pb-12 md:pt-28">
          {/* SECTION 2 — About + What you'll learn */}
          {(event.full_description || event.learnings.length > 0) && (
            <section className="flex flex-col gap-16 md:gap-20">
              {event.full_description && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, ease }}
                  className="flex flex-col gap-6"
                >
                  <SectionHeader label="Overview" title="About this event" />
                  <p className="max-w-3xl whitespace-pre-line text-lg leading-[1.85] text-ink-2">
                    {event.full_description}
                  </p>
                </motion.div>
              )}

              {event.learnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease, delay: 0.05 }}
                  className="flex flex-col gap-8"
                >
                  <SectionHeader label="Takeaways" title="What you'll learn" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {event.learnings.map((item) => (
                      <div
                        key={item}
                        className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange/30 hover:shadow-[0_10px_30px_-12px_rgba(255,106,47,0.25)]"
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange transition-all duration-300 group-hover:bg-orange group-hover:text-white">
                          <CheckCircle2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
                        </span>
                        <span className="text-base font-medium leading-snug text-ink-2">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </section>
          )}

          {/* SECTION 3 — Agenda (timeline) */}
          {event.agenda.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col gap-10 md:gap-12"
            >
              <SectionHeader label="Schedule" title="Event agenda" />
              <div className="relative flex flex-col gap-5 md:pl-8">
                <div className="absolute left-[7px] top-2 bottom-2 hidden w-px bg-black/10 md:block" />
                {event.agenda.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-8 top-6 hidden h-3.5 w-3.5 rounded-full bg-orange ring-4 ring-orange/15 md:block" />
                    <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:p-6 transition-shadow duration-300 hover:shadow-card sm:flex-row sm:items-start sm:gap-6">
                      <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-orange/10 px-3.5 py-1.5 text-sm font-semibold tracking-tight text-orange-deep">
                        {item.time || "TBA"}
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-lg font-semibold leading-snug text-ink">{item.title}</p>
                        {item.desc && (
                          <p className="text-[15px] leading-relaxed text-ink-3">{item.desc}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* SECTION 4 — Speaker */}
          {event.speaker_name && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col gap-10 md:gap-12"
            >
              <SectionHeader label="Hosted by" title="Meet the speaker" />
              <div className="flex flex-col gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-card md:flex-row md:items-start md:gap-8 md:p-8">
                <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-orange-lighter">
                  {event.speaker_image && (
                    <Image
                      src={event.speaker_image}
                      alt={event.speaker_name}
                      fill
                      sizes="112px"
                      className="object-cover object-top"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-2xl font-semibold tracking-tight text-ink">{event.speaker_name}</p>
                  {(event.speaker_designation || event.speaker_company) && (
                    <p className="font-medium text-orange">
                      {[event.speaker_designation, event.speaker_company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {event.speaker_bio && (
                    <p className="mt-1 max-w-2xl text-[16px] leading-[1.75] text-ink-3">{event.speaker_bio}</p>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SECTION 5 — Final CTA
      ════════════════════════════════════════════════ */}
      <section className="bg-cream">
        <div className="mx-auto w-full max-w-[1195.2px] px-5 md:px-7">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-col items-center gap-7 py-16 text-center md:py-24"
          >
            <span className="text-base font-semibold text-orange md:text-lg">{isPast ? "That's a wrap" : "Save your spot"}</span>
            <div className="flex flex-col items-center gap-4">
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.01em] text-ink md:text-[52px] md:leading-[1.05]">
                {isPast ? "This event has ended" : "Ready to join us?"}
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-ink-3">
                {formatDate(event.event_date)}
                {event.start_time && ` · ${timeRange(event)}`}
                {` · ${formatValue}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <RegisterButton className="text-lg" />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
