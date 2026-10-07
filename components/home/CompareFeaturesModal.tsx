"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { lockSmoothScroll, unlockSmoothScroll } from "@/lib/smoothScroll";
import CompareFeaturesTable, { type FeatureGroup, type PlanLike } from "./CompareFeaturesTable";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Compare-every-feature modal — the full pricing comparison table, lifted out
 * of the always-on landing layout into a standard centered popup. Dimmed
 * backdrop, Escape / backdrop / X to close, smooth-scroll lock, and an
 * internally scrollable body so long tables stay usable on any viewport.
 *
 * Desktop/tablet only (`lg` and up) — below that, Pricing renders
 * CompareFeaturesInline instead, since a fixed full-screen overlay is a poor
 * pinch-zoom/scroll experience on touch (see CompareFeaturesInline's doc).
 */
export default function CompareFeaturesModal({
  open,
  onClose,
  plans,
  groups,
  showPopularBadge = true,
}: {
  open: boolean;
  onClose: () => void;
  plans: PlanLike[];
  groups: FeatureGroup[];
  showPopularBadge?: boolean;
}) {
  // Portal to <body> so the dialog escapes the Pricing section's stacking
  // context (`isolate`) and clipping (`overflow-hidden`) — otherwise z-index
  // can't lift it above the fixed navbar and the panel gets trapped/clipped.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Escape to close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    lockSmoothScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      unlockSmoothScroll();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-[8px]"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel — centered popup with an internally scrollable body */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Compare every feature"
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease }}
            className="relative flex max-h-[88vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-cream border border-black/[0.08] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.55)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-40 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white/90 text-ink-3 backdrop-blur-md transition-colors hover:bg-white hover:text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-shrink-0 border-b border-black/[0.07] bg-gradient-to-b from-white to-cream px-5 pb-5 pt-7 text-center sm:px-8 md:px-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/20 bg-orange-lighter px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-orange-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
                Compare Plans
              </span>
              <h3 className="mt-3 text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[26px]">
                Every feature, side by side
              </h3>
            </div>
            {/* This bordered card is itself the single scroll container (flex
                child with min-h-0 so it can shrink and scroll), letting the
                header + first column stick against it in both axes. On narrow
                screens the table keeps a min width and scrolls horizontally. */}
            <div className="mx-4 mb-4 mt-5 flex min-h-0 flex-1 flex-col sm:mx-8 sm:mb-6 sm:mt-6 md:mx-10">
              <CompareFeaturesTable
                plans={plans}
                groups={groups}
                showPopularBadge={showPopularBadge}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
