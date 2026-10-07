"use client";

import { useRef } from "react";
import { useInView, type UseInViewOptions } from "framer-motion";

/**
 * Viewport trigger for animated SVG *children* (`motion.g`, `motion.path`,
 * `motion.circle`, `motion.rect`, …).
 *
 * SAFARI BUG — why this hook exists:
 * WebKit's `IntersectionObserver` never reports an intersection for SVG child
 * elements. Observing a `<g>` or `<rect>` yields `isIntersecting: false`
 * forever (verified on Safari 26.5: HTML boxes and the root `<svg>` fire
 * normally, `<g>` / `<rect>` never do). Blink computes intersections from the
 * SVG bounding box, so the same markup works in Chrome.
 *
 * Framer Motion's `whileInView` is built on IntersectionObserver, so
 * `whileInView` placed directly on a `motion.g` / `motion.path` silently never
 * fires in Safari and the element stays frozen on its `initial` state —
 * usually `opacity: 0`, i.e. invisible content, not just a missing animation.
 *
 * Fix: observe an HTML ancestor (or the root `<svg>`, which WebKit does
 * handle) and drive the SVG children from the returned flag via `animate`
 * instead of `whileInView`.
 *
 * ```tsx
 * const [ref, inView] = useSvgInView<HTMLDivElement>({ margin: "-80px" });
 * <div ref={ref}>
 *   <svg>
 *     <motion.g initial="hidden" animate={inView ? "show" : "hidden"} variants={v} />
 *   </svg>
 * </div>
 * ```
 */
export function useSvgInView<T extends Element>(options?: UseInViewOptions) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, ...options });
  return [ref, inView] as const;
}
