/**
 * Layout-matched loading skeletons for the Events & Experts journey.
 *
 * These mirror the real page structure (hero → sticky toolbar → card grid, or
 * detail hero → body) so route transitions never flash a blank screen or a
 * generic spinner. Shimmer reuses the shared `.img-skeleton` utility from
 * globals.css for a consistent look with in-page image placeholders.
 */

/** A single shimmering placeholder block. */
export function Shimmer({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`img-skeleton rounded-md ${className}`} style={style} aria-hidden />;
}

/* ── Shared chrome ─────────────────────────────────────────────────────── */

/** Centered hero: eyebrow, title, one line of copy. */
function HeroSkeleton({ align = "center" }: { align?: "center" | "left" }) {
  const items = align === "center" ? "items-center text-center" : "items-start text-left";
  const mx = align === "center" ? "mx-auto" : "";
  return (
    <section
      className="pt-28 sm:pt-32 pb-10"
      style={{
        background:
          "radial-gradient(ellipse 60% 55% at 50% 35%, rgba(255,106,47,0.07) 0%, transparent 65%), #FFFFFF",
      }}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-14">
        <div className={`flex flex-col gap-4 ${items}`}>
          <Shimmer className={`h-3.5 w-28 rounded-full ${mx}`} />
          <Shimmer className={`h-11 w-64 sm:w-80 rounded-lg ${mx}`} />
          <Shimmer className={`h-4 w-48 sm:w-72 rounded-full ${mx}`} />
        </div>
      </div>
    </section>
  );
}

/** Sticky toolbar: a row of filter pills + a search field. */
function ToolbarSkeleton({ maxW = "max-w-[1240px]" }: { maxW?: string }) {
  return (
    <section className="border-b border-black/[0.08] bg-white/95 backdrop-blur-md">
      <div className={`${maxW} mx-auto px-6 md:px-14 py-4 flex items-center gap-3 flex-wrap`}>
        <div className="flex items-center gap-2">
          {[64, 84, 72, 60].map((w, i) => (
            <Shimmer key={i} className="h-9 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <Shimmer className="h-10 w-full sm:w-[240px] rounded-xl sm:ml-auto" />
      </div>
    </section>
  );
}

/* ── Cards ─────────────────────────────────────────────────────────────── */

/** Mirrors EventCard: 16:9 poster, date row, two-line title, speaker, CTA. */
export function EventCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-black/[0.08] bg-white">
      <Shimmer className="aspect-[16/9] w-full rounded-none rounded-t-md" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Shimmer className="h-4 w-40 rounded-full" />
        <Shimmer className="h-5 w-full rounded" />
        <Shimmer className="h-5 w-3/4 rounded" />
        <div className="flex items-center gap-3 border-t border-black/[0.06] pt-4">
          <Shimmer className="h-9 w-9 rounded-full" />
          <Shimmer className="h-4 w-28 rounded-full" />
        </div>
        <div className="flex-1" />
        <Shimmer className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Mirrors the experts list ExpertCard: tall portrait + label strip. */
export function ExpertCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white">
      <Shimmer className="aspect-[3/4] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3 sm:p-4">
        <Shimmer className="h-4 w-3/4 rounded-full" />
        <Shimmer className="h-3 w-1/2 rounded-full" />
        <Shimmer className="mt-1 h-8 w-full rounded-full" />
      </div>
    </div>
  );
}

/* ── Full-page compositions ────────────────────────────────────────────── */

export function EventsListSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSkeleton />
      <ToolbarSkeleton />
      <section className="py-10 md:py-14">
        <div className="max-w-[1240px] mx-auto px-6 md:px-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ExpertsListSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSkeleton />
      <ToolbarSkeleton maxW="max-w-[1195.2px]" />
      <section className="py-10 md:py-14">
        <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ExpertCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Landing skeleton: split hero (text column + portrait media) + stats row.
 *  Matches the shared Events/Experts landing visual language. */
export function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-36 md:pt-44 pb-16 md:pb-24">
        <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            {/* Left: copy + CTAs */}
            <div className="flex flex-col gap-6">
              <Shimmer className="h-3.5 w-28 rounded-full" />
              <div className="flex flex-col gap-3">
                <Shimmer className="h-12 w-full max-w-[420px] rounded-lg" />
                <Shimmer className="h-12 w-3/4 max-w-[320px] rounded-lg" />
              </div>
              <Shimmer className="h-5 w-full max-w-[360px] rounded-full" />
              <div className="flex flex-wrap items-center gap-5 pt-2">
                <Shimmer className="h-12 w-44 rounded-full" />
                <Shimmer className="h-12 w-40 rounded-full" />
              </div>
            </div>
            {/* Right: portrait media */}
            <div className="w-full max-w-[400px] mx-auto lg:ml-auto">
              <Shimmer className="aspect-[3/4] w-full rounded-md" />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 md:pt-24">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 items-center md:items-start">
                <Shimmer className="h-10 w-24 rounded-lg" />
                <Shimmer className="h-4 w-28 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Detail-page skeleton: back link, title block, hero media, two-column body. */
export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 pt-28 sm:pt-32 pb-16">
        <Shimmer className="h-4 w-24 rounded-full" />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-8 lg:gap-12 items-start">
          {/* Left: title + meta + media */}
          <div className="flex flex-col gap-5">
            <Shimmer className="h-4 w-32 rounded-full" />
            <Shimmer className="h-9 w-full max-w-[460px] rounded-lg" />
            <Shimmer className="h-9 w-3/4 max-w-[360px] rounded-lg" />
            <div className="flex gap-3 pt-1">
              <Shimmer className="h-8 w-28 rounded-full" />
              <Shimmer className="h-8 w-24 rounded-full" />
            </div>
            <Shimmer className="mt-3 aspect-[16/9] w-full rounded-2xl" />
            <div className="flex flex-col gap-2.5 pt-3">
              <Shimmer className="h-4 w-full rounded-full" />
              <Shimmer className="h-4 w-11/12 rounded-full" />
              <Shimmer className="h-4 w-4/5 rounded-full" />
            </div>
          </div>
          {/* Right: sticky action card */}
          <div className="rounded-2xl border border-black/[0.08] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Shimmer className="h-13 w-13 rounded-2xl" />
              <div className="flex flex-col gap-2">
                <Shimmer className="h-4 w-28 rounded-full" />
                <Shimmer className="h-3 w-20 rounded-full" />
              </div>
            </div>
            <Shimmer className="h-px w-full rounded-none" />
            <Shimmer className="h-4 w-32 rounded-full" />
            <Shimmer className="h-4 w-24 rounded-full" />
            <Shimmer className="mt-2 h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
