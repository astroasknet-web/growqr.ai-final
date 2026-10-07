"use client";

import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { type Agent } from "@/lib/data";
import { AGENT_URL, AGENT_CTA } from "@/lib/agentMedia";
import { AgentName, withAgentMarks } from "@/components/ui/AgentName";
import { trackAppCta } from "@/lib/analytics";
import { useSvgInView } from "@/lib/useSvgInView";

/* ────────────────────────────────────────────────────────────────────────
   AgentShowcase — the shared "premium product showcase" right-column used by
   the bespoke agent modals (Vera, Mira, …). Each agent supplies its hero copy,
   benefit chips, step mockups, feature list and a before→after; this file owns
   the layout, spacing and typography so every showcase stays consistent.
   ──────────────────────────────────────────────────────────────────────── */

const eio = [0.22, 1, 0.36, 1] as const;

/* ── Shared mockup atoms (imported by each agent's mockups) ─────────────── */

/** A grey skeleton bar — the building block of every mini mockup. */
export function Bar({ w = "100%", className = "" }: { w?: string; className?: string }) {
  return <div className={`h-2 rounded-full bg-ink/[0.08] ${className}`} style={{ width: w }} />;
}

/** Small circular progress ring for score mockups. */
export function Ring({ value, size = 56, stroke = 6, color = "#16A34A" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Observed on the root <svg>, not the <circle>: Safari's IntersectionObserver
  // never fires for SVG children, so a `whileInView` here would leave the ring
  // permanently empty (see lib/useSvgInView.ts).
  const [ringRef, inView] = useSvgInView<SVGSVGElement>();
  return (
    <svg ref={ringRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0000000F" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={inView ? { strokeDashoffset: c * (1 - value / 100) } : undefined}
        transition={{ duration: 1, ease: eio }}
      />
    </svg>
  );
}

/* ── Types ─────────────────────────────────────────────────────────────── */

export type ShowcaseStep = { n: number; title: string; caption: string; bg: string; mockup: ReactNode };
export type ShowcaseFeature = { icon: LucideIcon; title: string; caption: string };
export type ShowcaseChip = { icon: LucideIcon; label: string };

export type ShowcaseConfig = {
  agent: Agent;
  headline: string;        // e.g. "Meet Vera"
  valueProp: string;       // one strong sentence
  chips: ShowcaseChip[];   // 3 compact benefit chips
  steps: ShowcaseStep[];   // "How it works"
  // Reserved for future blocks below the steps — not rendered today, so optional.
  features?: ShowcaseFeature[];
  before?: string[];
  after?: string[];
};

/* ── Section eyebrow ───────────────────────────────────────────────────── */

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-[13px] md:text-[14px] font-bold uppercase tracking-[0.14em] text-ink-4">
      {children}
    </p>
  );
}

/* ── The showcase ──────────────────────────────────────────────────────── */

export function AgentShowcase({ config }: { config: ShowcaseConfig }) {
  const { agent, headline, valueProp, chips, steps } = config;
  const url = AGENT_URL[agent.name] ?? "https://app.growqr.ai/signup";
  const cta = AGENT_CTA[agent.name] ?? `Activate ${agent.name}`;

  return (
    <div>
      {/* ── Hero — a single run-in block: the identity (name + role) is a bold
          lead-in to the value prop itself rather than a separate oversized
          headline, then the primary CTA. Compact, full-width, and fits without
          scrolling. There's no top navbar, so the CTA lives here. ── */}
      <div>
        <p className="max-w-[60ch] text-[18px] md:text-[20px] leading-[1.55] text-ink-2">
          <span className="font-bold text-ink whitespace-nowrap">{withAgentMarks(headline)} · {agent.role}</span>
          {" - "}
          {withAgentMarks(valueProp)}
        </p>
        {/* CTA + benefit chips share one row: the primary action leads, then
            a divider, then the chips as supporting proof. Neutral chips keep
            the orange CTA the clear focal point. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a
            href={url}
            onClick={() =>
              trackAppCta({
                ctaLabel: cta,
                ctaLocation: "agent_showcase",
                destinationUrl: url,
              })
            }
            className="group inline-flex w-fit items-center gap-2.5 rounded-xl bg-orange pl-5 pr-3.5 py-3 text-[15.5px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)]"
          >
            {cta}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20 transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          </a>
          <span className="hidden h-7 w-px shrink-0 bg-black/10 sm:block" />
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink-2 ring-1 ring-black/[0.07] shadow-[0_4px_14px_-8px_rgba(0,0,0,0.25)]"
              >
                <c.icon className="h-4 w-4 text-orange" strokeWidth={2.2} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works — section heading, then the four staple cards,
          fixed-height so both rows stay uniform in one view. ── */}
      <div className="mt-7">
        <SectionHead>How <AgentName name={agent.name} /> Works</SectionHead>
        <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white">
              <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange text-[13px] font-bold text-white">
                  {s.n}
                </span>
                <div className="leading-tight">
                  <div className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{withAgentMarks(s.title)}</div>
                  <div className="text-[12px] text-ink-4">{withAgentMarks(s.caption)}</div>
                </div>
              </div>
              {/* `zoom` (not transform-scale) so the mockup's layout box
                  actually shrinks — the gradient frame then hugs the content
                  instead of leaving empty coloured space around it. */}
              <div className={`flex flex-1 items-center justify-center overflow-hidden min-h-[150px] bg-gradient-to-br ${s.bg} px-5 py-4`}>
                <div className="flex w-full justify-center" style={{ zoom: 0.86 }}>{s.mockup}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
