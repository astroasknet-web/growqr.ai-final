"use client";

import { motion } from "framer-motion";
import {
  Check,
  Upload,
  Download,
  ScanLine,
  Gauge,
  Target,
  Mail,
  LayoutTemplate,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { type Agent } from "@/lib/data";
import { AgentShowcase, Bar, Ring, type ShowcaseConfig } from "./AgentShowcase";

/* RQ-Mira — the Resume Expert. Visual showcase config + its UI mockups. */

const MIRA = "#7F77DD";

function TargetRoleMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col rounded-2xl bg-white p-4 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="text-[14px] font-bold tracking-[-0.01em] text-ink">Tailor Your Resume</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] font-medium text-ink-4">Target Role</div>
          <div className="mt-1 rounded-xl border border-black/10 px-3 py-2.5 text-[12.5px] font-semibold text-ink">
            Senior Product Manager
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-ink-4">Current Resume</div>
          <div className="mt-1 flex items-center gap-2.5 rounded-xl border border-dashed border-black/15 px-3 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${MIRA}1A` }}>
              <Upload className="h-4 w-4" style={{ color: MIRA }} />
            </span>
            <div className="leading-tight">
              <div className="text-[12px] font-semibold text-ink">Upload file</div>
              <div className="text-[10px] text-ink-4">PDF or DOCX</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-auto rounded-xl bg-orange py-2.5 text-center text-[12.5px] font-semibold text-white">
        Build My Resume
      </div>
    </div>
  );
}

function ResumeDraftMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col rounded-2xl bg-white p-4 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">James Carter</div>
          <div className="text-[10.5px] font-semibold" style={{ color: MIRA }}>Senior Product Manager</div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.06]">
          <Sparkles className="h-3.5 w-3.5" style={{ color: MIRA }} />
          <span className="text-[10px] font-bold text-ink">Tailored to role</span>
        </span>
      </div>

      <div className="mt-3 grid flex-1 grid-cols-[1.5fr_1fr] gap-4">
        {/* Experience — main column */}
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-4">Experience</div>
          <div className="mt-2 flex flex-col gap-2.5">
            {[0, 1].map((i) => (
              <div key={i}>
                <Bar w="62%" className="!h-2.5" />
                <div className="mt-1.5 space-y-1">
                  <Bar w="100%" /><Bar w="88%" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Skills — sidebar */}
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-4">Skills</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Strategy", "Roadmapping", "SQL", "Analytics"].map((s) => (
              <span key={s} className="rounded-md px-2 py-0.5 text-[9.5px] font-semibold" style={{ background: `${MIRA}14`, color: MIRA }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* One mini resume-template thumbnail. `variant` swaps the skeleton layout. */
function TemplateThumb({ variant, selected }: { variant: "header" | "sidebar" | "split"; selected?: boolean }) {
  return (
    <div
      className={`relative h-full aspect-[3/4] shrink-0 overflow-hidden rounded-lg bg-white p-2 ring-1 transition ${
        selected ? "ring-2 ring-orange shadow-[0_10px_22px_-12px_rgba(255,106,47,0.55)]" : "ring-black/[0.08]"
      }`}
    >
      {variant === "header" && (
        <div className="flex h-full flex-col gap-1">
          <div className="h-3 rounded" style={{ background: `${MIRA}33` }} />
          <Bar w="70%" /><Bar w="90%" /><Bar w="60%" /><Bar w="80%" />
        </div>
      )}
      {variant === "sidebar" && (
        <div className="flex h-full gap-1.5">
          <div className="w-1/3 rounded" style={{ background: `${MIRA}33` }} />
          <div className="flex flex-1 flex-col gap-1">
            <Bar w="90%" /><Bar w="70%" /><Bar w="85%" /><Bar w="60%" />
          </div>
        </div>
      )}
      {variant === "split" && (
        <div className="flex h-full flex-col gap-1">
          <Bar w="60%" className="!h-2.5" />
          <div className="flex flex-1 gap-1.5">
            <div className="flex flex-1 flex-col gap-1"><Bar w="90%" /><Bar w="75%" /></div>
            <div className="flex flex-1 flex-col gap-1"><Bar w="80%" /><Bar w="65%" /></div>
          </div>
        </div>
      )}
      {selected && (
        <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-orange text-white">
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
        </span>
      )}
    </div>
  );
}

function TemplatePickerMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col rounded-2xl bg-white p-4 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-bold tracking-[-0.01em] text-ink">Choose a Template</div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: MIRA }}>
          <LayoutTemplate className="h-3.5 w-3.5" /> 12 designs
        </span>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 items-stretch justify-center gap-2.5">
        <TemplateThumb variant="header" />
        <TemplateThumb variant="sidebar" selected />
        <TemplateThumb variant="split" />
        <TemplateThumb variant="header" />
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-lighter px-2.5 py-1.5 text-[11px] font-semibold text-orange-deep">
        <Sparkles className="h-3.5 w-3.5 shrink-0" /> Switch design in one click
      </div>
    </div>
  );
}

function ATSExportMockup() {
  return (
    <div className="flex h-[172px] w-full max-w-[460px] flex-col rounded-2xl bg-white p-4 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.28)] ring-1 ring-black/[0.05]">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative shrink-0">
          <Ring value={94} size={56} stroke={6} color="#16A34A" />
          <span className="absolute inset-0 grid place-items-center text-[13px] font-bold text-ink">94</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] font-bold text-ink">ATS Match Score</div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <Check className="h-3 w-3" strokeWidth={3} /> Strong
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {["Keywords matched", "Clean, parseable formatting"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-[11px] font-medium text-ink-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={3} /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-orange py-2.5 text-[12.5px] font-semibold text-white">
        <Download className="h-4 w-4" /> Download PDF
      </div>
    </div>
  );
}

export function MiraSheetContent({ agent }: { agent: Agent }) {
  const config: ShowcaseConfig = {
    agent,
    headline: "Meet RQ-Mira",
    valueProp:
      "Hand RQ-Mira your target role and she writes an ATS-tuned resume and cover letter, then lets you swap between designer templates in one click.",
    chips: [
      { icon: ScanLine, label: "ATS-Optimized" },
      { icon: LayoutTemplate, label: "Designer Templates" },
      { icon: Mail, label: "Cover Letters" },
    ],
    steps: [
      { n: 1, title: "Target Role", caption: "Add the role & your current resume.", bg: "from-[#FBD9C4] to-[#F4B488]", mockup: <TargetRoleMockup /> },
      { n: 2, title: "AI Drafts Resume", caption: "Role-tuned content, written for you.", bg: "from-[#D9D6F5] to-[#B3ADE6]", mockup: <ResumeDraftMockup /> },
      { n: 3, title: "Pick a Template", caption: "Switch the design in one click.", bg: "from-[#CFE0F7] to-[#A7C4ED]", mockup: <TemplatePickerMockup /> },
      { n: 4, title: "ATS Score & Export", caption: "Pass the scan, then download.", bg: "from-[#C2E8D6] to-[#94D2BA]", mockup: <ATSExportMockup /> },
    ],
    features: [
      { icon: FileCheck2, title: "ATS-Ready Resume", caption: "Built to clear automated screeners." },
      { icon: Gauge, title: "Resume Score & Fixes", caption: "A live score with exact improvements." },
      { icon: Target, title: "Role-Specific Optimization", caption: "Tailored to each job you target." },
      { icon: Mail, title: "Tailored Cover Letters", caption: "Matched to the role and company." },
    ],
    before: ["Generic, one-size resume", "Lost in the ATS", "No interview callbacks"],
    after: ["Role-tailored every time", "Passes ATS scans", "Callbacks start coming in"],
  };

  return <AgentShowcase config={config} />;
}
