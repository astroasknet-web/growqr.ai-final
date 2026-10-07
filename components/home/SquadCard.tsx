"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { type Agent } from "@/lib/data";
import { shortRole } from "@/lib/agentMedia";
import { AgentName } from "@/components/ui/AgentName";

interface SquadCardProps {
  agent: Agent;
  /** First 4 cards above the fold — eager-load their images. */
  priority?: boolean;
  /** Opens the agent preview modal, or navigates to the agent's page. */
  onOpen?: () => void;
  /**
   * Visual treatment:
   *  - "default"   — homepage rail card (orange glow lift, "View Agent" row).
   *  - "directory" — Agents page card: subtle, cleaner hover and an inline
   *    arrow affordance next to the name so the card reads as clickable
   *    without a heavy CTA button.
   */
  variant?: "default" | "directory";
}

/**
 * Simplified agent card — portrait, name, role, and a single CTA that
 * opens the preview modal. No description: the card's job is to be
 * scannable and invite a click, not to explain the agent.
 */
export default function SquadCard({
  agent,
  priority = false,
  onOpen,
  variant = "default",
}: SquadCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = Boolean(agent.image) && !imgError;
  const isDirectory = variant === "directory";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative w-full h-[332px] sm:h-[352px] md:h-full text-left flex flex-col transition-all duration-300 ease-out bg-white border border-black/10 rounded-[16px] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2 active:scale-[0.98] ${
        isDirectory
          ? "hover:border-black/15 hover:-translate-y-1 hover:shadow-[0_18px_44px_-26px_rgba(0,0,0,0.28)]"
          : "hover:border-black/15 hover:-translate-y-1.5 hover:shadow-[0_24px_56px_-22px_rgba(0,0,0,0.22)]"
      }`}
    >
      {/* Portrait — full bleed */}
      <div className="relative aspect-[5/4] img-skeleton bg-gradient-to-b from-cream-2 to-cream/70 border-b border-black/5 overflow-hidden">
        {hasImage ? (
          <Image
            src={agent.image as string}
            alt={`${agent.name} — ${agent.role}`}
            fill
            sizes="(max-width: 768px) 230px, 300px"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            onError={() => setImgError(true)}
          />
        ) : (
          <PortraitFallback agent={agent} />
        )}

        {/* Play affordance — hints the video preview on hover. Only the
            default (home rail) variant previews a video; directory cards
            navigate to the agent page, so no play button there. */}
        {!isDirectory && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/0 group-hover:bg-ink/15 transition-colors duration-300">
            <span className="w-14 h-14 rounded-full bg-white/92 backdrop-blur flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(0,0,0,0.35)] scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
              <Play className="w-5 h-5 text-orange fill-orange ml-0.5" />
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-[14px] md:p-5 flex flex-col flex-1 min-h-0">
        {isDirectory ? (
          /* Directory: name first, role underneath, inline arrow affordance.
             The whole card is the click target; the arrow just signals it. */
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-ink text-[19px] md:text-[22px] font-extrabold tracking-[-0.03em] leading-tight">
                <AgentName name={agent.name} />
              </div>
              <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
                {shortRole(agent.role)}
              </div>
            </div>
            <span className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-black/10 text-ink-4 transition-all duration-300 group-hover:border-orange/30 group-hover:bg-orange-lighter group-hover:text-orange">
              <svg
                viewBox="0 0 16 16"
                className="h-[15px] w-[15px] transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8h10" />
                <path d="M9 4l4 4-4 4" />
              </svg>
            </span>
          </div>
        ) : (
          <>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-orange-deep">
              {shortRole(agent.role)}
            </div>
            <div className="text-ink text-[19px] md:text-[22px] font-extrabold tracking-[-0.03em] leading-tight mt-1">
              <AgentName name={agent.name} />
            </div>

            {/* CTA — quiet by default, lights up on card hover so the grid
                doesn't read as a wall of buttons. */}
            <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-4 group-hover:text-orange transition-colors">
              View Agent
              <svg
                viewBox="0 0 16 16"
                className="h-[15px] w-[15px] transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8h10" />
                <path d="M9 4l4 4-4 4" />
              </svg>
            </span>
          </>
        )}
      </div>
    </button>
  );
}

/** Fallback when an image can't load — agent's color gradient + initials. */
function PortraitFallback({ agent }: { agent: Agent }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `radial-gradient(ellipse at 50% 45%, ${agent.color}, ${darken(agent.color, 0.5)})`,
      }}
    >
      <div className="text-[72px] font-extrabold text-white/95 tracking-[-0.04em] leading-none select-none">
        {agent.initials}
      </div>
    </div>
  );
}

function darken(hex: string, t: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c * (1 - t)).toString(16).padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}
