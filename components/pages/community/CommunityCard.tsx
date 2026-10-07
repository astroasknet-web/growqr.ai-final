"use client";

import Image from "next/image";
import { ArrowRight, MapPin, QrCode } from "lucide-react";
import type { Community } from "./community-data";

interface Props {
  community: Community;
  onViewQR: (community: Community) => void;
}

export default function CommunityCard({ community, onViewQR }: Props) {
  return (
    <article className="group flex h-full flex-col overflow-hidden border border-black/[0.07] bg-white shadow-[0_2px_18px_-10px_rgba(17,24,39,0.18)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-black/[0.1] hover:shadow-[0_32px_64px_-28px_rgba(17,24,39,0.22)] sm:flex-row">
      {/* ── Content (left on desktop, below image on mobile) ─────────── */}
      <div className="order-2 flex flex-1 flex-col p-5 sm:order-1 sm:basis-[60%] sm:px-6 sm:py-5 lg:px-7 lg:py-6">
        {/* Location label */}
        <span className="inline-flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-[0.1em] text-orange">
          <MapPin className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
          {community.locationLabel}
        </span>

        {/* Community name */}
        <h3 className="mt-3 text-balance text-[20px] font-bold leading-[1.2] tracking-[-0.03em] text-ink lg:text-[22px]">
          {community.communityName}
        </h3>

        {/* Bottom row — primary CTA + QR, pinned to the base for clean alignment */}
        <div className="mt-auto flex items-center gap-2.5 pt-5">
          <a
            href={community.joinLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange px-5 py-2.5 text-[14px] font-bold text-white transition-all duration-300 hover:bg-orange-dark active:scale-[0.98] group-hover:shadow-[0_12px_28px_-10px_rgba(255,106,47,0.6)]"
          >
            Join Community
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
          <button
            onClick={() => onViewQR(community)}
            aria-label={`View QR code for ${community.communityName}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-orange/40 hover:bg-orange/[0.04] hover:text-orange active:scale-[0.97]"
          >
            <QrCode className="h-4 w-4" />
            QR
          </button>
        </div>
      </div>

      {/* ── Cover image (right on desktop, top on mobile) ──────────────
           16:10 on mobile / square-ish on desktop keeps the card compact
           without leaving dead space beside the content. */}
      <div className="relative order-1 aspect-[16/10] w-full shrink-0 overflow-hidden bg-cream/40 sm:order-2 sm:aspect-auto sm:w-[40%] sm:self-stretch">
        <Image
          src={community.image}
          alt={community.imageAlt}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 40vw, 260px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
      </div>
    </article>
  );
}
