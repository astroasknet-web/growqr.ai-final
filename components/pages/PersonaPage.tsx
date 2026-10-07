"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { agents, type Agent } from "@/lib/data";
import { AGENT_PAGE } from "@/lib/agentMedia";
import { personas } from "@/lib/personas";
import type { PersonaPageContent } from "@/lib/persona-content";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SquadCard from "@/components/home/SquadCard";
import AgentSheet from "@/components/agents/directory/AgentSheet";
import Reveal from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/home/SectionHeader";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { withAgentMarks } from "@/components/ui/AgentName";
import { trackAppCta } from "@/lib/analytics";

const ease = [0.22, 1, 0.36, 1] as const;

const ORANGE_DEEP = "#9C3A11";

// Organisation personas get a sales-led "Set up a call" CTA instead of the
// self-serve Pricing tier block. Individual personas keep Pricing — and are
// the only ones whose CTAs swap to the waitlist for USD visitors.
const ORG_PERSONAS = new Set([
  "startups",
  "recruiters",
  "enterprises",
  "institutes",
]);

/**
 * Long-form persona sub-page.
 *
 * Seven sections: Hero · Pain/Ambition flip · Your Squad · How It Works
 * · Pricing · Related personas · Footer. All copy + imagery
 * flows from the `content` prop so every persona reuses the same shell.
 */
