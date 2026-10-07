"use client";

import { BarChart3, Check, TrendingUp } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

function ScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "orange" | "green" | "ink";
}) {
  const barColor =
    tone === "green"
      ? "bg-green-500"
      : tone === "ink"
        ? "bg-ink"
        : "bg-orange";
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-ink-2">{label}</span>
        <span className="font-bold text-ink">{value}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-cream-2">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FeedbackPanel() {
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-purple-200 via-purple-100 to-violet-200 p-4 shadow-soft sm:p-6 md:p-8">
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">
        {/* candidate header */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://randomuser.me/api/portraits/men/41.jpg"
            alt="Candidate"
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-green-300"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight text-ink">
              Ethan Brooks
            </p>
            <p className="text-[13px] text-ink-4">Software Engineer</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-[12px] font-bold text-green-700">
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
            Great job!
          </span>
        </div>

        {/* two distinct stats — this session's Interview Score, and the living
            RQ-Score that increments after every interview */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {/* Interview Score — the result of this session */}
          <div className="rounded-2xl bg-green-50 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-green-700">
              Interview Score
            </p>
            <p className="mt-1 text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">
              86<span className="text-xl text-ink-4">/100</span>
            </p>
            <p className="mt-2 text-[12px] font-medium text-green-700">This session</p>
          </div>
          {/* RQ-Score — the living, branded score that grows over time */}
          <div className="rounded-2xl bg-orange-lighter px-5 py-4 ring-1 ring-orange/15">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-orange-deep">
              RQ-Score
            </p>
            <p className="mt-1 text-[40px] font-bold leading-none tracking-[-0.03em] text-orange">
              74<span className="text-xl text-ink-4">/100</span>
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-orange-deep ring-1 ring-orange/20">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
              +12
            </span>
          </div>
        </div>

        {/* sub-scores — all positive */}
        <div className="mt-6 grid gap-4">
          <ScoreBar label="Communication" value={88} tone="green" />
          <ScoreBar label="Confidence" value={82} tone="green" />
          <ScoreBar label="Technical" value={79} tone="green" />
        </div>

        {/* strengths chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {["Clear structure", "Strong examples", "Confident tone"].map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[12px] font-semibold text-green-700"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeedbackSection() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      reverse
      Icon={BarChart3}
      label="Instant feedback"
      heading={
        <>
          Get <span className="text-orange">Instant,</span>
          <br />
          <span className="text-orange">Honest</span> Feedback
        </>
      }
      description="See your scores, strengths, and exactly what to improve the moment you finish."
      cta="See sample feedback"
      visual={<FeedbackPanel />}
    />
  );
}
