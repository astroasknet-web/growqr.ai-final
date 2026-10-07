"use client";

import { AnimatePresence, motion } from "framer-motion";
import CompareFeaturesTable, { type FeatureGroup, type PlanLike } from "./CompareFeaturesTable";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Mobile/tablet counterpart to CompareFeaturesModal — same table, rendered
 * inline in the page flow instead of a fixed full-screen overlay.
 *
 * Why: on touch devices, pinch-zoom and pan over a `position: fixed` overlay
 * is a known-bad experience (iOS Safari in particular clips/misbehaves when
 * zooming a fixed element), and the modal's horizontal-scrolling table nested
 * inside its own vertical-scrolling body compounds it — two scroll axes
 * trapped inside a scroll-locked overlay. Rendering the table as a normal
 * expand/collapse section under the pricing cards means it scrolls and
 * pinch-zooms exactly like the rest of the page; only the table itself still
 * scrolls horizontally (unavoidable with 4 plan columns on a narrow screen).
 */
export default function CompareFeaturesInline({
  open,
  plans,
  groups,
  showPopularBadge = true,
}: {
  open: boolean;
  plans: PlanLike[];
  groups: FeatureGroup[];
  showPopularBadge?: boolean;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease }}
          className="overflow-hidden"
        >
          <div className="mt-8">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/20 bg-orange-lighter px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-orange-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
                Compare Plans
              </span>
              <h3 className="mt-3 text-[19px] font-semibold tracking-[-0.02em] text-ink">
                Every feature, side by side
              </h3>
            </div>
            {/* NOT bled to the true viewport edge — the sticky "Features"
                column sits at `left: 0` of the scroll container, and on real
                phones (screen curvature, safe-area insets, browser chrome)
                content flush against the true edge can get a sliver clipped,
                which is exactly visible on sticky content since it never
                scrolls away from that edge. Keeping the section's normal
                padding here trades a bit of table width for that margin. */}
            <CompareFeaturesTable
              plans={plans}
              groups={groups}
              showPopularBadge={showPopularBadge}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
