"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { agents, type Agent } from "@/lib/data";
import { AGENT_PAGE, AGENT_PAGE_ENTERPRISE } from "@/lib/agentMedia";
import { AgentName } from "@/components/ui/AgentName";
import { Eyebrow } from "@/components/home/SectionHeader";
import SquadCard from "@/components/home/SquadCard";
import AgentSheet from "@/components/agents/directory/AgentSheet";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { trackAppCta } from "@/lib/analytics";

/* ═══════════════════════════════════════════════════════════════════════════
   Shared building blocks for solution pages (startup, enterprise, ...):
   a zigzag agent journey + a "Your AI Team" rail. Content is passed in so each
   solution page just supplies its own steps, agents, and copy.
   ═══════════════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const;

const textVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const byName = Object.fromEntries(agents.map((a) => [a.name, a]));
export const roleLabel = (r: string) => r.replace(/^The\s+/, "");

/** On B2B solution pages, some agents have a dedicated enterprise page that
 *  should be linked instead of the seeker one (e.g. Nova's enterprise Brand
 *  Builder vs. the individual /ai-brand-builder). Pass this to SolutionSquad.
 *  Sourced from `lib/agentMedia` — the single place that maps an agent to its
 *  enterprise page — so a newly added enterprise page shows up here too. */
export const B2B_AGENT_LINKS = AGENT_PAGE_ENTERPRISE;

/** hex -> rgba, so one brand color drives the soft panel tint + accents. */
export const tint = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/** Soft brand-tinted panel wrapping a clean white card, led by the agent's
 *  portrait (BFP) so every visual reads as "this agent, here". */
