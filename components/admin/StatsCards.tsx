"use client";

import { useEffect, useState } from "react";

interface Stats {
  total: number;
  pending: number;
  screening: number;
  interviewed: number;
  under_review: number;
  shortlisted: number;
  rejected: number;
}

const cards = [
  { key: "total",        label: "Total",        accent: "#1A1A1A" },
  { key: "pending",      label: "Pending",       accent: "#D97706" },
  { key: "screening",    label: "Screening",     accent: "#7C3AED" },
  { key: "interviewed",  label: "Interviewed",   accent: "#EA580C" },
  { key: "under_review", label: "Reviewing",     accent: "#2563EB" },
  { key: "shortlisted",  label: "Shortlisted",   accent: "#0891B2" },
  { key: "rejected",     label: "Rejected",      accent: "#DC2626" },
] as const;

export default function StatsCards({ stats }: { stats: Stats }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile: Horizontal scrollable design
  if (isMobile) {
    return (
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <style>{`
          .stats-scroll::-webkit-scrollbar { height: 4px; }
          .stats-scroll::-webkit-scrollbar-track { background: transparent; }
          .stats-scroll::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 2px; }
        `}</style>
        <div className="flex gap-3 stats-scroll snap-x snap-mandatory">
          {cards.map(({ key, label, accent }) => (
            <div
              key={key}
              className="flex-shrink-0 w-[140px] bg-white rounded-lg border border-black/[0.1] shadow-card p-4 snap-center"
            >
              <p
                className="text-[32px] font-bold leading-none mb-2"
                style={{ color: accent }}
              >
                {stats[key]}
              </p>
              <p className="text-[11px] font-semibold text-ink-3 uppercase tracking-wide leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: Grid design
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
      {cards.map(({ key, label, accent }) => (
        <div
          key={key}
          className="bg-white rounded-xl border border-black/[0.1] shadow-card px-3 sm:px-6 py-4 sm:py-5"
        >
          <p
            className="text-[28px] sm:text-[32px] md:text-[36px] lg:text-[38px] font-bold tracking-tight leading-none mb-1 sm:mb-1.5"
            style={{ color: accent }}
          >
            {stats[key]}
          </p>
          <p className="text-[10px] sm:text-[12px] md:text-[13px] font-semibold text-ink-3 uppercase tracking-widest">{label}</p>
        </div>
      ))}
    </div>
  );
}
