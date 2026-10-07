"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, AlertTriangle } from "lucide-react";
import EventPageContent from "@/features/events/components/sections/EventPageContent";
import type { EventFormPayload } from "@/features/events/actions/admin/createEvent";
import type { EventRow } from "@/features/events/types/event";

interface Props {
  open: boolean;
  form: EventFormPayload;
  onClose: () => void;
}

/** Convert the live form state into an EventRow-shaped object for the preview. */
function formToPreviewRow(form: EventFormPayload): EventRow {
  return {
    id: "__preview__",
    slug: form.slug || "preview",
    title: form.title,
    short_description: form.short_description || null,
    full_description: form.full_description || null,
    speaker_name: form.speaker_name || null,
    speaker_designation: form.speaker_designation || null,
    speaker_company: form.speaker_company || null,
    speaker_image: form.speaker_image || null,
    speaker_bio: form.speaker_bio || null,
    poster_url: form.poster_url || null,
    venue: form.venue || null,
    city: form.city || null,
    country: form.country || null,
    event_date: form.event_date || new Date().toISOString().split("T")[0],
    start_time: form.start_time || null,
    end_time: form.end_time || null,
    timezone: form.timezone || null,
    duration: form.duration || null,
    format: form.format || null,
    badge: form.badge || null,
    price: form.price || null,
    learnings: form.learnings ?? [],
    agenda: form.agenda ?? [],
    registration_limit: form.registration_limit ? Number(form.registration_limit) : null,
    is_active: form.is_active,
    event_mode: form.event_mode ?? "offline",
    meeting_url: form.meeting_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function EventPreviewModal({ open, form, onClose }: Props) {
  const previewRow = formToPreviewRow(form);

  /* Close on Escape key */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Lock body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="preview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Slide-over panel ── */}
          <motion.div
            key="preview-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.9 }}
            className="fixed inset-y-0 right-0 z-50 flex flex-col bg-white shadow-[−24px_0_80px_−8px_rgba(0,0,0,0.18)] w-full max-w-[1120px]"
            role="dialog"
            aria-modal="true"
            aria-label="Event preview"
          >

            {/* ── Admin banner ── */}
            <div className="shrink-0 h-[46px] border-b border-black/[0.07] bg-[#FAFAF8] flex items-center justify-between px-5 gap-4">
              {/* Left: label + status chips */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.13em] text-ink-4">
                  <Eye className="w-3.5 h-3.5" />
                  Admin Preview
                </div>

                <span className="h-3.5 w-px bg-black/10" />

                {!form.is_active ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-[3px] rounded-full">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Draft — not published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-[3px] rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Published
                  </span>
                )}

                {/* Slug preview */}
                {form.slug && (
                  <>
                    <span className="h-3.5 w-px bg-black/10 hidden sm:block" />
                    <span className="hidden sm:block text-[11.5px] text-ink-5 font-mono truncate max-w-[280px]">
                      /events/{form.slug}
                    </span>
                  </>
                )}
              </div>

              {/* Right: close */}
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-4 hover:text-ink hover:bg-black/[0.06] transition-all duration-150"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable event content ── */}
            <div className="flex-1 overflow-y-auto">
              <EventPageContent
                event={previewRow}
                isPreview
              />
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
