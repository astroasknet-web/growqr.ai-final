"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, QrCode, Link2, MousePointerClick, ExternalLink, ChevronsDown } from "lucide-react";
import { GROWQR_APP_URL } from "@/lib/growqr-profile";

const GROWQR_SIGNUP_URL = `${GROWQR_APP_URL}/sign-up`;

/**
 * The two ways an applicant can be stuck on the profile field, answered in one
 * row under the input: they have a profile but cannot find its link, or they
 * have no profile at all. Both used to be separate blocks of prose above and
 * below the input, which buried the harder of the two problems.
 *
 * Finding the link is the harder one, so it gets the panel. The URL is not
 * printed anywhere on the dashboard until the QR modal is open, and the badge
 * that opens that modal only slides into the navbar once you scroll. That
 * scroll is where people give up, so it is its own numbered step rather than a
 * parenthetical.
 *
 * The panel redraws the two things the user is hunting for (the orange RQ Score
 * pill and the link row under the QR) as small CSS replicas, so recognition is
 * visual rather than a description they have to translate.
 *
 * Opens on hover for mouse users and on click for touch, which is also what
 * makes it keyboard reachable. It is a full-width block inside the profile card
 * rather than a floating popover on purpose: the form shell sets
 * `overflow-hidden`, so anything anchored to the trigger and wide enough for
 * these visuals would be clipped at the card edge on mobile.
 */
export default function ProfileLinkHelp() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hover out is forgiving: leaving the trigger on the way to the panel should
  // not snap it shut mid-travel.
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        <button
          // Inside a <form>, so this must never default to submit.
          type="button"
          onClick={() => setOpen((v) => !v)}
          onFocus={() => setOpen(true)}
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          aria-expanded={open}
          aria-controls="growqr-profile-link-help"
          className="inline-flex items-center gap-1.5 rounded-md text-[12px] font-semibold text-orange transition hover:text-orange-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-orange/40"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Where do I find my link?
        </button>

        <span aria-hidden className="h-3 w-px bg-black/12" />

        <a
          href={GROWQR_SIGNUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 transition hover:text-ink"
        >
          No profile yet? Create one
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="growqr-profile-link-help"
            role="dialog"
            aria-label="How to find your GrowQR profile link"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 origin-top rounded-2xl border border-black/10 bg-white p-4 shadow-[0_24px_60px_-18px_rgba(17,24,39,0.28)]"
          >
            {/* Arrow, tucked under the trigger */}
            <span
              aria-hidden
              className="absolute -top-[7px] left-5 h-3 w-3 rotate-45 rounded-[2px] border-l border-t border-black/10 bg-white"
            />

            <p className="text-[12.5px] font-bold tracking-[-0.01em] text-ink">
              Your link lives on your dashboard
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-4">
              It is not printed on the page itself. Three steps to get it.
            </p>

            <ol className="mt-3 flex flex-col gap-3">
              <Step n={1} title="Open your GrowQR dashboard">
                <a
                  href={GROWQR_APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-orange-lighter px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-orange-dark transition hover:bg-orange-light"
                >
                  app.growqr.ai
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                </a>
              </Step>

              <Step n={2} title="Scroll down a little">
                <span className="flex items-center gap-1.5 text-[11px] text-ink-4">
                  <ChevronsDown className="h-3 w-3 shrink-0 text-orange" aria-hidden="true" />
                  The badge only appears once you start scrolling.
                </span>
                <span className="mt-2 flex">
                  <BadgeReplica />
                </span>
              </Step>

              <Step n={3} title="Click the badge, then copy the link">
                <span className="flex items-center gap-1.5 text-[11px] text-ink-4">
                  <MousePointerClick className="h-3 w-3 shrink-0 text-orange" aria-hidden="true" />
                  A QR pop-up opens. Your link sits under the code.
                </span>
                <span className="mt-2 flex">
                  <LinkRowReplica />
                </span>
              </Step>
            </ol>

            <p className="mt-3.5 border-t border-black/[0.07] pt-2.5 text-[11px] leading-relaxed text-ink-4">
              Paste it above and we will fill in the rest of this form for you.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One numbered row: orange counter in the gutter, content in the column. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-orange text-[10px] font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold leading-snug text-ink-2">{title}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </li>
  );
}

/**
 * Miniature of the navbar pill. Redrawn rather than screenshotted so it stays
 * crisp at any zoom and picks up the real brand orange.
 */
function BadgeReplica() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF7C42] to-[#FF6A2F] py-1 pl-1 pr-2.5 shadow-[0_4px_12px_-3px_rgba(255,106,47,0.6)]">
      <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] bg-white">
        <QrCode className="h-2.5 w-2.5 text-orange" aria-hidden="true" />
      </span>
      <span className="text-[7.5px] font-bold uppercase tracking-[0.14em] text-white">RQ Score</span>
      <span aria-hidden className="h-2.5 w-px bg-white/45" />
      <span className="text-[11px] font-bold leading-none text-white">79</span>
    </span>
  );
}

/** Miniature of the copyable link row that sits under the QR in the modal. */
function LinkRowReplica() {
  return (
    <span className="flex w-full items-center gap-2 rounded-full bg-black/[0.055] px-2.5 py-1.5">
      <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-ink-4">
        app.growqr.ai/p/1c15f7cc-6d3a-4f08...
      </span>
      <Link2 className="h-3 w-3 shrink-0 text-ink-3" aria-hidden="true" />
    </span>
  );
}
