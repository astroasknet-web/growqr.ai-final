"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { STATUS_CONFIG, type AppStatus } from "./StatusBadge";

interface Props {
  applicationId: string;
  currentStatus: string;
  onUpdate?: (newStatus: string) => void;
}

type MenuPos = { left: number; top?: number; bottom?: number; maxHeight: number };

export default function StatusDropdown({ applicationId, currentStatus, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0, maxHeight: 320 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the fixed menu below the trigger button, flipping above it (and
  // capping the height to whatever room is actually available) when there
  // isn't enough space below. Otherwise a row near the bottom of the table
  // renders a menu that runs off the edge of the viewport with no way to
  // reach the rest of it.
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

  // Close on outside click
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

  // Close on scroll so the menu doesn't float away from the button
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  async function handleSelect(status: AppStatus) {
    if (status === currentStatus) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, status }),
      });
      onUpdate?.(status);
    } finally {
      setLoading(false);
    }
  }

  const cfg = STATUS_CONFIG[currentStatus as AppStatus] ?? STATUS_CONFIG.pending;

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
        {Object.entries(STATUS_CONFIG).map(([key, s]) => {
          const active = key === currentStatus;
          return (
            <button
              key={key}
              onClick={() => handleSelect(key as AppStatus)}
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

      {typeof window !== "undefined" && createPortal(menu, document.body)}
    </div>
  );
}
