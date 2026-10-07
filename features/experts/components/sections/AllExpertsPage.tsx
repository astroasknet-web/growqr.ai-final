/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { visibleExperts, COUNTRIES, DEFAULT_EXPERT_SHADE, type Expert, type CountryCode } from "@/features/experts/data/experts-data";

/* ══════════════════════════════════════════════════════════════════════════
   AllExpertsPage — browse every listed expert.
   Uniform cards, minimal text, search + category-badge filtering.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── Categories — curated, keyword-matched against each expert ──────────── */
const CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Leadership", keywords: ["leadership", "executive"] },
  { label: "Career", keywords: ["career"] },
  { label: "Coaching", keywords: ["coaching", "coach", "nlp"] },
  { label: "Business & Growth", keywords: ["growth", "business", "strategy"] },
  { label: "Design", keywords: ["design", "ux", "product", "portfolio"] },
  { label: "Education", keywords: ["education", "academic", "research"] },
];

function expertHaystack(e: Expert): string {
  return [e.tag, e.role, ...e.expertise].join(" ").toLowerCase();
}

function matchesCategory(e: Expert, keywords: string[]): boolean {
  const hay = expertHaystack(e);
  return keywords.some((k) => hay.includes(k));
}

/* ─── Uniform expert card ────────────────────────────────────────────────── */
function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/experts/${expert.slug}?from=all`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-orange/30 hover:shadow-[0_24px_55px_-22px_rgba(0,0,0,0.28)] active:translate-y-0 active:scale-[0.985] active:duration-100"
    >
      {/* Portrait — fixed 4:5 ratio keeps cards uniform without heavy cropping */}
      <div className={`relative aspect-[4/5] overflow-hidden flex-shrink-0 ${expert.cardBg ?? DEFAULT_EXPERT_SHADE}`}>
        <img
          alt={expert.name}
          src={expert.image}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105 grayscale"
        />
        {/* RQ-Score */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-orange px-3 py-1.5 text-white text-xs font-bold shadow-[0_4px_14px_-4px_rgba(255,106,47,0.6)]">
          <span>RQ-Score</span>
          <span className="tabular-nums">{expert.rqScore}</span>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="flex items-center gap-1 text-ink text-base font-semibold leading-tight">
            <span className="truncate">{expert.displayName ?? expert.name}</span>
            {expert.verified && (
              <Icon icon="material-symbols:verified-rounded" className="text-[#1D9BF0] shrink-0" width={15} height={15} aria-label="Verified" />
            )}
          </h3>
          <p className="text-orange text-[13px] font-medium line-clamp-1">{expert.tag}</p>
        </div>

        {/* CTA */}
        <div className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-cream border border-black/[0.08] py-2 text-[13px] font-semibold text-ink transition-all duration-200 group-hover:bg-orange group-hover:border-orange group-hover:text-white">
          View Profile
          <Icon icon="solar:arrow-right-linear" width={15} height={15} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Country filter dropdown (name + flag) ──────────────────────────────── */
function CountryDropdown({
  countries,
  value,
  onChange,
}: {
  countries: CountryCode[];
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

  const options: (CountryCode | "All")[] = ["All", ...countries];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold bg-cream border border-black/[0.08] text-ink/70 hover:border-black/15 hover:text-ink active:scale-[0.96] active:bg-black/[0.04] transition-all duration-200"
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
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-colors active:scale-[0.98] ${
                  isSel ? "bg-orange/10 text-orange" : "text-ink/70 hover:bg-black/[0.03] active:bg-black/[0.05]"
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

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AllExpertsPage() {
  const [active, setActive] = useState<string>("All");
  const [country, setCountry] = useState<CountryCode | "All">("All");
  const [query, setQuery] = useState("");

  // Only show category chips that actually have experts
  const categories = useMemo(
    () => CATEGORIES.filter((c) => visibleExperts.some((e) => matchesCategory(e, c.keywords))),
    [],
  );

  const availableCountries = useMemo(
    () => Object.keys(COUNTRIES) as CountryCode[],
    [],
  );

  const filtered = useMemo(() => {
    let list = visibleExperts;
    if (active !== "All") {
      const cat = CATEGORIES.find((c) => c.label === active);
      if (cat) list = list.filter((e) => matchesCategory(e, cat.keywords));
    }
    if (country !== "All") {
      list = list.filter((e) => e.country === country);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.tag.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.expertise.some((x) => x.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [active, country, query]);

  return (
    <div className="text-black text-base font-normal bg-white min-h-screen flex flex-col">
      <Navbar hideUseCases />

      <main className="flex-1">
        {/* Hero header */}
        <section
          className="pt-32 md:pt-36 pb-8"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 30%, rgba(255,106,47,0.08) 0%, transparent 65%), #FFFFFF",
          }}
        >
          <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <span className="text-orange text-sm font-semibold uppercase tracking-widest">Our Experts</span>
              <h1 className="text-ink text-4xl md:text-6xl font-semibold tracking-[-1px] leading-[1.05]">
                Meet the experts
              </h1>
              <p className="text-black/55 text-lg max-w-md">
                Book a 1:1 session with vetted experts across leadership, careers, design, and growth.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Toolbar — category badges + search */}
        <section className="sticky top-[72px] z-30 border-b border-black/[0.07] bg-white/95 backdrop-blur-md">
          <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7 py-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {["All", ...categories.map((c) => c.label)].map((label) => (
                <button
                  key={label}
                  onClick={() => setActive(label)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-[0.96] ${
                    active === label
                      ? "bg-orange text-white shadow-[0_3px_12px_-3px_rgba(255,106,47,0.55)]"
                      : "bg-cream border border-black/[0.08] text-ink/60 hover:border-black/15 hover:text-ink active:bg-black/[0.04]"
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* Country filter — dropdown (name + flag) */}
              <>
                <span className="mx-1 h-5 w-px bg-black/10" aria-hidden />
                <CountryDropdown countries={availableCountries} value={country} onChange={setCountry} />
              </>
            </div>

            <div className="relative w-full sm:w-auto sm:ml-auto">
              <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" width={16} height={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search experts…"
                className="pl-10 pr-4 py-2.5 rounded-xl border border-black/[0.1] bg-white text-[13.5px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange/30 transition-all w-full sm:w-[200px] md:w-[240px]"
              />
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="py-10 md:py-14">
          <div className="max-w-[1195.2px] w-full mx-auto px-5 md:px-7">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24 text-center">
                <Icon icon="solar:users-group-rounded-bold-duotone" width={40} height={40} className="text-ink/20" />
                <p className="text-ink/50">No experts match your search.</p>
                <button
                  onClick={() => { setQuery(""); setActive("All"); setCountry("All"); }}
                  className="text-sm font-semibold text-orange hover:underline active:opacity-70 transition-opacity"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <motion.div
                key={`${active}-${country}-${query}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
              >
                {filtered.map((e) => (
                  <ExpertCard key={e.slug} expert={e} />
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
