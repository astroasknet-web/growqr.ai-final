"use client";

import { Briefcase, ChevronDown, Sparkles } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

function Field({
  label,
  value,
  placeholder,
  isSelect,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  isSelect?: boolean;
}) {
  return (
    <div>
      <label className="text-[13px] font-medium text-ink-3">{label}</label>
      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <span className={value ? "text-ink" : "text-ink-4"}>
          {value ?? placeholder}
        </span>
        {isSelect && (
          <ChevronDown className="h-4 w-4 text-ink-4" strokeWidth={2} aria-hidden />
        )}
      </div>
    </div>
  );
}

function SetupPanel() {
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-blue-200 via-blue-100 to-sky-200 p-4 shadow-soft sm:p-6 md:p-10">
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">
          Enter your details
        </h4>

        <div className="mt-7 grid gap-6">
          <Field label="Job Role" value="Senior Software Developer" />
          <Field label="Experience Level" value="5+ years" isSelect />
          <Field label="Company" placeholder="Select company" isSelect />
        </div>

        <button
          type="button"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-colors hover:bg-orange-dark"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          Generate Interview
        </button>
      </div>
    </div>
  );
}

export default function SetupSection() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      Icon={Briefcase}
      label="Job role & company"
      heading={
        <>
          Choose Your Target Role
          <br />
          <span className="text-orange">&amp; Company</span>
        </>
      }
      description="We tailor every question to your exact role, company, and experience."
      cta="Tailor my interview"
      visual={<SetupPanel />}
    />
  );
}
