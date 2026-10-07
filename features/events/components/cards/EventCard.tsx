"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import type { EventRow } from "../../types/event";

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

interface Props {
  event: EventRow;
  isPast?: boolean;
  /** Tags the detail link so its breadcrumb can route back here (e.g. "all"). */
  from?: string;
}

export default function EventCard({ event, isPast = false, from }: Props) {
  return (
    <Link
      href={from ? `/events/${event.slug}?from=${from}` : `/events/${event.slug}`}
      className={`group flex flex-col overflow-hidden rounded-md border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.25)] active:translate-y-0 active:scale-[0.985] active:duration-100 ${
        isPast
          ? "border-black/[0.08] opacity-90 hover:opacity-100 hover:border-black/15"
          : "border-black/[0.08] hover:border-orange/30"
      }`}
    >
      {/* Poster */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-md bg-cream flex-shrink-0">
        {event.poster_url ? (
          <Image
            src={event.poster_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={`object-cover transition-transform duration-500 ${isPast ? "" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange/15 via-orange/5 to-cream">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink/40">GrowQR Events</span>
          </div>
        )}
        {isPast && (
          <div className="absolute top-3 right-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/80">
              Ended
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Date + time */}
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

        {/* Title */}
        <h4 className="text-ink text-xl font-semibold leading-7 line-clamp-2 min-h-[3.5rem] group-hover:text-orange transition-colors duration-200">
          {event.title}
        </h4>

        {/* Speaker — name + PFP only (no role) */}
        {event.speaker_name && (
          <div className="flex items-center gap-3 border-t border-black/[0.06] pt-4">
            {event.speaker_image ? (
              <Image
                src={event.speaker_image}
                alt={event.speaker_name}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover object-top flex-shrink-0"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange/10 text-xs font-bold text-orange flex-shrink-0">
                {initials(event.speaker_name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-black/35 leading-none">Speaker</p>
              <p className="text-ink text-sm font-semibold leading-tight truncate">{event.speaker_name}</p>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div
          className={`mt-1 flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
            isPast
              ? "bg-cream border border-black/[0.08] text-ink-3"
              : "bg-orange text-white hover:bg-orange-dark hover:shadow-[0_10px_24px_-10px_rgba(255,106,47,0.6)]"
          }`}
        >
          {isPast ? "View Details" : "Register Now"}
          <Icon icon="solar:arrow-right-linear" width={16} height={16} />
        </div>
      </div>
    </Link>
  );
}
