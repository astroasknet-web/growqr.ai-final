import React from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  center = false,
  muted = false,
  className = "",
}: {
  children: React.ReactNode;
  /** Center the badge within its row (used on centered headers / heroes).
   *  The wrapper handles alignment, so this works regardless of the
   *  parent's `text-align`. */
  center?: boolean;
  /** Dim variant used for "before" / "stuck" columns in the Pain→Ambition
   *  flip on persona pages — a neutral grey badge that reads as the
   *  negative pair to the active orange one. */
  muted?: boolean;
  className?: string;
}) {
  // Clean white pill badge with a subtle border + status dot. Active = orange
  // accent; muted = neutral grey (the "stuck" pair on persona pages).
  const tone = muted ? "text-ink-4" : "text-orange-deep";
  const dot = muted
    ? "bg-ink-5 ring-ink-5/15"
    : "bg-orange ring-orange/20";
  return (
    <div
      className={`flex mb-5 ${center ? "justify-center" : "justify-start"} ${className}`}
    >
      <span
        className={`group inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white ${tone} pl-2.5 pr-3.5 py-[7px] text-[11px] font-semibold uppercase tracking-[0.14em] leading-none shadow-[0_1px_3px_rgba(15,23,42,0.06)]`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ring-[3px] ${dot}`} aria-hidden />
        {children}
      </span>
    </div>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Typography mirrors the Hero headline — `font-medium` (not bold),
  // tight negative tracking, and cinched line-height for display feel.
  return (
    <h2
      className={cn(
        "text-[40px] md:text-[52px] xl:text-[64px] font-medium tracking-[-0.04em] md:tracking-[-0.05em] leading-[0.95] md:leading-[0.92] text-ink",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function SectionSub({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[17px] text-ink-3 leading-relaxed max-w-[540px] font-normal ${className}`}
    >
      {children}
    </p>
  );
}
