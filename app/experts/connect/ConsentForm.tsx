"use client";

import { useState } from "react";

/** Consent checkbox + connect button. The button stays disabled until the
 *  expert ticks consent, then navigates to the existing OAuth start route. */
export default function ConsentForm({ expert }: { expert?: string }) {
  const [agreed, setAgreed] = useState(false);
  const href = `/api/google/connect${expert ? `?expert=${encodeURIComponent(expert)}` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-orange cursor-pointer"
        />
        <span className="text-[14px] leading-snug text-ink/80">
          I consent to connecting my calendar for booking management.
        </span>
      </label>

      <a
        href={agreed ? href : undefined}
        aria-disabled={!agreed}
        className={`group inline-flex items-center justify-center gap-2 rounded-full border border-orange bg-orange px-7 py-4 text-lg font-semibold text-white shadow-[0_6px_0_0_rgb(0,0,0)] transition-all duration-200 ${
          agreed
            ? "hover:bg-orange-dark hover:shadow-[0_4px_0_0_rgb(0,0,0)] hover:translate-y-0.5 active:translate-y-1"
            : "pointer-events-none opacity-45"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M21 12.5A9 9 0 1 1 12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 3.5h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Connect Google Calendar
      </a>
    </div>
  );
}
