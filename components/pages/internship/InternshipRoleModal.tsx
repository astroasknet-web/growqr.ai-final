"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import { lockSmoothScroll, unlockSmoothScroll } from "@/lib/smoothScroll";
import { applyHref, type InternshipRole } from "./internship-data";

const EASE = [0.22, 1, 0.36, 1] as const;

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-4">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-orange/10">
              <Check className="h-3 w-3 text-orange" strokeWidth={3} aria-hidden />
            </span>
            <span className="text-[14.5px] leading-relaxed text-ink-2">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The full job description, in a centred modal sized to a readable measure
 * (720px) rather than a narrow side panel. The card itself already links to
 * the form, so this is the second read for candidates who want the detail
 * first, and it keeps them one click from the same Apply action.
 *
 * Rises from the bottom edge on phones, where a centred box would leave dead
 * margins on all four sides.
 */
export default function InternshipRoleModal({
  role,
  onClose,
}: {
  role: InternshipRole | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close, plus a scroll lock while open. Lenis needs pausing on top
  // of `overflow: hidden`, which alone doesn't stop it driving the page behind.
  useEffect(() => {
    if (!role) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    lockSmoothScroll();
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      unlockSmoothScroll();
    };
  }, [role, onClose]);

  const Icon = role?.icon;

  return (
    <AnimatePresence>
      {role && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-[5px]" onClick={onClose} aria-hidden />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`${role.title} internship, full job description`}
            data-lenis-prevent
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_40px_120px_-30px_rgba(15,23,42,0.5)] outline-none sm:max-h-[86vh] sm:max-w-[720px] sm:rounded-[24px]"
          >
            {/* Grab handle, phones only */}
            <span
              aria-hidden
              className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-black/12 sm:hidden"
            />

            {/* Header */}
            <header className="shrink-0 border-b border-black/[0.07] px-6 py-5 sm:px-9 sm:py-7">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close job description"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-black/[0.07] bg-white text-ink-3 transition hover:border-orange/30 hover:text-orange sm:right-5 sm:top-5"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-4 pr-12">
                {Icon && (
                  <span className="inline-grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange/8 text-orange">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[26px]">
                    {role.title} Intern
                  </h2>
                  <p className="mt-1.5 text-[12.5px] text-ink-4">
                    Remote, Noida office · 3 to 6 months · Reporting to {role.reportingTo}
                  </p>
                </div>
              </div>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-7 sm:px-9 sm:py-8">
              <div className="flex flex-col gap-8">
                <p className="text-[15.5px] leading-relaxed text-ink-2">{role.overview}</p>

                {role.tracks && (
                  <div className="rounded-2xl border border-black/[0.07] bg-cream/60 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-4">
                      Tracks we are hiring for
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {role.tracks.map((track) => (
                        <span
                          key={track}
                          className="rounded-full border border-black/[0.07] bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-2"
                        >
                          {track}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Section title="What you will do" items={role.responsibilities} />
                <div className="h-px bg-black/[0.06]" />
                <Section title="Who we are looking for" items={role.lookingFor} />
                <div className="h-px bg-black/[0.06]" />
                <Section title="What you will gain" items={role.gain} />

                <p className="text-[12.5px] leading-relaxed text-ink-4">
                  Stipend as per GrowQR internship policy.
                </p>
              </div>
            </div>

            {/* Sticky action */}
            <footer className="shrink-0 border-t border-black/[0.07] bg-white px-6 py-4 sm:px-9 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
                <Link
                  href={applyHref(role)}
                  className="flex items-center justify-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-orange-dark hover:shadow-[0_12px_28px_-10px_rgba(255,106,47,0.55)] sm:flex-1"
                >
                  Apply for {role.title} <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden rounded-full border border-black/[0.12] bg-white px-6 py-3.5 text-[14px] font-semibold text-ink-3 transition hover:border-black/25 hover:text-ink sm:block"
                >
                  Back to roles
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
