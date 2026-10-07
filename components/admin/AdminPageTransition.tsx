"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Wraps page content with a smooth fade + subtle upward-slide entrance.
 * Re-triggers on every pathname change via the `key` prop so each new
 * page plays the enter animation.  The header lives outside this wrapper
 * (in AdminLayout) so it stays visually persistent across navigations.
 */
export default function AdminPageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 7 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease }}
    >
      {children}
    </motion.div>
  );
}
