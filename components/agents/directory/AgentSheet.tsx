"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { type Agent } from "@/lib/data";
import {
  AGENT_VIDEO,
  AGENT_POINTS,
  AGENT_URL,
  AGENT_CTA,
  AGENT_TRANSFORM,
  AGENT_JOURNEY,
  shortRole,
} from "@/lib/agentMedia";
import { lockSmoothScroll, unlockSmoothScroll } from "@/lib/smoothScroll";
import { trackAppCta } from "@/lib/analytics";
import { AgentName } from "@/components/ui/AgentName";
import { VeraSheetContent } from "./VeraSheetContent";
import { MiraSheetContent } from "./MiraSheetContent";
import { KaiSheetContent } from "./KaiSheetContent";
import { NovaSheetContent } from "./NovaSheetContent";
import { ScoutSheetContent } from "./ScoutSheetContent";
import { SageSheetContent } from "./SageSheetContent";
import { LyraSheetContent } from "./LyraSheetContent";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Agents with a bespoke, visual product-showcase right column (built on
 * AgentShowcase). Add an agent here and it automatically gets the premium
 * layout; everyone else falls back to the generic section stack below.
 */
const BESPOKE_SHEETS: Record<string, (props: { agent: Agent }) => ReactNode> = {
  "RQ-Vera": VeraSheetContent,
  "RQ-Mira": MiraSheetContent,
  "RQ-Kai": KaiSheetContent,
  "RQ-Nova": NovaSheetContent,
  "RQ-Scout": ScoutSheetContent,
  "RQ-Sage": SageSheetContent,
  "RQ-Lyra": LyraSheetContent,
};

/**
 * Agent slide-up panel — a single dynamic surface reused for every agent in
 * the Agents Directory. It rises from the bottom edge (flush, no gap) and
 * occupies most of the screen width, reading as a product subpage rather than
 * a floating popup:
 *  - Right : the agent's intro video, sticky on desktop (primary visual).
 *  - Left  : a vertical stack of content sections that scrolls independently.
 *
 * The right column is intentionally a simple section stack so new blocks can
 * be dropped in later (pricing, FAQs, sample output…) without reflowing.
 */
