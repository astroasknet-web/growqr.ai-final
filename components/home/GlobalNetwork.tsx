"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { Eyebrow, SectionHeading } from "./SectionHeader";

/**
 * The GrowQR Advisory Board — a premium, Apple-style marquee.
 *
 * One continuous, edge-to-edge row of monochrome portraits, connected with no
 * gaps. It auto-drifts smoothly to the left, but is also fully scrollable by
 * cursor — drag to grab, or use a trackpad/wheel. The auto-drift pauses while
 * you hover or drag, and stops entirely for reduced-motion visitors. The track
 * holds two identical copies so both the auto-scroll and manual scroll loop
 * seamlessly. Each portrait carries a minimal overlay in its top-right corner:
 * name + country flag, with the role directly beneath.
 */

type Person = {
  name: string;
  role: string;
  src: string;
  /** Iconify flat flag icon name (e.g. "flag:us-4x3") */
  flag: string;
  /** Extra image classes to fine-tune the crop (e.g. a downward translate). */
  imgClassName?: string;
  hidden?: boolean;
};

const US = "flag:us-4x3";
const IN = "flag:in-4x3";

const PEOPLE: Person[] = [
  { name: "Pranav Prashar", role: "Founder & President", src: "/team/pranav.png", flag: US },
  { name: "Bibin Babu", role: "Founder & CEO", src: "/team/bibinpfp.png", flag: IN },
  { name: "Kanika Mishra", role: "Chief Operating Officer", src: "/team/kanika.png", flag: IN, imgClassName: "translate-y-[6%]" },
  { name: "Dr. Ruchi Sharma", role: "Chief Academic Partnerships Officer", src: "/team/ruchi.png", flag: IN, imgClassName: "scale-90 translate-y-[4%]" },
  { name: "Amandeep Singh Bhateja", role: "Director, Growth & Global Alliances", src: "/team/aman.png", flag: IN, imgClassName: "translate-y-[5%]" },
  { name: "Chandrika Das", role: "Academic Advisor", src: "/experts/portraits/chandrika.png", flag: IN, imgClassName: "translate-y-[5%]", hidden: true },
  { name: "Karanshu Sharma", role: "Senior Program Manager", src: "/experts/portraits/karanshu.webp", flag: IN, imgClassName: "translate-y-[9%]", hidden: true },
  { name: "Meenakshi Panghal", role: "Student Success Advisor", src: "/experts/portraits/meenakshi.png", flag: US, imgClassName: "translate-y-[5%]", hidden: true },
  { name: "Dinesh Soni", role: "Artist & Mentor", src: "/experts/portraits/dinesh.png", flag: IN, imgClassName: "translate-y-[5%]", hidden: true },
  { name: "Ankur", role: "Community", src: "/experts/portraits/ankur.webp", flag: IN, hidden: true },
];

const CAPTION_SHADOW = "0 1px 6px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.45)";

// How many identical copies fill the track. More copies keep the loop seamless
// on ultra-wide screens where a single copy is narrower than the viewport.
const COPIES = 3;

function PersonCard({ person, hidden = false }: { person: Person; hidden?: boolean }) {
  return (
    <figure className="relative h-[316px] w-[240px] shrink-0 overflow-hidden bg-[#F5F5F4] sm:h-[360px] sm:w-[288px] md:h-[460px] md:w-[368px]">
      <Image
        src={person.src}
        alt={hidden ? "" : person.name}
        fill
        sizes="368px"
        draggable={false}
        aria-hidden={hidden || undefined}
        className={cn(
          "pointer-events-none select-none object-cover object-top grayscale contrast-[1.05]",
          person.imgClassName
        )}
      />

      {/* Corner scrim — keeps the top-right caption legible over any photo. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(215deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.16)_36%,transparent_60%)]"
      />

      {/* Hairline seam — keeps adjacent portraits feeling connected but defined. */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/10" />

      {/* Caption — name + flag, role beneath; anchored top-right. */}
      <figcaption
        className="pointer-events-none absolute right-3.5 top-3.5 ml-auto max-w-[200px] text-right md:right-4 md:top-4 md:max-w-[240px]"
        aria-hidden={hidden || undefined}
      >
        <div className="flex items-center justify-end gap-1.5">
          <h3
            className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-white md:text-[16px]"
            style={{ textShadow: CAPTION_SHADOW }}
          >
            {person.name}
          </h3>
          <Icon
            icon={person.flag}
            className="h-[13px] w-[19px] shrink-0 rounded-[2px] ring-1 ring-white/30"
            aria-hidden
          />
        </div>
        <p
          className="mt-1 text-[12px] font-medium leading-snug text-white/85 md:text-[12.5px]"
          style={{ textShadow: CAPTION_SHADOW }}
        >
          {person.role}
        </p>
      </figcaption>
    </figure>
  );
}

export default function GlobalNetwork() {
  const isLive = useIsLive();
  const people = PEOPLE.filter((p) => !p.hidden);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Refs so the animation loop always reads the latest interaction state
  // without re-subscribing.
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  /** Keep the scroll position inside the first copy so it loops both ways. */
  const normalize = (el: HTMLDivElement) => {
    const unit = el.scrollWidth / COPIES;
    if (unit <= 0) return;
    if (el.scrollLeft >= unit) el.scrollLeft -= unit;
    else if (el.scrollLeft < 0) el.scrollLeft += unit;
  };

  // Auto-drift: nudge scrollLeft each frame, looping seamlessly at the halfway
  // point (one full copy). Skipped for reduced-motion — manual scroll still works.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || reduce) return;

    let raf = 0;
    let last = performance.now();
    const SPEED = 50; // px per second

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!pausedRef.current && !draggingRef.current) {
        el.scrollLeft += SPEED * dt;
        normalize(el);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  // Mouse drag-to-scroll (touch devices keep native momentum scrolling).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    draggingRef.current = true;
    dragStartX.current = e.clientX;
    dragStartScroll.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = dragStartScroll.current - (e.clientX - dragStartX.current);
    normalize(el);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    scrollerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Keep this India/live-market expert section out of the US-side experience,
  // including local/default previews where no exact country code is present.
  if (!isLive) return null;

  return (
    <section id="global-network" className="relative overflow-hidden bg-white py-20 md:py-28">
      {/* Header — centered, shared primitives */}
      <div className="mx-auto mb-14 flex max-w-[760px] flex-col items-center px-6 text-center md:mb-20 md:px-14">
        <Eyebrow center>Our Experts</Eyebrow>
        <SectionHeading className="whitespace-nowrap !text-[clamp(26px,4.4vw,56px)]">
          <span className="text-orange">Human</span> in the Loop.
        </SectionHeading>
      </div>

      {/* Full-bleed, cursor-scrollable marquee — one endless, gapless row. */}
      <div
        ref={scrollerRef}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className="flex w-full cursor-grab select-none overflow-x-auto overscroll-x-contain active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&_img]:pointer-events-none"
      >
        {/* Identical sets → seamless loop for auto-drift and manual scroll. */}
        <div className="flex w-max shrink-0">
          {Array.from({ length: COPIES }).map((_, c) =>
            people.map((person) => (
              <PersonCard
                key={`${c}-${person.name}`}
                person={person}
                hidden={c > 0}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
