"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { lockSmoothScroll, unlockSmoothScroll } from "@/lib/smoothScroll";
import type { GalleryImage } from "@/lib/gallery/gallery-data";

const ease = [0.22, 1, 0.36, 1] as const;

/** Horizontal travel (px) that counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 48;

/**
 * Full-screen viewer for the gallery.
 *
 * Deliberately plain: a dark ground, the photograph as large as the viewport
 * allows, and the caption set quietly beneath it. No zoom, no filmstrip, no
 * chrome competing with the picture.
 *
 * Portals to <body> so it clears the fixed navbar's stacking context, and
 * pauses Lenis while open — `body { overflow: hidden }` alone does not stop
 * the smooth-scroll layer (see lib/smoothScroll.ts).
 */
export default function GalleryLightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  /** Index into `images`, or null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const open = index !== null;
  const image = open ? images[index] : null;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      // Wrap around so the arrows never dead-end.
      onNavigate((index + delta + images.length) % images.length);
    },
    [index, images.length, onNavigate]
  );

  // Keyboard: Escape closes, arrows page through. Bound while open only.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  // Scroll lock + focus handoff. Focus moves into the dialog on open and
  // returns to the thumbnail that opened it on close, so keyboard users land
  // back where they were in the grid rather than at the top of the page.
  useEffect(() => {
    if (!open) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lockSmoothScroll();
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      unlockSmoothScroll();
      restoreFocusTo.current?.focus?.();
    };
  }, [open]);

  // Warm the neighbours so paging feels instant instead of flashing a gap.
  useEffect(() => {
    if (index === null) return;
    for (const d of [1, -1]) {
      const n = images[(index + d + images.length) % images.length];
      const img = new Image();
      img.src = n.src;
    }
  }, [index, images]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && image && (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col bg-[#0B0B0C]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${image.caption}. ${image.location}, ${image.place}. Image ${
              (index ?? 0) + 1
            } of ${images.length}`}
            tabIndex={-1}
            data-lenis-prevent
            className="flex h-full flex-col outline-none"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
          >
            {/* Top bar: counter left, close right */}
            <div className="flex shrink-0 items-center justify-between px-5 py-4 md:px-8 md:py-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45 tabular-nums">
                {String((index ?? 0) + 1).padStart(2, "0")}
                <span className="mx-1.5 text-white/25">/</span>
                {String(images.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close gallery viewer"
                className="flex h-10 w-10 items-center justify-center text-white/60 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
              >
                <X size={20} strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {/* Stage */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 md:px-20">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photograph"
                className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-white/50 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 md:flex"
              >
                <ChevronLeft size={30} strokeWidth={1.25} aria-hidden />
              </button>

              <AnimatePresence mode="wait">
                <motion.img
                  key={image.slug}
                  src={image.src}
                  srcSet={image.srcSet}
                  sizes="(min-width: 768px) 88vw, 100vw"
                  width={image.width}
                  height={image.height}
                  alt={`${image.caption}. ${image.location}, ${image.place}.`}
                  decoding="async"
                  className="max-h-full w-auto max-w-full object-contain"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease }}
                />
              </AnimatePresence>

              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photograph"
                className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-white/50 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 md:flex"
              >
                <ChevronRight size={30} strokeWidth={1.25} aria-hidden />
              </button>
            </div>

            {/* Caption */}
            <div className="shrink-0 px-5 py-5 text-center md:px-8 md:py-7">
              <p className="text-[15px] font-medium leading-snug text-white md:text-[17px]">
                {image.location}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-white/45 md:text-[13px]">
                {image.caption}
                <span className="mx-1.5 text-white/25">·</span>
                {image.place}
                {image.date ? (
                  <>
                    <span className="mx-1.5 text-white/25">·</span>
                    {image.date}
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
