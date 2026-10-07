"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import BookSessionModal from "@/features/experts/components/modals/BookSessionModal";
import { personas } from "@/lib/personas";
import { agents } from "@/lib/data";
import { AGENT_PAGE } from "@/lib/agentMedia";
import { AgentName } from "@/components/ui/AgentName";
import type { ExpertData, ExpertPackage } from "@/features/experts/types";
import {
  type Expert,
  type BenefitIcon,
  sessionFaqs,
  COUNTRIES,
  DEFAULT_EXPERT_SHADE,
} from "@/features/experts/data/experts-data";
import { resolveBookingAmountINR } from "@/lib/payments/booking-amount";

/* ══════════════════════════════════════════════════════════════════════════
   ExpertDetailPage — premium expert profile.
   Showcase only. No calendar / slot picker — "Book Session" starts the flow.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─── Small shared pieces ────────────────────────────────────────────────── */
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h6 className="text-orange text-lg leading-[25.2px]">{label}</h6>
      <h3 className="text-ink text-3xl font-semibold leading-9 md:text-5xl md:leading-[57.6px]">{title}</h3>
    </div>
  );
}

function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = rating >= i ? 1 : rating >= i - 0.5 ? 0.5 : 0;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
            <defs>
              <linearGradient id={`star-${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="#FF6A2F" />
                <stop offset={`${fill * 100}%`} stopColor="#E6E6E6" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77l-5.2 2.73.99-5.78L1.58 7.62l5.82-.85L10 1.5z"
              fill={`url(#star-${i}-${fill})`}
            />
          </svg>
        );
      })}
    </div>
  );
}

/* LinkedIn glyph — the only social surfaced going forward */
function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0zM.5 8h4v12h-4V8zm7.5 0h3.8v1.64h.05c.53-1 1.83-2.04 3.77-2.04C19.6 7.6 21 9.3 21 12.5V20h-4v-6.5c0-1.55-.03-3.55-2.16-3.55-2.16 0-2.49 1.69-2.49 3.44V20H8V8z" />
    </svg>
  );
}

/* Benefit icons — Solar Bold Duotone (Iconify); inherit currentColor (orange) */
const benefitIconName: Record<BenefitIcon, string> = {
  guidance: "solar:target-bold-duotone",
  career: "solar:graph-up-bold-duotone",
  insights: "solar:lightbulb-bold-duotone",
  strategy: "solar:compass-bold-duotone",
  problem: "solar:bolt-bold-duotone",
  steps: "solar:checklist-minimalistic-bold-duotone",
};

function BenefitGlyph({ icon }: { icon: BenefitIcon }) {
  return <Icon icon={benefitIconName[icon]} width={28} height={28} aria-hidden />;
}

