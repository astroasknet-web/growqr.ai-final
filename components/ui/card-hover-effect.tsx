"use client";

import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Children, isValidElement, useState, type ReactNode } from "react";

interface HoverEffectProps {
  /** Cards to render. Each becomes hoverable; the backdrop slides between them. */
  children: ReactNode;
  className?: string;
  /** Tailwind classes for the animated hover backdrop (colour, blur, etc.). */
  backdropClassName?: string;
  /** Tailwind inset utility for how far the backdrop overflows each card. */
  inset?: string;
  /** Rounded radius for the backdrop. */
  radius?: string;
  /** Extra classes applied to each child's hover wrapper (e.g. flex-shrink-0). */
  itemClassName?: string;
  /** Unique id so multiple HoverEffect groups on one page don't share layoutId. */
  groupId?: string;
}

/**
 * Aceternity-style hover backdrop. A single colored panel slides smoothly
 * between whichever card the cursor is over (via `layoutId` — Framer treats
 * both positions as the same element and animates between them).
 */
export function HoverEffect({
  children,
  className,
  backdropClassName = "bg-orange/15 blur-2xl",
  inset = "-inset-3",
  radius = "rounded-[30px]",
  itemClassName,
  groupId = "hoverBackdrop",
}: HoverEffectProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div className={cn(className)}>
      {items.map((child, i) => (
        <div
          key={i}
          className={cn("relative", itemClassName)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <AnimatePresence>
            {hovered === i && (
              <motion.div
                layoutId={groupId}
                className={cn(
                  "absolute block pointer-events-none",
                  inset,
                  radius,
                  backdropClassName
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.18 } }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.18, delay: 0.2 },
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 h-full">{child}</div>
        </div>
      ))}
    </div>
  );
}
