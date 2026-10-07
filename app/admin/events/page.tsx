export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Calendar, ChevronRight, Plus, Search, Users, MapPin, Globe,
} from "lucide-react";
import EventToggle from "@/features/events/components/admin/EventToggle";
import {
  listEventsAdmin,
  getAdminEventStats,
} from "@/features/events/services/adminEvents.service";

interface Props {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function AdminEventsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const filter = (sp.filter === "active" || sp.filter === "inactive"
    ? sp.filter
    : "all") as "all" | "active" | "inactive";

  const [events, stats] = await Promise.all([
    listEventsAdmin({ q, filter }),
    getAdminEventStats(),
  ]);

  const statCards = [
    { label: "Total events", value: stats.total, accent: "#1A1A1A" },
    { label: "Active", value: stats.active, accent: "#FF6A2F" },
    { label: "Inactive", value: stats.inactive, accent: "#8A8A8A" },
    { label: "Registrations", value: stats.totalRegistrations, accent: "#0891B2" },
  ];

  const tabs: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <main className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 space-y-7">
        {/* Title + CTA */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] md:text-[34px] font-bold text-ink tracking-tight">
              Events
            </h1>
            <p className="text-[15px] md:text-[16px] text-ink-3 mt-1">
              Manage workshops, sessions, and registrations.
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange text-white text-[14px] font-semibold shadow-[0_10px_28px_-10px_rgba(255,106,47,0.5)] hover:bg-orange-dark active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> New event
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl border border-black/[0.08] shadow-card px-5 py-5"
            >
              <p
                className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-none mb-1.5"
                style={{ color: c.accent }}
              >
                {c.value}
              </p>
              <p className="text-[11px] sm:text-[12px] font-semibold text-ink-3 uppercase tracking-widest">
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by title, speaker, slug…"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-transparent bg-cream-2 text-[14px] text-ink placeholder:text-ink-5 outline-none focus:bg-white focus:border-orange/30 focus:ring-2 focus:ring-orange/15 transition-all"
            />
            {filter !== "all" && (
              <input type="hidden" name="filter" value={filter} />
            )}
          </form>
          <div className="flex items-center gap-1 bg-cream-2 rounded-lg p-1 shrink-0">
            {tabs.map((t) => {
              const params = new URLSearchParams();
              if (t.key !== "all") params.set("filter", t.key);
              if (q) params.set("q", q);
              const href = `/admin/events${params.toString() ? `?${params}` : ""}`;
              const active = filter === t.key;
              return (
                <Link
                  key={t.key}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
                    active
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-3 hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Events list */}
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card p-16 text-center">
            <Calendar className="w-10 h-10 text-ink-4 mx-auto mb-4 opacity-30" />
            <h3 className="text-[18px] font-bold text-ink mb-1">No events yet</h3>
            <p className="text-[14px] text-ink-4 max-w-[360px] mx-auto leading-relaxed">
              {q || filter !== "all"
                ? "No events match your filters. Try a different search."
                : "Create your first event to start accepting registrations."}
            </p>
            {!q && filter === "all" && (
              <Link
                href="/admin/events/new"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange text-white text-[14px] font-semibold hover:bg-orange-dark transition-colors"
              >
                <Plus className="w-4 h-4" /> Create event
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-card overflow-hidden divide-y divide-black/[0.06]">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex flex-col lg:flex-row lg:items-center gap-4 px-5 sm:px-6 py-5 hover:bg-cream-2/40 transition-colors"
              >
                {/* Primary info */}
                <Link
                  href={`/admin/events/${e.id}`}
                  className="flex-1 min-w-0 flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[16.5px] font-bold text-ink tracking-tight leading-snug">
                      {e.title}
                    </h3>
                    {!e.is_active && (
                      <span className="text-[10.5px] font-bold text-ink-4 bg-black/[0.05] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Inactive
                      </span>
                    )}
                  </div>
                  {e.short_description && (
                    <p className="text-[13.5px] text-ink-4 line-clamp-1 max-w-[680px]">
                      {e.short_description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5 text-[12.5px] text-ink-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-ink-4" />
                      {formatDate(e.event_date)}
                      {e.start_time ? ` · ${e.start_time}` : ""}
                    </span>
                    {e.format && (
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-ink-4" />
                        {e.format}
                      </span>
                    )}
                    {e.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-ink-4" />
                        {e.city}
                      </span>
                    )}
                    {e.speaker_name && (
                      <span className="text-ink-3">
                        Speaker:{" "}
                        <span className="font-semibold text-ink-2">
                          {e.speaker_name}
                        </span>
                      </span>
                    )}
                  </div>
                </Link>

                {/* Registrations + actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 lg:w-auto">
                  <Link
                    href={`/admin/registrations/${e.id}`}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cream-2 hover:bg-orange-lighter text-ink-2 hover:text-orange-deep transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[13px] font-semibold">
                      {e.registration_count}
                      {e.registration_limit ? ` / ${e.registration_limit}` : ""}
                    </span>
                  </Link>

                  <EventToggle id={e.id} isActive={e.is_active} />

                  <Link
                    href={`/admin/events/${e.id}`}
                    className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-3 hover:text-orange-deep transition-colors"
                  >
                    Edit <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}
