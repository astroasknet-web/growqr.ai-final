"use client";
import { useEffect, useState } from "react";

/**
 * Returns true when the viewport width is below the given breakpoint.
 *
 * SSR FIX: Always initialises to `false` on both server and client to prevent
 * hydration mismatches. Updates synchronously after mount. This avoids the
 * previous pattern where SSR returned false while the client immediately
 * returned true on mobile, causing a full hero re-render, layout shift,
 * and blank gaps in the hero orbit.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    // Set immediately after mount — no SSR mismatch
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
