"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { agents, type Agent } from "@/lib/data";
import {
  FEATURED_AGENT_IDS,
  AGENT_PAGE,
  AGENT_PAGE_ENTERPRISE,
  isActiveBusinessAgent,
} from "@/lib/agentMedia";
import { Eyebrow, SectionHeading } from "./SectionHeader";
import Reveal from "@/components/ui/Reveal";
import SquadCard from "./SquadCard";
import AgentSheet from "@/components/agents/directory/AgentSheet";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import { useHomeMode } from "@/components/layout/HomeMode";

/** Buffer (px) from the rail edges that triggers auto-scroll on hover.
 *  If the hovered card is within this many px of either edge, the rail
 *  nudges along so the next card starts coming into view. */
const EDGE_BUFFER = 96;

/** How long after the section enters the viewport before auto-scroll is
 *  allowed to fire. Covers the staggered card check-in (duration 0.5s +
 *  6 × 0.06s stagger ≈ 0.86s) with a small buffer so hover-scroll never
 *  fights the entrance animation. */
const READY_DELAY_MS = 500;

export default function Squad() {
  const router = useRouter();
  const railRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const hasDraggedRef = useRef(false);

  // Modal state — clicking a card opens the agent preview.
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // The rail follows the Hero's Individual/Enterprise toggle: Individual shows
  // the 7 featured job-seeker agents (curated order, matching the navbar);
  // Enterprise shows the enterprise roster — the 6 dedicated enterprise
  // agents PLUS any individual-side agent that also has an enterprise page
  // (AGENT_PAGE_ENTERPRISE, e.g. Nova/Scout/Vera's B2B SaaS pages). That map
  // is the single source of truth, so a newly added enterprise page shows up
  // here with no further changes to this component.
  const { mode } = useHomeMode();
  const individualAgents = agents.filter((a) => a.type === "individual");
  const featuredIndividual = FEATURED_AGENT_IDS
    .map((id) => individualAgents.find((a) => a.id === id))
    .filter((a): a is Agent => Boolean(a));
  const enterpriseAgents = agents.filter(isActiveBusinessAgent);
  const visibleAgents =
    mode === "enterprise" ? enterpriseAgents : featuredIndividual;

  // Agents with a dedicated landing page route there — in Business mode,
  // dual-purpose agents (Nova/Scout/Vera) route to their enterprise page
  // instead of the seeker one. Everyone else opens the shared slide-up
  // panel. The route is prefetched on hover (see prefetchAgent) so the push
  // navigates straight into the page's skeleton (loading.tsx) — no in-card
  // spinner needed.
  const pageFor = (agent: Agent) =>
    mode === "enterprise"
      ? AGENT_PAGE_ENTERPRISE[agent.name] ?? AGENT_PAGE[agent.name]
      : AGENT_PAGE[agent.name];

  const openAgent = (agent: Agent) => {
    const page = pageFor(agent);
    if (page) {
      router.push(page);
      return;
    }
    setActiveAgent(agent);
  };
  // Render the set twice so the auto-roll can wrap by exactly one set's
  // width — the duplicate keeps the viewport full, so the reset is invisible.
  const loopAgents = [...visibleAgents, ...visibleAgents];

  // Refs on the first card of each copy let us measure one full set's width
  // (incl. gap) at runtime, regardless of responsive sizes / padding.
  const firstItemRef = useRef<HTMLDivElement | null>(null);
  const secondHalfRef = useRef<HTMLDivElement | null>(null);

  // Only consider the section "in view" once — the check-in animation
  // is a one-shot. After that, we start the ready timer.
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });
  const [isReady, setIsReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    const id = window.setTimeout(() => setIsReady(true), READY_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [inView]);

  // Warm the dedicated agent routes (Vera/Mira/Nova) so a card click navigates
  // near-instantly instead of spinning while Next fetches the route on click.
  // Prefetch on hover for immediate intent; also prefetch the whole visible set
  // once the section settles, which covers touch and fast clicks (no hover).
  const prefetchedRef = useRef<Set<string>>(new Set());
  const prefetchAgent = (agent: Agent) => {
    const page = pageFor(agent);
    if (page && !prefetchedRef.current.has(page)) {
      prefetchedRef.current.add(page);
      router.prefetch(page);
    }
  };
  useEffect(() => {
    if (!isReady) return;
    visibleAgents.forEach(prefetchAgent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, mode]);

  /** Auto-roll — keeps the squad rail moving slowly on its own so the
   *  cards feel alive. Pauses while the user hovers the rail and respects
   *  reduced-motion preferences. The roster is rendered twice; once the
   *  scroll passes one full set's width we subtract that width, so the
   *  duplicate slides seamlessly into place with no visible reset. */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !isReady || prefersReducedMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId = 0;
    const speed = 0.5;

    // One set's width = the left-edge gap between the two copies. We use
    // getBoundingClientRect (not offsetLeft — HoverEffect makes each card's
    // wrapper the offsetParent) and cache it, since the delta is invariant
    // to scroll position. Recompute on resize when card sizes change.
    let setWidth = 0;
    const measure = () => {
      const first = firstItemRef.current;
      const second = secondHalfRef.current;
      if (first && second) {
        setWidth =
          second.getBoundingClientRect().left - first.getBoundingClientRect().left;
      }
    };
    // Switching mode swaps the roster (and its total width), so restart the
    // rail from the left and re-measure for the new set.
    rail.scrollLeft = 0;
    measure();
    window.addEventListener("resize", measure);

    const tick = () => {
      if (!isHoveringRef.current && setWidth > 0) {
        rail.scrollLeft += speed;
        if (rail.scrollLeft >= setWidth) {
          rail.scrollLeft -= setWidth;
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measure);
    };
  }, [isReady, prefersReducedMotion, mode]);

  /** When the user hovers a card near the right (or left) edge of the rail,
   *  smoothly scroll so more cards are revealed in that direction. Gated
   *  behind `isReady` so the initial stagger reveal is never interrupted. */
  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReady || isDraggingRef.current) return;
    const rail = railRef.current;
    if (!rail) return;
    const card = e.currentTarget.getBoundingClientRect();
    const view = rail.getBoundingClientRect();

    const rightOverflow = card.right - (view.right - EDGE_BUFFER);
    const leftOverflow = view.left + EDGE_BUFFER - card.left;

    if (rightOverflow > 0) {
      rail.scrollBy({ left: rightOverflow + 24, behavior: "smooth" });
    } else if (leftOverflow > 0) {
      rail.scrollBy({ left: -(leftOverflow + 24), behavior: "smooth" });
    }
  };

  const onRailMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;

    e.preventDefault();
    isDraggingRef.current = true;
    isHoveringRef.current = true;
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
      isHoveringRef.current = false;
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
    <section
      id="squad"
      ref={sectionRef}
      className="bg-cream py-10 md:py-14 lg:py-16 px-6 md:px-14"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 md:mb-10 mx-auto text-center">
          <Reveal direction="left" offset={60}>
            <Eyebrow center>Meet the Squad</Eyebrow>
            <SectionHeading>
              {mode === "enterprise" ? (
                <span className="md:whitespace-nowrap">
                  Your AI Team for Every <span className="text-orange">Workforce Goal</span>
                </span>
              ) : (
                <span className="md:whitespace-nowrap">
                  Your AI Team for Every <span className="text-orange">Career Goal</span>
                </span>
              )}
              <br />
              <span className="md:whitespace-nowrap"></span>
            </SectionHeading>
          </Reveal>
        </div>
      </div>

      {/* Horizontal rail with drag interaction. */}
      <div className="-mx-6 md:-mx-14">
        <div
          ref={railRef}
          className="rail flex-1 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ cursor: "grab" }}
          onMouseDown={onRailMouseDown}
          onClickCapture={onRailClickCapture}
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            if (!isDraggingRef.current) isHoveringRef.current = false;
          }}
          onTouchStart={() => {
            isHoveringRef.current = true;
          }}
          onTouchEnd={() => {
            setTimeout(() => {
              isHoveringRef.current = false;
            }, 400);
          }}
        >
          <HoverEffect
            groupId="squadHoverBackdrop"
            backdropClassName=""
            inset="-inset-3"
            radius="rounded-[18px]"
            itemClassName="flex-shrink-0 h-full"
            className="flex items-stretch gap-3 md:gap-5 py-2 px-6 md:px-14"
          >
            {loopAgents.map((agent, i) => (
              <div
                key={`${agent.id}-${i}`}
                ref={
                  i === 0
                    ? firstItemRef
                    : i === visibleAgents.length
                      ? secondHalfRef
                      : undefined
                }
                onMouseEnter={(e) => {
                  handleCardHover(e);
                  prefetchAgent(agent);
                }}
                className="h-full"
                aria-hidden={i >= visibleAgents.length}
              >
                <div className="w-[260px] md:w-[300px] h-full">
                  <SquadCard
                    agent={agent}
                    variant="directory"
                    priority={i < 4}
                    onOpen={() => openAgent(agent)}
                  />
                </div>
              </div>
            ))}
          </HoverEffect>
        </div>
      </div>

      {/* View all — centered below the rail, straight to the full Agents page.
          Mode-aware: on /enterprise this must land on /agents?mode=enterprise,
          not bare /agents — otherwise a Business-mode visitor clicking through
          lands back on the individual roster, and the chatbot (which reads
          this same mode signal, see lib/bot/clientContext.ts) loses the
          context they were just in. */}
      <div className="mx-auto mt-8 flex max-w-[1440px] justify-center">
        <Link
          href={mode === "enterprise" ? "/agents?mode=enterprise" : "/agents"}
          className="cta-shine group inline-flex shrink-0 items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
        >
          View all agents
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Same bottom slide-up panel used on the Agents page — opens from the
          bottom edge with the agent's full info. */}
      <AgentSheet agent={activeAgent} onClose={() => setActiveAgent(null)} />
    </section>
  );
}