export default function AgentSheet({
  agent,
  onClose,
}: {
  agent: Agent | null;
  onClose: () => void;
}) {
  // Escape to close + body scroll lock while open.
  useEffect(() => {
    if (!agent) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Pause Lenis too — `overflow: hidden` alone doesn't stop it driving the
    // page scroll behind the panel (see smoothScroll.ts).
    lockSmoothScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      unlockSmoothScroll();
    };
  }, [agent, onClose]);

  const video = agent ? AGENT_VIDEO[agent.name] : undefined;
  const points = agent ? AGENT_POINTS[agent.name] ?? [] : [];
  const transform = agent ? AGENT_TRANSFORM[agent.name] : undefined;
  const journey = agent ? AGENT_JOURNEY[agent.name] ?? [] : [];
  const agentUrl = agent
    ? AGENT_URL[agent.name] ?? "https://app.growqr.ai/signup"
    : "https://app.growqr.ai/signup";
  // Some agents get a bespoke, visual product-showcase right column. Every
  // other agent keeps the generic section stack below.
  const Bespoke = agent ? BESPOKE_SHEETS[agent.name] : undefined;

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center px-3 sm:px-5 md:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[6px]"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel — rises from the bottom, flush to the viewport edge */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${agent.name} — ${shortRole(agent.role)}`}
            data-lenis-prevent
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease }}
            className="relative w-full max-w-[1580px] h-[95vh] overflow-y-auto rounded-t-[8px] bg-cream border-x border-t border-black/[0.07] shadow-[0_-40px_140px_-40px_rgba(0,0,0,0.55)] overscroll-contain"
          >
            {/* No top navbar — the identity + CTA now live inside the content
                column, so the whole panel height is content. Only the close
                button floats, pinned to the top-right corner. On mobile a slim
                grab handle hints the drag-to-dismiss affordance. */}
            <span className="lg:hidden absolute top-2 left-1/2 z-40 -translate-x-1/2 h-1.5 w-12 rounded-full bg-white/60" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-40 flex-shrink-0 w-10 h-10 rounded-full bg-white/90 border border-black/[0.06] backdrop-blur-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-white transition-colors shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col lg:flex-row-reverse">
              {/* Right (desktop) — video, sticky. Sized to the clip's native
                  9:16 (1080×1920) so it fills the frame with NO crop and no
                  over-zoom; the slim rail hands the extra width to the
                  details column for an easier read/scroll. On mobile it stays
                  on top (flex-col), with the text below. */}
              <div className="relative lg:sticky lg:top-0 lg:h-[95vh] shrink-0 bg-ink flex items-center justify-center">
                {video ? (
                  <video
                    key={video}
                    src={video}
                    className="h-[56vh] lg:h-full aspect-[9/16] max-w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    poster={agent.image}
                  />
                ) : (
                  <div
                    className="h-[56vh] lg:h-full aspect-[9/16] flex items-center justify-center"
                    style={{
                      background: `radial-gradient(ellipse at 50% 45%, ${agent.color}, ${agent.color}99)`,
                    }}
                  >
                    <span className="text-[100px] font-extrabold text-white/95 tracking-[-0.04em]">
                      {agent.initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Left (desktop) — content stack. Add future sections as more <Section>s. */}
              <div className={`flex-1 min-w-0 px-7 sm:px-12 lg:px-16 ${
                  Bespoke ? "pt-8 lg:pt-10 pb-10" : "pt-9 lg:pt-16 pb-24"
                }`}>
                {Bespoke ? (
                  <Bespoke agent={agent} />
                ) : (
                <>
                {/* Header */}
                <span className="text-[14px] md:text-[15px] font-bold uppercase tracking-[0.14em] text-orange-deep">
                  {agent.role}
                </span>
                <h2 className="mt-2.5 text-[44px] md:text-[58px] xl:text-[66px] font-semibold tracking-[-0.04em] leading-[0.98] text-ink">
                  <AgentName name={agent.name} />
                </h2>
                <p className="mt-5 text-[18px] md:text-[21px] leading-[1.5] text-ink-3 max-w-[52ch]">
                  {agent.desc}
                </p>

                {/* User journey — three quick steps to the outcome */}
                {journey.length > 0 && (
                  <Section title="How It Works">
                    <ol className="relative flex flex-col gap-7 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-px before:bg-black/10">
                      {journey.map((step, i) => (
                        <li key={step.title} className="relative flex gap-5">
                          <span className="relative z-10 flex-shrink-0 w-9 h-9 rounded-full bg-cream border border-orange/30 text-orange flex items-center justify-center text-[15px] font-bold">
                            {i + 1}
                          </span>
                          <div className="pt-0.5">
                            <div className="text-[18px] md:text-[20px] font-semibold text-ink tracking-[-0.01em]">
                              {step.title}
                            </div>
                            <p className="mt-1 text-[15.5px] md:text-[16.5px] leading-[1.5] text-ink-3 max-w-[46ch]">
                              {step.detail}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </Section>
                )}

                {/* What you'll get */}
                {points.length > 0 && (
                  <Section title="What You'll Get">
                    <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
                      {points.slice(0, 4).map((p) => (
                        <li key={p} className="flex items-center gap-3.5">
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-lighter flex items-center justify-center">
                            <Check className="w-4 h-4 text-orange" strokeWidth={3} />
                          </span>
                          <span className="text-[17px] md:text-[18.5px] font-semibold text-ink-2">
                            {p}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* Transformation — before → after */}
                {transform && (
                  <Section title="The Transformation">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                      <div className="flex-1 rounded-2xl border border-black/[0.08] bg-cream-2 px-6 py-5">
                        <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-4">
                          Before
                        </div>
                        <div className="mt-2 text-[17px] md:text-[19px] font-medium text-ink-3 leading-snug">
                          {transform.before}
                        </div>
                      </div>
                      <div className="flex-shrink-0 self-center w-11 h-11 rounded-full bg-orange flex items-center justify-center rotate-90 sm:rotate-0 shadow-[0_10px_24px_-8px_rgba(255,106,47,0.6)]">
                        <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 rounded-2xl border border-orange/25 bg-orange-lighter px-6 py-5">
                        <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-orange-deep">
                          After
                        </div>
                        <div className="mt-2 text-[17px] md:text-[19px] font-semibold text-ink leading-snug">
                          {transform.after}
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                {/* Primary CTA */}
                <a
                  href={agentUrl}
                  onClick={() =>
                    trackAppCta({
                      ctaLabel:
                        AGENT_CTA[agent.name] ?? `Activate ${agent.name}`,
                      ctaLocation: "agent_sheet",
                      destinationUrl: agentUrl,
                    })
                  }
                  className="group mt-12 inline-flex items-center gap-3 self-start text-white text-[17px] md:text-[18px] font-semibold pl-7 pr-5 py-4 rounded-2xl bg-orange hover:bg-orange-dark transition-all hover:shadow-[0_16px_36px_-12px_rgba(255,106,47,0.6)]"
                >
                  {AGENT_CTA[agent.name] ?? `Activate ${agent.name}`}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                  </span>
                </a>
                </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * A titled content block in the details column. Consistent top spacing and
 * heading treatment so new sections slot in cleanly as the panel grows.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-11">
      <p className="text-[13px] md:text-[14px] font-bold uppercase tracking-[0.14em] text-ink-4">
        {title}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  );
}
