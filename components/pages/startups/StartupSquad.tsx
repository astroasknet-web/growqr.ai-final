"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { agents, type Agent } from "@/lib/data";
import { AGENT_PAGE } from "@/lib/agentMedia";
import SquadCard from "@/components/home/SquadCard";
import AgentSheet from "@/components/agents/directory/AgentSheet";
import { Eyebrow } from "@/components/home/SectionHeader";
import { B2B_AGENT_LINKS } from "@/components/pages/solutions/journeyKit";

/** The four agents from the startup journey, in the same order. Each links to
 *  its dedicated agent page where one exists. */
const SQUAD = ["RQ-Nova", "RQ-Scout", "RQ-Eva", "RQ-Rohan"];
const byName = Object.fromEntries(agents.map((a) => [a.name, a]));
// B2B page: link agents to their enterprise page where one exists (e.g. Nova).
const hrefFor = (name: string) => B2B_AGENT_LINKS[name] ?? AGENT_PAGE[name];

export default function StartupSquad() {
  const router = useRouter();
  const cards = SQUAD.map((n) => byName[n]).filter(Boolean) as Agent[];

  // Agents without a dedicated page open the same slide-up preview sheet
  // the homepage falls back to, instead of a dead click.
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // Warm the agent routes so a card click navigates near-instantly.
  useEffect(() => {
    SQUAD.forEach((n) => {
      const href = hrefFor(n);
      if (href) router.prefetch(href);
    });
  }, [router]);

  // Drag-to-scroll — the rail is a horizontal overflow region. On desktop Lenis
  // owns the wheel and a mouse can't drag a native scrollbar, so we implement
  // click-drag scrolling and swallow the click when a drag actually happened.
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
          <Eyebrow center>Meet the Squad</Eyebrow>
          <h2 className="mt-3 text-[30px] font-medium leading-[1.05] tracking-[-0.03em] text-[#1a1a1a] md:text-[42px] md:tracking-[-0.04em]">
            Your <span className="text-orange">AI Team</span> for Startups
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-ink-3 md:text-[17px]">
            One specialist for every key move.
          </p>
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