export default function PersonaPage({
  content,
}: {
  content: PersonaPageContent;
}) {
  const isOrg = ORG_PERSONAS.has(content.id);

  return (
    <>
      <Navbar />
      <main>
        <Hero content={content} />
        <PainAmbitionFlip content={content} />
        <YourSquad content={content} />
        <HowItWorks content={content} />
        {(content.id === "students" || content.id === "institutes") && (
          <AmbassadorBanner persona={content.id} />
        )}
        {isOrg ? <CallCTA content={content} /> : <Pricing content={content} />}
        <RelatedPersonas content={content} />
      </main>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 — HERO
   ═══════════════════════════════════════════════════════════════════════════ */
function Hero({ content }: { content: PersonaPageContent }) {
  const { hero } = content;
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — swap the primary CTA to a waitlist
  // signup for individual (non-org) personas viewed by USD visitors.
  const isWaitlist = !ORG_PERSONAS.has(content.id) && !isLive;
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36 lg:pt-40 pb-16 md:pb-24 px-6 md:px-14 bg-cream">
      {/* Ambient right glow */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-orange/[0.05] to-transparent" />
        <div className="absolute right-[8%] top-[15%] w-[380px] h-[380px] rounded-full bg-orange/[0.06] blur-[90px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* LEFT — copy + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          {/* Eyebrow */}
          <Eyebrow center className="lg:justify-start">{hero.eyebrow}</Eyebrow>

          {/* Headline */}
          <h1 className="mt-4 md:mt-5 text-[34px] md:text-[48px] xl:text-[58px] font-medium tracking-[-0.04em] md:tracking-[-0.05em] leading-[1.0] text-[#1a1a1a] whitespace-pre-line">
            <OrangeLastWord text={hero.headline} />
          </h1>

          {/* Subline — was in content but never rendered */}
          <p className="mt-4 md:mt-5 text-[15px] md:text-[17px] text-ink-3 leading-[1.65] max-w-[520px]">
            {hero.subline}
          </p>

          {/* CTA row */}
          <div className="mt-8 md:mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            {isWaitlist ? (
              <button
                type="button"
                onClick={() => {
                  trackAppCta({
                    ctaLabel: "Join the Waitlist",
                    ctaLocation: `${content.id}-hero`,
                    ctaAction: "waitlist",
                  });
                  openWaitlist(`${content.id}-hero`);
                }}
                className="group inline-flex items-center gap-3 bg-orange text-white text-[15px] md:text-[16px] font-semibold pl-6 pr-5 py-3 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)]"
              >
                Join the Waitlist
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-[13px] transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            ) : (
              <a
                href={hero.primaryCTA.href}
                className="group inline-flex items-center gap-3 bg-orange text-white text-[15px] md:text-[16px] font-semibold pl-6 pr-5 py-3 rounded-full transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)]"
              >
                {hero.primaryCTA.label}
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-[13px] transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            )}
          </div>


        </motion.div>

        {/* RIGHT — portrait with scanning brackets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease }}
          className="relative mx-auto w-full max-w-[340px] lg:max-w-[440px]"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[6px] bg-cream-2 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.18)]">
            <Image
              src={hero.portrait}
              alt={hero.portraitAlt}
              fill
              sizes="(max-width: 1024px) 80vw, 46vw"
              className="object-cover"
              style={{ objectPosition: "center 20%" }}
              priority
            />
            {/* Subtle bottom fade to blend into page bg */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-cream/60 to-transparent pointer-events-none" />
          </div>
          <ScanBrackets />
        </motion.div>

      </div>
    </section>
  );
}

/** Four orange L-brackets around a container — the brand's scanning-frame
 *  motif, reused here to ground the hero portrait. */
function ScanBrackets() {
  const common = "absolute w-7 h-7 border-orange pointer-events-none";
  return (
    <div aria-hidden>
      <span className={`${common} top-0 left-0 border-t-2 border-l-2`} />
      <span className={`${common} top-0 right-0 border-t-2 border-r-2`} />
      <span className={`${common} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${common} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 — PAIN → AMBITION FLIP
   ═══════════════════════════════════════════════════════════════════════════ */
export function PainAmbitionFlip({ content }: { content: PersonaPageContent }) {
  const { stuck, moving } = content.painAmbition;
  return (
    <section className="relative py-16 md:py-20 px-6 md:px-14 border-y border-black/5 bg-white">
      {content.id === "professionals" && (
        <div className="mx-auto max-w-[1440px] mb-12 md:mb-16 text-center">
          <Reveal direction="left" offset={60}>
            <h2 className="text-[22px] md:text-[30px] font-bold tracking-[-0.02em] leading-[1.2] text-ink">
              From Job Hunting to Opportunity Engineering.
            </h2>
            <p className="mt-3 text-[16px] md:text-[18px] font-semibold text-orange">
              Stop Applying. Start Positioning.
            </p>
          </Reveal>
        </div>
      )}
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-12">
        {/* Stuck */}
        <div className="flex flex-col">
          <Reveal direction="left" offset={60}>
            <Eyebrow muted>{stuck.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-[22px] md:text-[28px] font-bold leading-[1.25] text-[#6B7280]">
              {stuck.headline}
            </h2>
          </Reveal>
          <ul className="mt-5 space-y-2.5">
            {stuck.bullets.map((b) => (
              <li
                key={b}
                className="flex gap-2.5 text-[15px] md:text-[16px] text-[#6B7280] leading-[1.6]"
              >
                <span className="text-ink-5">·</span>
                <span>{withAgentMarks(b)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider — vertical on desktop, horizontal on mobile */}
        <div
          aria-hidden
          className="hidden md:block w-px self-stretch bg-gradient-to-b from-transparent via-orange/30 to-transparent"
        />
        <div
          aria-hidden
          className="md:hidden h-px w-full bg-gradient-to-r from-transparent via-orange/30 to-transparent"
        />

        {/* Moving */}
        <div className="flex flex-col">
          <Reveal direction="left" offset={60}>
            <Eyebrow>{moving.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-[22px] md:text-[28px] font-bold leading-[1.25] text-[#333333]">
              {moving.headline}
            </h2>
          </Reveal>
          <ul className="mt-5 space-y-2.5">
            {moving.bullets.map((b) => (
              <li
                key={b}
                className="flex gap-2.5 text-[15px] md:text-[16px] text-[#333333] leading-[1.6]"
              >
                <span className="text-orange font-semibold">·</span>
                <span>{withAgentMarks(b)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 — YOUR SQUAD
   ═══════════════════════════════════════════════════════════════════════════ */
export function YourSquad({ content }: { content: PersonaPageContent }) {
  const { squad } = content;
  const byName = Object.fromEntries(agents.map((a) => [a.name, a]));
  const selected = squad.agentNames
    .map((name) => byName[name])
    .filter(Boolean);

  const router = useRouter();
  // Agents with a dedicated landing page route there; everyone else opens the
  // shared slide-up preview sheet — same pattern as the homepage squad rail.
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const openAgent = (agent: Agent) => {
    const page = AGENT_PAGE[agent.name];
    if (page) {
      router.push(page);
      return;
    }
    setActiveAgent(agent);
  };

  // Warm the dedicated agent routes so a card click navigates near-instantly.
  useEffect(() => {
    selected.forEach((agent) => {
      const page = AGENT_PAGE[agent.name];
      if (page) router.prefetch(page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, squad.agentNames.join(",")]);

  const railRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDraggedRef = useRef(false);

  const onRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;

    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = rail.scrollLeft;
    rail.style.cursor = "grabbing";

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - dragStartX.current;
      if (Math.abs(delta) > 4) hasDraggedRef.current = true;
      rail.scrollLeft = dragScrollLeft.current - delta;
    };

    const onUp = () => {
      isDraggingRef.current = false;
      rail.style.cursor = "grab";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onRailClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  const scrollRailBy = (delta: number) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="relative py-20 md:py-24 px-6 md:px-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10 md:mb-12">
          <div className="max-w-[640px]">
            <Reveal direction="left" offset={60}>
              <Eyebrow>{squad.eyebrow}</Eyebrow>
              <h2 className="mt-3 text-[32px] md:text-[40px] font-medium tracking-[-0.03em] md:tracking-[-0.04em] leading-[1.02] text-[#333333]">
                <OrangeLastWord text={squad.headline} />
              </h2>
              <p className="mt-3 text-[16px] md:text-[17px] text-ink-3 leading-[1.5]">
                {squad.subline}
              </p>
            </Reveal>
          </div>

          {/* Navigation Controls */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              aria-label="Scroll cards left"
              onClick={() => scrollRailBy(-344)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-ink-3 shadow-sm transition-all hover:bg-orange/10 hover:border-orange/30 hover:text-orange focus-visible:ring-2 focus-visible:ring-orange/40"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Scroll cards right"
              onClick={() => scrollRailBy(344)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-ink-3 shadow-sm transition-all hover:bg-orange/10 hover:border-orange/30 hover:text-orange focus-visible:ring-2 focus-visible:ring-orange/40"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          className="rail flex overflow-x-auto select-none pb-6 -mx-6 px-6 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ cursor: "grab" }}
          onMouseDown={onRailMouseDown}
          onClickCapture={onRailClickCapture}
        >
          <div className="flex gap-4 md:gap-6">
            {selected.map((agent, i) => (
              <motion.div
                key={agent.id}
                className="w-[280px] sm:w-[320px] flex-shrink-0"
              >
                <SquadCard
                  agent={agent}
                  variant="directory"
                  priority={i < 3}
                  onOpen={() => openAgent(agent)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <AgentSheet agent={activeAgent} onClose={() => setActiveAgent(null)} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 — HOW IT WORKS
   ═══════════════════════════════════════════════════════════════════════════ */
export function HowItWorks({ content }: { content: PersonaPageContent }) {
  const { howItWorks } = content;
  // Steps come straight from each persona's journey, which runs 4 or 5 agents
  // long — so the grid adapts instead of silently dropping a step.
  const lgCols = howItWorks.steps.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";
  return (
    <section className="relative py-20 md:py-24 px-6 md:px-14 bg-white border-y border-black/5">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-[640px] mb-10 md:mb-14">
          <Reveal direction="left" offset={60}>
            <Eyebrow>{howItWorks.eyebrow}</Eyebrow>
            <h2 className="mt-3 text-balance text-[32px] md:text-[40px] font-medium tracking-[-0.03em] md:tracking-[-0.04em] leading-[1.02] text-[#333333]">
              <OrangeLastWord text={howItWorks.headline} />
            </h2>
            <p className="mt-3 text-[16px] md:text-[17px] text-ink-3 leading-[1.5]">
              {howItWorks.subline}
            </p>
          </Reveal>
        </div>

        {/* Dashed connector behind the step cards on desktop */}
        <div className={`relative grid grid-cols-1 md:grid-cols-2 ${lgCols} gap-5 lg:gap-6`}>
          <div
            aria-hidden
            className="hidden lg:block absolute top-[42px] left-[10%] right-[10%] border-t border-dashed border-orange/40"
          />
          {howItWorks.steps.map((step, i) => (
            <motion.article
              key={step.number}
              className="relative flex flex-col gap-3 bg-white rounded-[12px] border border-black/[0.08] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              {/* Number badge with 4 scanning brackets */}
              <div className="relative w-fit">
                <span className="inline-flex items-center justify-center h-7 min-w-[44px] px-2 rounded-[6px] bg-orange text-white text-[13px] font-bold tracking-[0.02em]">
                  {step.number}
                </span>
                <BadgeBrackets />
              </div>

              <h3 className="text-[20px] font-bold leading-[1.25] text-[#333333] mt-1">
                {withAgentMarks(step.title)}
              </h3>
              <p
                className="text-[14px] font-medium leading-[1.4]"
                style={{ color: ORANGE_DEEP }}
              >
                {withAgentMarks(step.subtitle)}
              </p>
              {step.description && (
                <p className="text-[14px] font-normal text-ink-3 leading-[1.5]">
                  {withAgentMarks(step.description)}
                </p>
              )}
              {step.duration && (
                <p className="mt-auto pt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-4">
                  {withAgentMarks(step.duration)}
                </p>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BadgeBrackets() {
  const base = "absolute w-2.5 h-2.5 border-orange pointer-events-none";
  return (
    <span aria-hidden>
      <span className={`${base} -top-1 -left-1 border-t border-l rounded-tl-[2px]`} />
      <span className={`${base} -top-1 -right-1 border-t border-r rounded-tr-[2px]`} />
      <span className={`${base} -bottom-1 -left-1 border-b border-l rounded-bl-[2px]`} />
      <span className={`${base} -bottom-1 -right-1 border-b border-r rounded-br-[2px]`} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 — PRICING
   ═══════════════════════════════════════════════════════════════════════════ */
function Pricing({ content }: { content: PersonaPageContent }) {
  const { pricing } = content;
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — this component only renders for
  // individual (non-org) personas, so no isOrg guard is needed here.
  const isWaitlist = !isLive;
  return (
    <section id="pricing" className="relative py-20 md:py-24 px-6 md:px-14 bg-white border-y border-black/5">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-[720px] mb-10 md:mb-14">
          <Reveal direction="left" offset={60}>
            <Eyebrow>{pricing.eyebrow}</Eyebrow>
            <h2 className="mt-3 text-[32px] md:text-[40px] font-medium tracking-[-0.03em] md:tracking-[-0.04em] leading-[1.02] text-[#333333]">
              <OrangeLastWord text={pricing.headline} />
            </h2>
            <p className="mt-3 text-[16px] md:text-[17px] text-ink-3 leading-[1.5]">
              {pricing.subline}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-start">
          {pricing.tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative flex flex-col gap-4 p-7 rounded-[12px] bg-white border transition-shadow ${
                tier.featured
                  ? "border-orange/45 shadow-[0_18px_42px_-16px_rgba(255,106,47,0.3)] lg:-translate-y-2"
                  : "border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              }`}
            >
              {tier.featured && (
                <span
                  className="absolute -top-3 right-5 inline-flex items-center px-3 py-1 rounded-full bg-orange text-white text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ boxShadow: "0 8px 18px -10px rgba(255,106,47,0.55)" }}
                >
                  Most popular
                </span>
              )}

              <p
                className="text-[12px] font-bold uppercase tracking-[0.1em]"
                style={{ color: ORANGE_DEEP }}
              >
                {tier.name}
              </p>
              <p className="text-[22px] font-bold text-[#333333] leading-[1.2]">
                {tier.price}
              </p>
              <p className="text-[14px] text-ink-3 leading-[1.5]">
                {tier.subtitle}
              </p>

              <ul className="flex flex-col gap-2 mt-2">
                {tier.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex gap-2 text-[14px] text-[#333333] leading-[1.5]"
                  >
                    <span className="text-orange flex-shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={
                  isWaitlist
                    ? () => {
                        trackAppCta({
                          ctaLabel: "Join the Waitlist",
                          ctaLocation: `${content.id}-pricing`,
                          ctaAction: "waitlist",
                        });
                        openWaitlist(`${content.id}-pricing`);
                      }
                    : () => {
                        trackAppCta({
                          ctaLabel: tier.cta.label,
                          ctaLocation: `${content.id}-pricing`,
                          destinationUrl: tier.cta.href,
                        });
                        window.location.href = tier.cta.href;
                      }
                }
                className={`mt-5 inline-flex items-center justify-center gap-2 text-[14px] font-semibold py-3 rounded-full transition-all ${
                  tier.featured
                    ? "bg-orange text-white hover:bg-orange-dark"
                    : "bg-white border border-black/15 text-ink-2 hover:bg-black/[0.03] hover:border-black/30"
                }`}
              >
                {isWaitlist ? "Join the Waitlist" : tier.cta.label}
                <span>→</span>
              </button>
            </article>
          ))}
        </div>

        {/* Anchor target for pricing CTAs. */}
        <div id="notify" className="mt-2 h-px" aria-hidden />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   6b — SET UP A CALL  (organisation personas — replaces Pricing)
   ═══════════════════════════════════════════════════════════════════════════ */
export function CallCTA({ content }: { content: PersonaPageContent }) {
  // On solution pages wrapped in EnterpriseContactProvider, open the shared
  // enquiry modal instead of navigating away. Falls back to a plain /contact
  // link on pages without a provider (e.g. Institutes via generic PersonaPage).
  const contact = useEnterpriseContact();

  // Per-persona lead line — keeps the copy specific to what the buyer
  // actually wants to see on the call instead of a generic pitch.
  const leadline: Record<string, string> = {
    startups:
      "Book a 15-minute call. We'll walk through how the squad sources, screens, and onboards your first hires. Mapped to your stage and stack.",
    recruiters:
      "Book a 15-minute call. We'll walk through how the squad turns a brief into a shortlist. On a live role from your desk.",
    enterprises:
      "Book a 15-minute call. We'll walk through how the squad flags flight risk, maps growth paths, and closes skill gaps. On your real team data.",
    institutes:
      "Book a 15-minute call. We'll walk through how the squad gets an entire cohort placement-ready. Mapped to your programme calendar.",
  };

  return (
    <section
      id="pricing"
      className="relative py-20 md:py-24 px-6 md:px-14 bg-white border-y border-black/5"
    >
      <div className="mx-auto max-w-[720px] text-center">
        <Reveal direction="left" offset={60}>
          <Eyebrow center>Set Up a Call</Eyebrow>
          <h2 className="mt-3 text-[32px] md:text-[44px] xl:text-[52px] font-medium leading-[1.02] tracking-[-0.03em] md:tracking-[-0.04em] text-[#333333]">
            Let&apos;s map this to{" "}
            <span className="text-orange">you</span>.
          </h2>
          <p className="mt-5 text-[16px] md:text-[17px] leading-[1.55] max-w-[600px] mx-auto text-ink-3">
            {leadline[content.id] ??
              "Book a 15-minute call. We'll map the squad to your workflow on a live use case from your team."}
          </p>
        </Reveal>
        <div className="mt-10 flex flex-col items-center gap-5">
          {contact.enabled ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({
                  ctaLabel: "Book a call",
                  ctaLocation: `${content.id}-call-cta`,
                  ctaAction: "modal",
                });
                contact.openContact();
              }}
              className="group inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-orange text-white text-[15px] md:text-[16px] font-semibold transition-all duration-300 hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)]"
            >
              Book a call
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-[13px] transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </button>
          ) : (
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-orange text-white text-[15px] md:text-[16px] font-semibold transition-all duration-300 hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)]"
            >
              Book a call
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white text-[13px] transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 — RELATED PERSONAS
   ═══════════════════════════════════════════════════════════════════════════ */
