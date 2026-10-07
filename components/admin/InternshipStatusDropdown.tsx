"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, ExternalLink } from "lucide-react";
import { INTERNSHIP_STATUS_CONFIG, type InternshipStatus } from "./InternshipStatusBadge";

interface Props {
  applicationId: string;
  currentStatus: string;
  onUpdate?: (newStatus: string) => void;
}

type MenuPos = { left: number; top?: number; bottom?: number; maxHeight: number };

/**
 * The three statuses that email the candidate, and the subject the mail will
 * carry. Kept local rather than imported from lib/internship/status-email so
 * this client component never pulls the server-only send path (Resend, the
 * service-role client) into the browser bundle. The map is tiny and the source
 * of truth for what actually sends stays on the server; this is only what the
 * confirm dialog shows before the reviewer commits.
 */
const EMAILING_STATUS: Record<string, { label: string; subjectHint: string }> = {
  selected: { label: "Selected", subjectHint: "Update on your GrowQR internship application" },
  offer: { label: "Offer", subjectHint: "Your GrowQR internship offer" },
  rejected: { label: "Rejected", subjectHint: "Update on your GrowQR internship application" },
};

export default function InternshipStatusDropdown({ applicationId, currentStatus, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0, maxHeight: 320 });
  // A status change that emails the candidate parks here until the reviewer
  // confirms; everything else applies immediately, exactly as before.
  const [confirm, setConfirm] = useState<InternshipStatus | null>(null);
  const [emailChecked, setEmailChecked] = useState(true);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 9 statuses can be taller than the space below the trigger, especially
  // for rows near the bottom of the table. Flip the menu above the button
  // and cap its height to whatever room is actually available so it never
  // renders past the edge of the viewport with no way to reach the rest.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const margin = 6;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - r.bottom - margin;
    const spaceAbove = r.top - margin;
    const desired = 320;

    if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
      setPos({ top: r.bottom + margin, left: r.left, maxHeight: Math.max(120, Math.min(desired, spaceBelow)) });
    } else {
      setPos({ bottom: viewportHeight - r.top + margin, left: r.left, maxHeight: Math.max(120, Math.min(desired, spaceAbove)) });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  async function applyStatus(status: InternshipStatus, notify: boolean) {
    setLoading(true);
    try {
      await fetch("/api/admin/internship-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, status, ...(notify ? { notify: true } : {}) }),
      });
      onUpdate?.(status);
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  function handleSelect(status: InternshipStatus) {
    if (status === currentStatus) { setOpen(false); return; }
    setOpen(false);
    // A status that mails the candidate asks first; the box is pre-checked so a
    // confirm is one click, but a misclick can never send an email on its own.
    if (EMAILING_STATUS[status]) {
      setEmailChecked(true);
      setConfirm(status);
      return;
    }
    applyStatus(status, false);
  }

  const cfg = INTERNSHIP_STATUS_CONFIG[currentStatus as InternshipStatus] ?? INTERNSHIP_STATUS_CONFIG.new;

  const menu = open ? (
    <div
      ref={menuRef}
      role="listbox"
      style={{
        position: "fixed",
        left: pos.left,
        ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
        maxHeight: pos.maxHeight,
        zIndex: 9999,
      }}
      className="w-[210px] bg-white border border-black/[0.1] rounded-xl shadow-[0_6px_32px_rgba(0,0,0,0.12)] overflow-y-auto"
    >
      <div className="p-1.5">
        {Object.entries(INTERNSHIP_STATUS_CONFIG).map(([key, s]) => {
          const active = key === currentStatus;
          return (
            <button
              key={key}
              onClick={() => handleSelect(key as InternshipStatus)}
              role="option"
              aria-selected={active}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-left ${
                active ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
              }`}
            >
              <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${s.color}`} />
              <span className={`text-[13px] leading-none flex-1 ${active ? "font-semibold text-ink" : "font-medium text-ink-2"}`}>
                {s.label}
              </span>
              {active && <Check className="w-3.5 h-3.5 text-ink-3 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  const confirmMeta = confirm ? EMAILING_STATUS[confirm] : null;
  const confirmModal = confirm && confirmMeta ? (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40"
      onClick={() => !loading && setConfirm(null)}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-2xl border border-black/[0.1] shadow-[0_12px_48px_rgba(0,0,0,0.18)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[16px] font-bold text-ink">Move to {confirmMeta.label}</h3>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-black/[0.1] bg-cream/40 px-3.5 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={emailChecked}
            onChange={(e) => setEmailChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-orange"
          />
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-ink">Email the candidate</span>
            <span className="block text-[12.5px] text-ink-3 mt-0.5">&ldquo;{confirmMeta.subjectHint}&rdquo;</span>
            <a
              href={`/api/admin/internship-emails/preview?applicationId=${applicationId}&status=${confirm}`}
              target="_blank"
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-orange hover:underline mt-1.5"
            >
              Preview <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </label>

        <p className="mt-3 text-[12.5px] text-ink-4 leading-relaxed">
          Unchecking still changes the status, it just sends nothing.
        </p>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={() => setConfirm(null)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-ink-3 hover:text-ink transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => confirm && applyStatus(confirm, emailChecked)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-ink text-white text-[14px] font-semibold hover:bg-ink/90 transition-colors disabled:opacity-40"
          >
            {loading ? "Updating…" : "Update status"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="inline-block">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 group disabled:opacity-40 cursor-pointer focus:outline-none"
      >
        <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${cfg.color}`} />
        <span className="text-[13px] font-medium text-ink-2 leading-none group-hover:text-ink transition-colors">
          {cfg.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-ink-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {typeof window !== "undefined" && createPortal(
        <>
          {menu}
          {confirmModal}
        </>,
        document.body,
      )}
    </div>
  );
}