/* Signature hard-shadow CTA — arrow inherits button text color */
function BookButton({ className = "", full = false, onClick }: { className?: string; full?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group items-center bg-orange text-white shadow-[0_6px_0_0_rgb(0,0,0)] inline-flex justify-center gap-2 border border-orange px-7 py-4 rounded-full hover:bg-orange-dark hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 transition-all duration-200 active:translate-y-1 ${
        full ? "w-full" : "w-fit"
      } ${className}`}
    >
      <span className="text-lg font-semibold">Book Session</span>
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
    </button>
  );
}

/* ─── Premium accordion (FAQ pattern reused) ─────────────────────────────── */
function Accordion({
  items,
}: {
  items: { title: string; content: React.ReactNode }[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={item.title}
            className={`border rounded-2xl px-4 md:px-5 transition-colors duration-200 ${
              isOpen ? "border-orange/40 bg-orange/[0.03]" : "border-black/15"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-4 text-left"
            >
              <span className="text-ink text-lg font-semibold leading-7">{item.title}</span>
              <span
                className={`shrink-0 border p-1.5 rounded-full transition-all duration-300 ${
                  isOpen ? "border-orange bg-orange rotate-45" : "border-black/20 rotate-0"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke={isOpen ? "white" : "#1A1A1A"} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[1600px] pb-5" : "max-h-0"
              }`}
            >
              <div className="text-black/70 text-base leading-relaxed">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpandableIntro({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return; // only measure in collapsed state
    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight + 2);
    measure();
    // Re-measure once web fonts finish loading (line wrapping can change)
    document.fonts?.ready?.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, expanded]);

  return (
    <div className="flex flex-col gap-1 max-w-2xl">
      <p
        ref={ref}
        className={`text-black/70 text-lg leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
      >
        {text}
      </p>
      {isClamped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-sm font-semibold text-orange hover:text-orange-dark transition-colors duration-200"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

/* Pick the most-relevant expertise badges that fit ONE row in the hero.
   Greedy by an approximate width budget (label chars + per-badge overhead),
   capped at 4 — so long labels (e.g. "Emotional Intelligence") never wrap. */
function fitBadges(items: string[], budget = 92, maxCount = 4): string[] {
  const out: string[] = [];
  let used = 0;
  for (const it of items) {
    if (out.length >= maxCount) break;
    const cost = it.length + 6; // ~padding + gap + border in char-units
    if (out.length > 0 && used + cost > budget) break;
    out.push(it);
    used += cost;
  }
  return out;
}

/* Compact large counts for the stat strip: 150000 → "150K", 112 → "112" */
function compactCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return String(n);
}

/** Numeric magnitude of a stat value string ("16+" -> 16, "150K+" -> 150000)
 *  so the badge strip can be ordered smallest -> largest. */
function statMagnitude(value: string): number {
  const m = value.replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[m[2].toUpperCase()] ?? 1;
  return n * mult;
}

function TagList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="border border-black/15 bg-white text-ink/90 text-sm font-medium px-3.5 py-1.5 rounded-full max-w-full break-words"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════════════════ */
export default function ExpertDetailPage({ expert }: { expert: Expert }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [backTo, setBackTo] = useState<{ href: string; label: string }>({
    href: "/experts",
    label: "Experts",
  });

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "all") setBackTo({ href: "/experts/all", label: "All Experts" });
  }, []);

  // Displayed booking price is derived from the authoritative server charge
  // (lib/payments/booking-amount.ts) so the modal & Razorpay never disagree:
  // ₹1 while TEST_MODE is on, the real session price once it's off.
  const bookingPriceLabel = `₹${resolveBookingAmountINR(expert.slug).toLocaleString("en-IN")}`;

  const expertForModal: ExpertData = {
    slug: expert.slug,
    name: expert.name,
    title: expert.role,
    headline: expert.headline,
    intro: expert.intro,
    image: expert.image,
    bg: "from-orange/10 to-orange/5",
    expertise: expert.expertise,
    socialProof: { companies: [], rating: expert.rating, reviewsCount: expert.reviewCount, sessionsHosted: 0 },
    startingPrice: bookingPriceLabel,
    availabilityLabel: "Available",
    about: { paragraphs: [expert.about], highlights: [] },
    outcomes: [],
    packages: [],
    testimonials: [],
    faq: [],
  };

  const sessionPackage: ExpertPackage = {
    id: "standard",
    label: "1:1 Session",
    minutes: parseInt(expert.sessionDuration) || 60,
    price: bookingPriceLabel,
  };

  const accordionItems = [
    ...(expert.about?.trim()
      ? [{ title: "About", content: <p>{expert.about}</p> }]
      : []),
    ...(expert.expertise?.length
      ? [{ title: "Expertise", content: <TagList items={expert.expertise} /> }]
      : []),
    ...(expert.skills?.length
      ? [{ title: "Skills", content: <TagList items={expert.skills} /> }]
      : []),
    ...(expert.education?.length
      ? [{
      title: "Education",
      content: (
        <ul className="flex flex-col gap-3 list-none pl-0">
          {expert.education.map((e) => (
            <li key={e.degree} className="flex flex-col">
              <span className="text-ink font-semibold">{e.degree}</span>
              <span className="text-black/60">
                {e.school ? `${e.school} · ` : ""}{e.year}
              </span>
            </li>
          ))}
        </ul>
      ),
    }]
      : []),
    ...(expert.workExperience?.length
      ? [{
      title: "Work Experience",
      content: (
        <div className="flex flex-col gap-2.5">
          {expert.workExperience.map((w) => {
            const showCompany = !!w.company && w.company.toLowerCase() !== "independent";
            return (
              <div
                key={`${w.position}-${w.duration}`}
                className="rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 transition-colors duration-200 hover:border-orange/30"
              >
                <p className="text-ink text-[13.5px] font-semibold leading-snug">{w.position}</p>
                {showCompany && (
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-black/55">
                    <Icon icon="solar:buildings-2-bold-duotone" width={13} height={13} className="shrink-0 text-orange" aria-hidden />
                    {w.company}
                  </p>
                )}
                <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-black/45">
                  <Icon icon="solar:calendar-bold-duotone" width={12} height={12} className="shrink-0 text-orange/70" aria-hidden />
                  {w.duration}
                </p>
              </div>
            );
          })}
        </div>
      ),
    }]
      : []),
    ...(expert.certifications?.length
      ? [{ title: "Certifications", content: <TagList items={expert.certifications} /> }]
      : []),
    ...(expert.industries?.length
      ? [{ title: "Industries", content: <TagList items={expert.industries} /> }]
      : []),
    ...(expert.languages?.length
      ? [{ title: "Languages", content: <TagList items={expert.languages} /> }]
      : []),
    ...(expert.awards?.length
      ? [{
          title: "Awards & Recognition",
          content: (
            <ul className="flex flex-col gap-3 list-none pl-0">
              {expert.awards.map((a) => (
                <li key={a} className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5" aria-hidden>
                    <circle cx="12" cy="12" r="12" fill="#FF6A2F" opacity="0.12" />
                    <path d="M7 12.5L10.5 16L17 9" stroke="#FF6A2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-black/70 leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          ),
        }]
      : []),
  ];

  return (
    <div className="text-black text-base font-normal bg-white">
      <Navbar hideUseCases />
      <main>
        {/* Breadcrumb */}
        <div className="max-w-[1280px] w-full mx-auto px-5 md:px-7">
          <div className="pt-32 md:pt-36 flex items-center gap-2 text-sm text-black/50">
            <Link href={backTo.href} className="hover:text-orange transition-colors">{backTo.label}</Link>
            <span>/</span>
            <span className="text-ink/80">{expert.name}</span>
          </div>
        </div>

        {/* ── Top region: two-column grid (sticky profile + hero/benefits) ── */}
        <div className="max-w-[1280px] w-full mx-auto px-5 md:px-7">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5 sm:gap-6 md:gap-8 lg:gap-12 pt-4 sm:pt-6 md:pt-10">
            {/* LEFT: sticky profile + accordion */}
            <aside className="lg:sticky lg:top-28 lg:self-start flex flex-col gap-5">
              <ProfileCard expert={expert} onBook={() => setModalOpen(true)} />
              <Accordion items={accordionItems} />
            </aside>

            {/* RIGHT: hero + what you'll get + testimonials (trust early) */}
            <div className="flex flex-col gap-10 md:gap-12 min-w-0">
              <HeroIntro expert={expert} onBook={() => setModalOpen(true)} />
              <WhatYouGet expert={expert} />
              <Testimonials expert={expert} />
            </div>
          </div>
        </div>

        {/* ── Full-width sections: aligned to page grid, no empty columns ── */}
        <div className="max-w-[1280px] w-full mx-auto px-5 md:px-7">
          <div className="flex flex-col gap-20 md:gap-28 pt-20 md:pt-28 pb-11 md:pb-20">
            <Faq expert={expert} />
          </div>
        </div>

        <FinalCta expert={expert} onBook={() => setModalOpen(true)} />
      </main>
      <Footer />

      <AnimatePresence>
        {modalOpen && (
          <BookSessionModal
            expert={expertForModal}
            selectedPackage={sessionPackage}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── LEFT: Profile card ─────────────────────────────────────────────────── */
function ProfileCard({ expert, onBook }: { expert: Expert; onBook: () => void }) {
  const linkedin = expert.socials.find((s) => s.icon === "linkedin");
  return (
    <div className="border border-black/15 rounded-3xl overflow-hidden bg-white shadow-card">
      <div className={`relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:h-[360px] overflow-hidden ${expert.cardBg ?? DEFAULT_EXPERT_SHADE}`}>
        <Image
          src={expert.image}
          alt={expert.name}
          fill
          sizes="(min-width: 1024px) 400px, 100vw"
          className="object-cover object-top grayscale"
          style={expert.imagePosition ? { objectPosition: expert.imagePosition } : undefined}
        />
      </div>

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            {/* Verified tick is inline so it always trails the last word, even when the name wraps */}
            <h2 className="text-ink text-2xl font-semibold leading-8">
              {expert.name}
              {expert.verified && (
                <Icon
                  icon="material-symbols:verified-rounded"
                  width={20}
                  height={20}
                  className="ml-1 inline-block align-[-3px] text-[#1D9BF0]"
                  aria-label="Verified expert"
                />
              )}
            </h2>
            <p className="text-orange font-medium">{expert.role}</p>
            {/* Location — country flag + city/state, sourced from expert data */}
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-ink/60">
              <Icon icon={COUNTRIES[expert.country].flag} width={16} height={16} className="shrink-0" aria-hidden />
              {expert.location ?? COUNTRIES[expert.country].name}
            </p>
          </div>

          {/* LinkedIn — the single social we surface, aligned to the first line of the name */}
          {linkedin && (
            <a
              href={linkedin.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${expert.name} on LinkedIn`}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-[#0A66C2] transition-colors duration-200 hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/[0.06]"
            >
              <LinkedInIcon />
            </a>
          )}
        </div>

        <p className="text-black/70 leading-relaxed">{expert.bio}</p>

        <BookButton full onClick={onBook} />
      </div>
    </div>
  );
}