export function RelatedPersonas({ content }: { content: PersonaPageContent }) {
  const others = personas.filter((p) => p.id !== content.id);
  const railRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDraggedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const shouldAutoMove = others.length > 4;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !shouldAutoMove || prefersReducedMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId = 0;
    const speed = 0.45;

    const tick = () => {
      if (!isDraggingRef.current) {
        const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
        if (maxScrollLeft > 0) {
          rail.scrollLeft += speed;
          if (rail.scrollLeft >= maxScrollLeft - 1) {
            rail.scrollLeft = 0;
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, shouldAutoMove]);

  const onRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!shouldAutoMove) return;
    const rail = railRef.current;
    if (!rail) return;

    e.preventDefault();
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartX.current = e.clientX;
    dragScrollLeft.current = rail.scrollLeft;
    rail.style.cursor = "grabbing";

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - dragStartX.current;
      if (Math.abs(delta) > 4) hasDraggedRef.current = true;
      rail.scrollLeft = dragScrollLeft.current - delta;
    };

    const onUp = () => {
      isDraggingRef.current = false;
      rail.style.cursor = "grab";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onRailClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  return (
    <section className="relative py-16 md:py-20 px-6 md:px-14 bg-cream">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 md:mb-10">
          <Reveal direction="left" offset={60}>
            <Eyebrow>{content.related.eyebrow}</Eyebrow>
            <h2 className="mt-3 text-[24px] md:text-[28px] font-medium tracking-[-0.02em] text-[#333333] leading-[1.1]">
              <OrangeLastWord text={content.related.headline} />
            </h2>
          </Reveal>
        </div>

        <div
          ref={railRef}
          className={`overflow-x-auto no-scrollbar pb-2 -mx-1 px-1 ${
            shouldAutoMove ? "select-none" : ""
          }`}
          style={{ cursor: shouldAutoMove ? "grab" : undefined }}
          onMouseDown={onRailMouseDown}
          onClickCapture={onRailClickCapture}
          onTouchStart={() => {
            if (shouldAutoMove) isDraggingRef.current = true;
          }}
          onTouchEnd={() => {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 400);
          }}
        >
          <div className="flex gap-3 md:gap-4 w-max">
            {others.map((p) => (
              <Link
                key={p.id}
                href={p.link}
                className="group relative flex items-center gap-3 flex-shrink-0 w-[260px] md:w-[280px] bg-white rounded-[12px] border border-black/[0.08] p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.1)]"
              >
                <span className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-cream-2">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                    style={{ objectPosition: p.objectPosition ?? "center top" }}
                  />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[13.5px] font-bold text-[#333333] leading-[1.2]">
                    {p.navLabel}
                  </span>
                  <span className="mt-1 text-[12px] text-ink-3 leading-[1.35] line-clamp-2">
                    {p.outcome}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AMBASSADOR BANNER  (students + institutes only)
   ═══════════════════════════════════════════════════════════════════════════ */
export function AmbassadorBanner({ persona }: { persona: "students" | "institutes" }) {
  const copy = {
    students: {
      eyebrow: "For Students Like You",
      headline: "Be a Representative of GrowQR on your campus.",
      sub: "Lead, grow, and get rewarded. The GrowQR Campus Ambassador Program ensures students gain real-world experience while diving into AI-powered careers.",
      perks: ["Swag Kit & Merch", "Monetary Rewards", "Internship Fast-Track", "Certificate + LoR", "Exclusive Events"],
    },
    institutes: {
      eyebrow: "For Your Students",
      headline: "Bring GrowQR to your campus.",
      sub: "Position your institution at the forefront of AI-driven career readiness. The Campus Ambassador Program fosters student leadership, strengthens industry engagement, and cultivates future-ready talent through a national network of ambitious student leaders.",
      perks: ["Campus Recognition", "Student Leadership", "AI Career Tools", "National Network", "Placement Edge"],
    },
  }[persona];

  return (
    <section className="relative py-16 md:py-20 px-6 md:px-14 bg-white border-y border-black/5 overflow-hidden">
      <div className="mx-auto max-w-[1440px]">
        <Reveal direction="up" offset={24}>
          <div className="relative rounded-2xl overflow-hidden bg-white border border-black/[0.08] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]">

            {/* Subtle orange tint — top-left */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 45% 80% at 0% 40%, rgba(255,106,47,0.06), transparent 60%)" }}
            />

            {/* Dot pattern — right side */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 h-full w-[340px] opacity-[0.35]"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            {/* Scan brackets */}
            <span aria-hidden className="absolute top-5 right-5 w-8 h-8 border-t-2 border-r-2 border-orange/30 rounded-tr-[4px]" />
            <span aria-hidden className="absolute bottom-5 right-5 w-8 h-8 border-b-2 border-r-2 border-orange/30 rounded-br-[4px]" />

            <div className="relative z-10 grid lg:grid-cols-[1fr_300px] lg:items-center gap-8 lg:gap-14 px-8 md:px-12 lg:px-16 py-10 md:py-12 lg:py-14">

              {/* LEFT — badge + headline + sub */}
              <div className="flex flex-col gap-4">

                {/* Badge */}
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-orange to-[#ff8c55] px-4 py-2 shadow-[0_4px_16px_rgba(255,106,47,0.32)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                    GrowQR AI Global Campus Program
                  </span>
                </div>

                <h2 className="text-[28px] md:text-[38px] lg:text-[46px] font-semibold tracking-[-0.04em] text-[#1a1a1a] leading-[1.08]">
                  {copy.headline}
                </h2>
                <p className="text-[14px] md:text-[15px] text-ink-3 leading-relaxed max-w-[560px]">
                  {copy.sub}
                </p>

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <Link
                    href="/ambassadors"
                    className="group inline-flex items-center gap-2.5 rounded-full bg-orange px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-8px_rgba(255,106,47,0.45)]"
                  >
                    Explore the Program
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[11px] transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                </div>

              </div>

              {/* RIGHT — Program Benefits */}
              <div className="flex flex-col gap-2">
                {copy.perks.map((perk) => (
                  <span
                    key={perk}
                    className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.03] px-3.5 py-2 text-[12px] font-medium text-ink-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
                    {perk}
                  </span>
                ))}
              </div>

            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────── Shared bits ───────────────────────────── */

/**
 * Accent the last word of a headline with `text-orange`. Matches the
 * home-page convention of exactly one orange word per heading. Trailing
 * punctuation (".", "!", "?") stays outside the span so the colour never
 * bleeds onto punctuation. */
function OrangeLastWord({ text }: { text: string }) {
  // Split trailing punctuation off
  const match = text.match(/^(.*?)([.!?]?)$/);
  const body = match?.[1] ?? text;
  const punct = match?.[2] ?? "";
  const words = body.trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return (
    <>
      {words.join(" ")}
      {" "}
      <span className="text-orange">{last}</span>
      {punct}
    </>
  );
}
