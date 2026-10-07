"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { agents, type Agent } from "@/lib/data";
import {
  FEATURED_AGENT_IDS,
  AGENT_PAGE,
  AGENT_PAGE_ENTERPRISE,
  isActiveBusinessAgent,
} from "@/lib/agentMedia";
import { Eyebrow } from "@/components/home/SectionHeader";
import SquadCard from "@/components/home/SquadCard";
import AgentSheet from "./AgentSheet";

/**
 * Agents Directory — a dedicated showcase of GrowQR's AI ecosystem.
 * Reuses the homepage `SquadCard`, lays the featured agents out in a
 * responsive 3-column grid, and opens the shared `AgentSheet` on click.
 * An Individual / Business toggle (same pattern as the home Hero) swaps
 * the roster between the 7 job-seeker agents and the enterprise roster.
 */
export default function AgentsDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  /**
   * Local to this page's URL ONLY — deliberately NOT the shared HomeMode
   * context (components/layout/HomeMode.tsx) the home page's Hero toggle
   * uses. An earlier version routed this toggle through that shared
   * context's setMode(), which is safe on `/` and `/enterprise` (those
   * routes are "pinned", so navigating away always resets it) but NOT on
   * `/agents`, which just falls through to the context's plain shared
   * state — toggling here silently mutated that state, and it then leaked
   * into whatever the home page rendered on the NEXT visit, with no toggle
   * touched there at all. Reading/writing the URL directly, with no shared
   * state in between, makes that leak structurally impossible.
   */
  const isEnterprise = searchParams.get("mode") === "enterprise";

  const toggleMode = (newMode: "individual" | "enterprise") => {
    router.replace(`/agents?mode=${newMode}`, { scroll: false });
  };

  // Same roster/order as the homepage squad. Business mode swaps in the 6
  // dedicated enterprise agents plus any individual-side agent that also
  // has an enterprise page (Nova/Scout/Vera) — AGENT_PAGE_ENTERPRISE is the
  // single source of truth, matching Squad.tsx.
  const individualAgents = agents.filter((a) => a.type === "individual");
  const directoryIndividual = FEATURED_AGENT_IDS.map((id) =>
    individualAgents.find((a) => a.id === id)
  ).filter((a): a is Agent => Boolean(a));
  const directoryEnterprise = agents.filter(isActiveBusinessAgent);
  const directoryAgents = isEnterprise ? directoryEnterprise : directoryIndividual;

  // Dual-purpose agents route to their enterprise page in Business mode.
  const pageFor = (agent: Agent) =>
    isEnterprise
      ? AGENT_PAGE_ENTERPRISE[agent.name] ?? AGENT_PAGE[agent.name]
      : AGENT_PAGE[agent.name];

  // Agents with a dedicated landing page route there; the rest open the sheet.
  // Routes are prefetched on hover so the push lands straight on the page's
  // skeleton (loading.tsx) — no in-card spinner.
  const openAgent = (agent: Agent) => {
    const page = pageFor(agent);
    if (page) {
      router.push(page);
      return;
    }
    setActiveAgent(agent);
  };

  // Warm a dedicated agent route on hover so navigation is near-instant.
  const prefetchedRef = useRef<Set<string>>(new Set());
  const prefetchAgent = (agent: Agent) => {
    const page = pageFor(agent);
    if (page && !prefetchedRef.current.has(page)) {
      prefetchedRef.current.add(page);
      router.prefetch(page);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-6 md:px-14 pt-28 md:pt-36 pb-12 md:pb-16">
        <div
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[820px] rounded-full opacity-40 blur-[130px]"
          style={{ background: "radial-gradient(ellipse at center, rgba(255,106,47,0.08), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1100px] text-center">
          <Eyebrow center>Your AI Career Squad</Eyebrow>

          {/* Individual / Business toggle */}
          <div className="mt-5 inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white p-2 text-[14px] md:text-[15px] font-semibold shadow-sm">
            <button
              type="button"
              aria-pressed={!isEnterprise}
              onClick={() => toggleMode("individual")}
              className={`px-5 py-2 rounded-full transition ${
                !isEnterprise
                  ? "bg-orange-light text-orange-deep shadow-[0_8px_18px_-12px_rgba(255,176,128,0.7)]"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              Individual
            </button>
            <button
              type="button"
              aria-pressed={isEnterprise}
              onClick={() => toggleMode("enterprise")}
              className={`px-5 py-2 rounded-full transition ${
                isEnterprise
                  ? "bg-orange-light text-orange-deep shadow-[0_8px_18px_-12px_rgba(255,176,128,0.7)]"
                  : "text-ink-3 hover:text-ink"
              }`}
            >
              Business
            </button>
          </div>

          <h1 className="mt-6 text-[clamp(30px,8.5vw,72px)] font-medium tracking-[-0.05em] leading-[1] text-ink whitespace-normal sm:whitespace-nowrap">
            {isEnterprise ? (
              <>Meet Your AI <span className="text-orange">Workforce</span></>
            ) : (
              <>Meet Your AI <span className="text-orange">Squad</span></>
            )}
          </h1>
          <p className="mt-5 mx-auto max-w-[540px] text-[17px] md:text-[19px] leading-relaxed text-ink-3">
            {isEnterprise
              ? "Nine specialised agents. One workforce, optimised."
              : "Seven specialised agents. One career, handled."}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-white px-6 md:px-14 pb-24 md:pb-32">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {directoryAgents.map((agent, i) => (
              <div
                key={agent.id}
                className="h-[356px] md:h-[388px]"
                onMouseEnter={() => prefetchAgent(agent)}
              >
                <SquadCard
                  agent={agent}
                  priority={i < 3}
                  variant="directory"
                  onOpen={() => openAgent(agent)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <AgentSheet agent={activeAgent} onClose={() => setActiveAgent(null)} />
    </>
  );
}