export function Panel({ agent, children }: { agent: string; children: ReactNode }) {
  const a = byName[agent];
  const color = a?.color ?? "#FF6A2F";
  return (
    <div
      className="relative rounded-[28px] p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] sm:p-6 md:p-7"
      style={{
        background: `linear-gradient(135deg, ${tint(color, 0.16)} 0%, #FBF7F1 58%, ${tint(color, 0.1)} 100%)`,
      }}
    >
      <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_-16px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] sm:p-6">
        <div className="flex items-center gap-4">
          <span
            className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-black/[0.06] md:h-[76px] md:w-[76px]"
            style={{ backgroundColor: tint(color, 0.12) }}
          >
            {a?.image && (
              <Image src={a.image} alt={a.name} fill sizes="76px" className="object-cover object-top" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[16px] font-bold tracking-[-0.01em] text-ink">
              <AgentName name={agent} />
            </p>
            <p className="text-[12.5px] font-semibold text-ink-4">{a ? roleLabel(a.role) : ""}</p>
          </div>
        </div>
        <div className="mt-5 border-t border-black/[0.06] pt-5">{children}</div>
      </div>
    </div>
  );
}

/** Small status pill — green reserved for positive/complete states. */
export function Pill({ tone, children }: { tone: "green" | "amber" | "neutral"; children: ReactNode }) {
  const styles = {
    green: "bg-[#16A34A]/12 text-[#16A34A] ring-1 ring-[#16A34A]/25",
    amber: "bg-[#D97706]/12 text-[#D97706] ring-1 ring-[#D97706]/25",
    neutral: "bg-black/[0.04] text-ink-3 ring-1 ring-black/[0.06]",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${styles}`}>
      {children}
    </span>
  );
}

export type JourneyStep = {
  key: string;
  stage: string;
  agent: string;
  role: string;
  heading: string;
  copy: string;
  visual: ReactNode;
  /** true -> visual sits on the LEFT, content on the RIGHT. */
  reverse: boolean;
};

function JourneyRow({ step }: { step: JourneyStep }) {
  const reduce = useReducedMotion();
  return (
    <div className="bg-white">
      <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-6 py-14 md:px-14 md:py-20 lg:grid-cols-2 lg:gap-16">
        {/* TEXT */}
        <motion.div
          variants={reduce ? undefined : textVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-100px" }}
          className={`lg:max-w-[540px] ${step.reverse ? "lg:order-2 lg:ml-auto" : "lg:order-1"}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold uppercase tracking-[0.14em] text-orange-deep">
              {step.stage}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[14px] font-semibold text-ink-3">
            <AgentName name={step.agent} className="text-ink" />
            <span aria-hidden className="text-ink-5">
              ·
            </span>
            <span>{step.role}</span>
          </div>

          <h3 className="mt-3 text-[26px] font-bold leading-[1.08] tracking-[-0.03em] text-ink [text-wrap:balance] sm:text-[32px] md:text-[40px]">
            {step.heading}
          </h3>
          <p className="mt-4 max-w-[460px] text-[16px] leading-[1.7] text-ink-2 [text-wrap:pretty] md:text-[17px]">
            {step.copy}
          </p>
        </motion.div>

        {/* VISUAL */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className={`mx-auto w-full max-w-[440px] lg:max-w-none ${step.reverse ? "lg:order-1" : "lg:order-2"}`}
        >
          {step.visual}
        </motion.div>
      </div>
    </div>
  );
}

/** The full journey section: centered header + alternating zigzag rows, closed
 *  by a CTA — either the shared enquiry modal (B2B pages) or a plain signup
 *  link (self-serve pages, via `ctaHref`). */
export function SolutionJourney({
  eyebrow,
  heading,
  steps,
  ariaLabel,
  ctaLabel = "Book a Call",
  ctaHref,
}: {
  eyebrow: string;
  heading: ReactNode;
  steps: JourneyStep[];
  ariaLabel: string;
  /** Label for the closing CTA. */
  ctaLabel?: string;
  /** Self-serve pages pass a signup URL here to skip the contact modal. */
  ctaHref?: string;
}) {
  const contact = useEnterpriseContact();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — self-serve pages swap their closing
  // CTA to a waitlist signup (label included) for USD visitors.
  const isWaitlist = !!ctaHref && !contact.enabled && !isLive;
  const showModalCta = !ctaHref && contact.enabled;
  return (
    <section aria-label={ariaLabel}>
      <div className="bg-white px-6 pb-4 pt-16 text-center md:px-14 md:pt-24">
        <Eyebrow center>{eyebrow}</Eyebrow>
        <h2 className="mt-3 text-[30px] font-medium leading-[1.05] tracking-[-0.03em] text-[#1a1a1a] md:text-[42px] md:tracking-[-0.04em]">
          {heading}
        </h2>
      </div>
      {steps.map((step) => (
        <JourneyRow key={step.key} step={step} />
      ))}
      {(ctaHref || showModalCta) && (
        <div className="bg-white px-6 pb-16 text-center md:px-14 md:pb-24">
          {isWaitlist ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({
                  ctaLabel: "Join the Waitlist",
                  ctaLocation: "journey-cta",
                  ctaAction: "waitlist",
                });
                openWaitlist("journey-cta");
              }}
              className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
            >
              Join the Waitlist
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </span>
            </button>
          ) : ctaHref ? (
            <a
              href={ctaHref}
              className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
            >
              {ctaLabel}
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackAppCta({ ctaLabel, ctaLocation: "journey-cta", ctaAction: "modal" });
                contact.openContact();
              }}
              className="group inline-flex items-center gap-3 rounded-full bg-orange py-3 pl-6 pr-5 text-[15px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] md:text-[16px]"
            >
              {ctaLabel}
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Your AI Team — single-row rail of agent cards (drag to scroll).
   ═══════════════════════════════════════════════════════════════════════════ */
export function SolutionSquad({
  eyebrow,
  heading,
  subheading,
  agentNames,
  linkOverrides = {},
}: {
  eyebrow: string;
  heading: ReactNode;
  subheading: string;
  agentNames: string[];
  /** Agent name -> href, taking precedence over AGENT_PAGE (e.g. B2B_AGENT_LINKS). */
  linkOverrides?: Record<string, string>;
}) {
  const router = useRouter();
  const cards = agentNames.map((n) => byName[n]).filter(Boolean) as Agent[];
  const hrefFor = (name: string) => linkOverrides[name] ?? AGENT_PAGE[name];

  // Agents without a dedicated page (e.g. Atlas, Drape) open the same
  // slide-up preview sheet the homepage falls back to, instead of a dead
  // click — every card does something.
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  useEffect(() => {
    agentNames.forEach((n) => {
      const href = hrefFor(n);
      if (href) router.prefetch(href);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, agentNames]);

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

  return (
    <section className="bg-gradient-to-b from-cream-2 to-cream-3 px-6 py-20 md:px-14 md:py-24">
      <div className="mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[640px] text-center">
          <Eyebrow center>{eyebrow}</Eyebrow>
          <h2 className="mt-3 text-[30px] font-medium leading-[1.05] tracking-[-0.03em] text-[#1a1a1a] md:text-[42px] md:tracking-[-0.04em]">
            {heading}
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-ink-3 md:text-[17px]">{subheading}</p>
        </div>

        {/* Single-row rail — drag or swipe to scroll horizontally. */}
        <div
          ref={railRef}
          onMouseDown={onRailMouseDown}
          onClickCapture={onRailClickCapture}
          style={{ cursor: "grab" }}
          className="-mx-6 mt-10 flex select-none gap-4 overflow-x-auto px-6 pb-2 md:-mx-14 md:mt-12 md:gap-6 md:px-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {cards.map((agent, i) => {
            const href = hrefFor(agent.name);
            return (
              <div key={agent.id} className="w-[248px] flex-shrink-0 sm:w-[272px]">
                <SquadCard
                  agent={agent}
                  variant="directory"
                  priority={i < 5}
                  onOpen={() => (href ? router.push(href) : setActiveAgent(agent))}
                />
              </div>
            );
          })}
        </div>
      </div>

      <AgentSheet agent={activeAgent} onClose={() => setActiveAgent(null)} />
    </section>
  );
}
