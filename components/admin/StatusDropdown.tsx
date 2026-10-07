"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import StatusBadge, { STATUS_CONFIG, type AppStatus } from "./StatusBadge";

interface Props {
  applicationId: string;
  currentStatus: string;
  onUpdate?: (newStatus: string) => void;
}

export default function StatusDropdown({ applicationId, currentStatus, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:ring-offset-1 transition-colors disabled:opacity-40 cursor-pointer"
      >
        <StatusBadge status={currentStatus} />
        <ChevronDown className={`w-3 h-3 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 top-full mt-2 z-[100] bg-white border border-black/[0.12] rounded-xl min-w-[190px] py-1 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
          {Object.entries(STATUS_CONFIG).map(([key]) => (
            <button
              key={key}
              onClick={() => handleSelect(key as AppStatus)}
              role="option"
              aria-selected={key === currentStatus}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors hover:bg-orange/10 ${
                key === currentStatus ? "bg-orange/10" : ""
              }`}
            >
              <StatusBadge status={key} />
              {key === currentStatus && (
                <span className="ml-auto text-ink-3">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
