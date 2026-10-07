"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, History, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventRow } from "../../types/event";
import EventCard from "../cards/EventCard";

const ease = [0.22, 1, 0.36, 1] as const;
const PER_PAGE = 9;

type Tab = "Upcoming" | "Past" | "All";

/* Stagger the card grid in on mount / tab / page change for a livelier feel. */
const gridContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const gridItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

/* ── helpers ─────────────────────────────────────────────────────────────── */

function isUpcoming(event: EventRow): boolean {
  // Compare ISO date strings, works reliably for yyyy-mm-dd
  const today = new Date().toISOString().split("T")[0];
  return event.event_date >= today;
}

/* ── props ────────────────────────────────────────────────────────────────── */

interface Props {
  events: EventRow[];
}

export default function AllEventsPage({ events }: Props) {
  const upcoming = useMemo(() => events.filter(isUpcoming), [events]);
  // Past events: most recent first, that's the natural scanning order.
  const past = useMemo(
    () =>
      events
        .filter((e) => !isUpcoming(e))
        .sort((a, b) => b.event_date.localeCompare(a.event_date)),
    [events],
  );

  // Only surface tabs for categories that actually have events; "All" only
  // makes sense when both exist.
  const tabs = useMemo<Tab[]>(() => {
    const t: Tab[] = [];
    if (upcoming.length) t.push("Upcoming");
    if (past.length) t.push("Past");
    if (upcoming.length && past.length) t.push("All");
    return t;
  }, [upcoming, past]);

  // Default to Upcoming when available, otherwise fall back to Past.
  const [tab, setTab] = useState<Tab>(() => tabs[0] ?? "Upcoming");
  const [page, setPage] = useState(1);

  // The full list for the active tab (All = upcoming first, then past).
  const list = useMemo(
    () => (tab === "Upcoming" ? upcoming : tab === "Past" ? past : [...upcoming, ...past]),
    [tab, upcoming, past],
  );

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = list.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  function selectTab(t: Tab) {
    setTab(t);
    setPage(1);
  }

  function goToPage(p: number) {
    setPage(p);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const TAB_META: Record<Tab, { icon: typeof CalendarDays; count: number }> = {
    Upcoming: { icon: CalendarDays, count: upcoming.length },
    Past: { icon: History, count: past.length },
    All: { icon: CalendarDays, count: events.length },
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="pt-28 sm:pt-32 pb-12 md:pb-14"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(255,106,47,0.08) 0%, transparent 65%), #FFFFFF",
        }}
      >
        <div className="max-w-[1240px] mx-auto px-6 md:px-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-deep">
              <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
              GrowQR Events
            </div>
            <h1 className="mt-3 text-[34px] sm:text-[46px] md:text-[54px] font-medium tracking-[-0.04em] leading-[0.96] text-ink">
              All Events
            </h1>
            <p className="mt-4 text-[15px] md:text-[17px] text-ink/75 max-w-[520px] mx-auto leading-relaxed">
              Every GrowQR session in one place, live workshops, expert talks, and
              everything you may have missed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Toolbar (tabs only) ──────────────────────────────────────────── */}
      {events.length > 0 && tabs.length > 1 && (
        <section className="border-y border-black/[0.08] sticky top-[68px] z-30 bg-white/95 backdrop-blur-md">
          <div className="max-w-[1240px] mx-auto px-6 md:px-14 py-4 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            {tabs.map((t) => {
              const { icon: TabIcon, count } = TAB_META[t];
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => selectTab(t)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-[0.96] ${
                    active
                      ? "bg-orange text-white shadow-[0_8px_20px_-10px_rgba(255,106,47,0.7)]"
                      : "bg-cream border border-black/[0.08] text-ink-3 hover:border-black/15 hover:text-ink active:bg-black/[0.04]"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {t}
                  <span className={`text-[11px] ${active ? "text-white/70" : "text-ink-5"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-14">
        <div className="max-w-[1240px] mx-auto px-6 md:px-14">
          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange/10 text-orange-deep text-2xl">
                📅
              </span>
              <p className="text-[16px] font-semibold text-ink">No events yet</p>
              <p className="text-[14px] text-ink-3 max-w-sm">
                We&apos;re lining up the next sessions. Check back soon, new events
                drop regularly.
              </p>
            </div>
          ) : (
            <>
              <motion.div
                key={`${tab}-${currentPage}`}
                variants={gridContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {paged.map((ev) => (
                  <motion.div key={ev.slug} variants={gridItem}>
                    <EventCard event={ev} isPast={!isUpcoming(ev)} from="all" />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="Events pagination"
                  className="mt-12 flex items-center justify-center gap-1.5"
                >
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-black/[0.1] bg-white text-ink-3 transition-all hover:border-black/25 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.95]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const active = p === currentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center justify-center h-10 min-w-10 px-3 rounded-full text-[13.5px] font-semibold transition-all active:scale-[0.95] ${
                          active
                            ? "bg-orange text-white shadow-[0_8px_20px_-10px_rgba(255,106,47,0.7)]"
                            : "bg-white border border-black/[0.1] text-ink-3 hover:border-black/25 hover:text-ink"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-black/[0.1] bg-white text-ink-3 transition-all hover:border-black/25 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.95]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