/* ─── Supports + Trusted By — side-by-side cards ────────────────────────── */
function Supports({ expert }: { expert: Expert }) {
  const supportAgents = (expert.supports ?? [])
    .map((name) => agents.find((a) => a.name === name))
    .filter((a): a is (typeof agents)[number] => Boolean(a))
    .slice(0, 4);

  const hasSupportAgents = supportAgents.length > 0;
  const hasTrustedBy = !!expert.trustedBy?.length;

  if (!hasSupportAgents && !hasTrustedBy) return null;

  const cardCls = "flex flex-col gap-2.5";
  const labelRowCls = "flex items-center gap-1.5";
  const iconCls = "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange";
  const labelCls = "text-[11px] font-bold uppercase tracking-[0.1em] text-ink-4";

  return (
    <div className={`grid gap-4 sm:gap-5 ${hasSupportAgents && hasTrustedBy ? "grid-cols-1 sm:grid-cols-[auto_1fr]" : "grid-cols-1"}`}>
      {hasSupportAgents && (
        <div className={cardCls}>
          <div className={labelRowCls}>
            <span className={iconCls}>
              <Icon icon="solar:users-group-rounded-bold-duotone" width={13} height={13} aria-hidden />
            </span>
            <span className={labelCls}>Supported AI Agents</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {supportAgents.map((a) => (
              <Link
                key={a.id}
                href={AGENT_PAGE[a.name] ?? "/agents"}
                aria-label={`${a.name} — AI agent`}
                className="group/agent inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 py-1.5 pl-1.5 pr-3 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange/30 hover:shadow-[0_8px_20px_-10px_rgba(255,106,47,0.4)]"
              >
                <span
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/[0.06]"
                  style={{ backgroundColor: `${a.color}1A` }}
                >
                  {a.image ? (
                    <Image src={a.image} alt={a.name} fill draggable={false} sizes="28px" className="object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: a.color }}>{a.initials}</span>
                  )}
                </span>
                <span className="text-[12px] font-bold text-ink transition-colors group-hover/agent:text-orange-deep">
                  <AgentName name={a.name} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasTrustedBy && (
        <div className={`${cardCls} ${hasSupportAgents ? "sm:border-l sm:border-black/[0.08] sm:pl-5" : ""}`}>
          <div className={labelRowCls}>
            <span className={iconCls}>
              <Icon icon="solar:buildings-3-bold-duotone" width={13} height={13} aria-hidden />
            </span>
            <span className={labelCls}>{expert.trustedByLabel ?? "Worked With"}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {expert.trustedBy!.map((org) => (
              <span
                key={org}
                className="whitespace-nowrap rounded-full border border-black/[0.08] bg-white/80 px-3 py-1.5 text-[12px] font-bold text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.10)]"
              >
                {org}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── RIGHT: Hero / intro ────────────────────────────────────────────────── */
function HeroIntro({ expert, onBook }: { expert: Expert; onBook: () => void }) {
  const persona = personas.find((p) => p.id === expert.persona);
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 bg-orange text-white text-sm font-bold px-3.5 py-1.5 rounded-full shadow-[0_4px_14px_-4px_rgba(255,106,47,0.6)]">
          <span className="uppercase tracking-[0.08em]">RQ-Score</span>
          <span className="tabular-nums">{expert.rqScore}</span>
        </span>
        {/* Expertise — the persona/audience this expert serves. Links through
            to that persona's use-case page (from the "Different Ambitions" cards). */}
        {persona && (
          <Link
            href={persona.link}
            aria-label={`Expertise: ${persona.label} — explore the ${persona.label} use case`}
            className="group/exp inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange/[0.14] via-orange/[0.07] to-orange/[0.03] px-2 py-1.5 pr-3 text-sm font-semibold text-orange ring-1 ring-inset ring-orange/25 shadow-[0_6px_18px_-8px_rgba(255,106,47,0.55)] transition-all duration-200 hover:from-orange/[0.2] hover:via-orange/[0.12] hover:to-orange/[0.06] hover:ring-orange/40 hover:shadow-[0_8px_22px_-8px_rgba(255,106,47,0.7)]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange text-white shadow-[0_2px_8px_-2px_rgba(255,106,47,0.8)]">
              <Icon icon="solar:medal-ribbons-star-bold-duotone" width={15} height={15} aria-hidden />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-orange">Expertise</span>
            <span className="h-3.5 w-px bg-orange/30" />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-orange">{persona.label}</span>
            <Icon
              icon="solar:arrow-right-up-linear"
              width={15}
              height={15}
              className="text-orange/70 transition-transform duration-200 group-hover/exp:translate-x-0.5 group-hover/exp:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>

      <h1 className="text-ink text-[32px] font-semibold tracking-[-1px] leading-[1.1] md:text-[46px] md:leading-[1.08] text-balance">
        {expert.headline}
      </h1>

      <ExpandableIntro text={expert.intro} />

      <TagList items={fitBadges(expert.expertise)} />

      {/* Supports + Trusted By — rendered as matching side-by-side cards */}
      <Supports expert={expert} />

      {/* Stat strip — per-expert highlight badges (3–4); wraps cleanly on mobile */}
      <div className="flex flex-wrap gap-2.5">
        {(expert.stats ?? [
          { value: `${expert.yearsExperience}+`, label: "Years Exp." },
          { value: `${compactCount(expert.reviewCount)}+`, label: "Mentored" },
          { value: `${expert.industries.length}+`, label: "Industries" },
        ])
          .slice()
          .sort((a, b) => statMagnitude(a.value) - statMagnitude(b.value))
          .map(({ value, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-orange/[0.09] to-orange/[0.03] ring-1 ring-orange/20 px-4 py-3 shadow-[0_8px_22px_-14px_rgba(255,106,47,0.4)]"
          >
            <span className="text-xl font-bold leading-none text-orange tabular-nums">{value}</span>
            <span className="text-[13px] font-medium leading-none text-ink/55 whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>

      <BookButton onClick={onBook} />
    </section>
  );
}

/* ─── What You'll Get ────────────────────────────────────────────────────── */
const BENEFIT_ICONS: BenefitIcon[] = ["guidance", "career", "insights", "strategy", "problem", "steps"];

function WhatYouGet({ expert }: { expert: Expert }) {
  const items = expert.whatYouGet;
  return (
    <section className="flex flex-col gap-5 md:gap-6">
      <SectionHeader label="The Session" title="What you'll get" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        {items.map((b, i) => (
          <div
            key={b.title}
            className="group flex items-start gap-4 border border-black/10 rounded-2xl p-5 bg-white hover:border-orange/30 hover:shadow-[0_10px_30px_-12px_rgba(255,106,47,0.25)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-center h-12 w-12 shrink-0 rounded-2xl bg-white text-orange ring-1 ring-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:ring-orange/30 group-hover:shadow-[0_5px_16px_-4px_rgba(255,106,47,0.35)]">
              <BenefitGlyph icon={BENEFIT_ICONS[i % BENEFIT_ICONS.length]} />
            </div>
            <div className="flex flex-col gap-1 pt-0.5 min-w-0">
              <h5 className="text-ink text-lg font-semibold leading-tight truncate">{b.title}</h5>
              <p className="text-black/55 text-sm leading-snug line-clamp-2">{b.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────────────
   Premium, adaptive trust block. One testimonial → a single quote card with
   no chrome. Two or more → a crossfading carousel with progress dots + arrows,
   so it scales gracefully from 1 to many without ever feeling like a list.
   ────────────────────────────────────────────────────────────────────────── */
function Testimonials({ expert }: { expert: Expert }) {
  const reviews = expert.reviews;
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance every 5s (crossfade handled by AnimatePresence). Pauses on
  // hover; `idx` in deps restarts the timer after manual navigation.
  useEffect(() => {
    if (reviews.length <= 1 || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % reviews.length), 5000);
    return () => clearInterval(id);
  }, [reviews.length, paused, idx]);

  if (reviews.length === 0) return null;

  const multi = reviews.length > 1;
  const go = (n: number) => setIdx((n + reviews.length) % reviews.length);
  const r = reviews[Math.min(idx, reviews.length - 1)];

  return (
    <section
      className="flex flex-col gap-5 md:gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* compact heading — keeps context without dominating; arrows sit inline */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-orange text-sm font-semibold uppercase tracking-wide">Testimonials</span>
          <h3 className="text-ink text-2xl md:text-3xl font-semibold leading-tight">What clients say</h3>
        </div>
        {multi && (
          <div className="flex items-center gap-2">
            {[
              { dir: -1, label: "Previous testimonial", d: "M15 18l-6-6 6-6" },
              { dir: 1, label: "Next testimonial", d: "M9 18l6-6-6-6" },
            ].map(({ dir, label, d }) => (
              <button
                key={label}
                type="button"
                onClick={() => go(idx + dir)}
                aria-label={label}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 text-ink/70 transition-colors duration-200 hover:border-orange/50 hover:bg-orange/[0.05] hover:text-orange"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.figure
            key={r.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative flex min-h-[260px] sm:min-h-[300px] flex-col overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-orange/[0.07] via-white to-white p-5 sm:p-7 md:min-h-[330px] md:p-9 shadow-[0_20px_55px_-28px_rgba(0,0,0,0.3)]"
          >
            {/* oversized decorative quote mark */}
            <span className="pointer-events-none absolute -top-2 right-5 select-none font-serif text-[120px] leading-none text-orange/10 md:text-[150px]">
              &rdquo;
            </span>

            <Stars rating={r.rating} size={18} />

            <blockquote className="relative mt-5 text-ink text-xl md:text-[22px] font-medium leading-relaxed text-balance">
              &ldquo;{r.text}&rdquo;
            </blockquote>

            <figcaption className="mt-auto flex items-center gap-3.5 pt-7">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-orange/20 to-orange/5 text-orange font-semibold ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)]">
                {r.image ? (
                  <Image
                    alt={r.name}
                    src={r.image}
                    fill
                    sizes="48px"
                    className="object-cover"
                    style={r.imagePosition ? { objectPosition: r.imagePosition } : undefined}
                  />
                ) : (
                  r.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")
                )}
              </div>
              <div className="min-w-0">
                <p className="text-ink font-semibold leading-tight">{r.name}</p>
                <p className="text-black/55 text-sm">{r.role}</p>
              </div>
            </figcaption>
          </motion.figure>
        </AnimatePresence>

        {multi && (
          <div className="mt-5 flex items-center justify-center gap-2">
            {reviews.map((rev, i) => (
              <button
                key={rev.name}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-6 bg-orange" : "w-2 bg-black/15 hover:bg-black/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────────── */
function Faq({ expert }: { expert: Expert }) {
  const items = expert.faq?.length ? expert.faq : sessionFaqs;
  return (
    <section className="flex flex-col gap-10 md:gap-12">
      <SectionHeader label="FAQs" title="Frequently asked questions" />
      <Accordion items={items.map((f) => ({ title: f.q, content: <p>{f.a}</p> }))} />
    </section>
  );
}

/* ─── Final conversion CTA ───────────────────────────────────────────────── */
function FinalCta({ expert, onBook }: { expert: Expert; onBook: () => void }) {
  return (
    <section className="bg-cream">
      <div className="max-w-[1280px] w-full mx-auto px-5 md:px-7">
        <div className="py-16 md:py-24 flex flex-col items-center text-center gap-8">
          <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white shadow-card">
            <Image alt={expert.name} src={expert.image} fill sizes="80px" className="object-cover" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-ink text-3xl font-semibold leading-tight md:text-6xl md:leading-[64px] max-w-3xl">
              Ready to learn from {expert.name.split(" ").find((p) => !["dr.", "mr.", "ms.", "mrs.", "prof."].includes(p.toLowerCase()))}?
            </h2>
            <p className="text-black/60 text-lg leading-relaxed max-w-xl">
              Book a focused 1:1 session and walk away with honest advice, real clarity, and a concrete plan for your next step.
            </p>
          </div>
          <BookButton className="text-lg" onClick={onBook} />
        </div>
      </div>
    </section>
  );
}
