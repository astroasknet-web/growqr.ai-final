"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Search, MapPinOff } from "lucide-react";
import { Icon } from "@iconify/react";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { COUNTRIES, type CountryCode } from "@/features/experts/data/experts-data";
import { COMMUNITIES, type Community } from "./community-data";
import CommunityCard from "./CommunityCard";
import CommunityQRModal from "./CommunityQRModal";

/* ── Country codes available in the community filter ───────────────────────── */
const COMMUNITY_COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

/* ── Reusable country dropdown (same pattern as AllExpertsPage) ─────────────── */
function CountryDropdown({
  value,
  onChange,
}: {
  value: CountryCode | "All";
  onChange: (v: CountryCode | "All") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const options: (CountryCode | "All")[] = ["All", ...COMMUNITY_COUNTRY_CODES];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold bg-white border border-black/[0.1] text-ink/70 hover:border-black/20 hover:text-ink active:scale-[0.96] transition-all duration-200"
      >
        {value === "All" ? (
          <Icon icon="solar:global-linear" width={15} height={15} className="text-ink/50" />
        ) : (
          <Icon icon={COUNTRIES[value].flag} width={15} height={15} />
        )}
        {value === "All" ? "All countries" : COUNTRIES[value].name}
        <Icon
          icon="solar:alt-arrow-down-linear"
          width={14}
          height={14}
          className={`text-ink/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-[calc(100%+6px)] z-40 min-w-[190px] p-1.5 rounded-2xl bg-white border border-black/[0.08] shadow-[0_20px_48px_-12px_rgba(0,0,0,0.18)]"
        >
          {options.map((opt) => {
            const isSel = opt === value;
            return (
              <button
                key={opt}
                role="option"
                aria-selected={isSel}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors active:scale-[0.98] ${
                  isSel ? "bg-orange/10 text-orange" : "text-ink/70 hover:bg-black/[0.03]"
                }`}
              >
                {opt === "All" ? (
                  <Icon icon="solar:global-linear" width={16} height={16} className="opacity-60" />
                ) : (
                  <Icon icon={COUNTRIES[opt].flag} width={16} height={16} />
                )}
                {opt === "All" ? "All countries" : COUNTRIES[opt].name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CommunityFinder() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<CountryCode | "All">("All");
  const [activeQR, setActiveQR] = useState<Community | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMUNITIES.filter((c) => {
      if (country !== "All" && c.country !== country) return false;
      if (!q) return true;
      return (
        c.state.toLowerCase().includes(q) ||
        c.communityName.toLowerCase().includes(q)
      );
    });
  }, [query, country]);

  return (
    <section id="finder" className="bg-white border-y border-black/5 py-12 md:py-20 px-6 md:px-14">
      <div className="max-w-[1280px] mx-auto">
        {/* Header row — heading left, controls right on desktop */}
        <Reveal direction="up" offset={20}>
          <div className="mb-9 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[520px]">
              <Eyebrow>Community Finder</Eyebrow>
              <h2 className="mt-3 text-[32px] md:text-[44px] font-medium tracking-[-0.04em] leading-[1.05] text-ink">
                Find your <span className="text-orange">community.</span>
              </h2>
              <p className="mt-3 text-[15px] text-ink-3 leading-relaxed">
                Pick your region and grow together.
              </p>
            </div>

            {/* Controls — country filter + search */}
            <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
              <CountryDropdown value={country} onChange={setCountry} />

              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-ink-4" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by state"
                  aria-label="Search communities by state"
                  className="w-full rounded-full border border-black/10 bg-white py-3.5 pl-12 pr-4 text-[14px] text-ink placeholder:text-ink-5 transition-all focus:border-orange/40 focus:outline-none focus:ring-2 focus:ring-orange/25"
                />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Cards — horizontal snap-scroll on mobile, grid on sm+ */}
        {filtered.length > 0 ? (
          <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-1 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-2 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filtered.map((community, idx) => (
              <Reveal
                key={community.id}
                direction="up"
                offset={20}
                delay={idx * 0.05}
                className="w-[85%] min-[460px]:w-[70%] shrink-0 snap-start sm:w-auto sm:shrink"
              >
                <CommunityCard community={community} onViewQR={setActiveQR} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/12 bg-white/60 py-16 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-orange/8 text-orange">
              <MapPinOff className="h-5 w-5" />
            </div>
            <p className="text-[15px] font-semibold text-ink">
              No community found{query ? ` for "${query}"` : " for this filter"}.
            </p>
            <p className="mt-1 text-[13px] text-ink-4">
              We&apos;re expanding fast — new regions are added every week.
            </p>
            <button
              onClick={() => { setQuery(""); setCountry("All"); }}
              className="mt-3 text-sm font-semibold text-orange hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeQR && (
          <CommunityQRModal
            community={activeQR}
            onClose={() => setActiveQR(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
