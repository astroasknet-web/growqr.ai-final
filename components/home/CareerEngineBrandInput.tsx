"use client";

import { ArrowRight, BarChart3, Megaphone, UsersRound } from "lucide-react";
import { trackAppCta } from "@/lib/analytics";

const reportSignals = [
  {
    label: "Brand visibility",
    detail: "See how clearly your company stands out",
    icon: BarChart3,
    tone: "bg-[#FFF0E7] text-[#D95619]",
  },
  {
    label: "Employer reputation",
    detail: "Understand the signals shaping workforce trust",
    icon: UsersRound,
    tone: "bg-[#EDF6F1] text-[#2F8052]",
  },
  {
    label: "Communication reach",
    detail: "Find where your brand message can work harder",
    icon: Megaphone,
    tone: "bg-[#EEF3FA] text-[#3E6F9E]",
  },
] as const;

export default function BrandInputBody({ onContact }: { onContact: () => void }) {
  return (
    <div className="flex flex-col gap-7">
      <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_12px_34px_-30px_rgba(23,20,18,0.35)]">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <p className="text-[15px] font-semibold text-ink">Your brand report covers</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-4">
            A focused view of how your business is positioned and perceived.
          </p>
        </div>

        <div className="divide-y divide-black/[0.06] px-5">
          {reportSignals.map(({ label, detail, icon: Icon, tone }) => (
            <div key={label} className="flex items-center gap-4 py-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink">{label}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-4">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            trackAppCta({
              ctaLabel: "Check My Brand Standing",
              ctaLocation: "career_readiness_live_brand",
              ctaAction: "modal",
            });
            onContact();
          }}
          className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-orange px-6 py-[18px] text-[18px] font-semibold text-white transition-[background-color,box-shadow] duration-200 hover:bg-orange-dark hover:shadow-[0_14px_32px_-10px_rgba(255,106,47,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 md:text-[19px]"
        >
          Check My Brand Standing
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </button>
        <p className="text-center text-[13px] font-medium text-ink-4">
          Connect with our team to activate your brand report.
        </p>
      </div>
    </div>
  );
}
