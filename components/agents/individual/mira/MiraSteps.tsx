"use client";

import { type ReactNode } from "react";
import {
  Briefcase,
  ChevronDown,
  Sparkles,
  LayoutTemplate,
  Gauge,
  Wand2,
  Check,
  Download,
  Layers,
  Target,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";
import { Ring } from "@/components/agents/directory/AgentShowcase";

/* RQ-Mira — the Resume Expert. The five "How It Works" steps, each a FeatureRow
   with a minimal, premium mockup panel. Panels follow the shared recipe:
   soft-gradient frame -> white card -> generous whitespace, very little text. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

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
      <label className="text-[12.5px] font-medium text-ink-3">{label}</label>
      <div className="mt-1 flex items-center justify-between rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[13.5px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <span className={value ? "text-ink" : "text-ink-4"}>{value ?? placeholder}</span>
        {isSelect && <ChevronDown className="h-4 w-4 text-ink-4" strokeWidth={2} aria-hidden />}
      </div>
    </div>
  );
}

/* ── 1. Target role ──────────────────────────────────────────────────────── */
function TargetRolePanel() {
  return (
    <Panel gradient="from-blue-200 via-blue-100 to-sky-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Target your role</h4>
      <div className="mt-3.5 grid gap-3">
        <Field label="Target Role" value="Product Designer" />
        <Field label="Company" placeholder="Add company" isSelect />
        <div>
          <label className="text-[12.5px] font-medium text-ink-3">Job Description</label>
          <div className="mt-1 flex flex-col gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2.5">
            <span className="h-1.5 w-full rounded-full bg-cream-3" />
            <span className="h-1.5 w-4/5 rounded-full bg-cream-3" />
          </div>
        </div>
        <Field label="Experience Level" value="3-5 years" isSelect />
      </div>
      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange py-2.5 text-[14.5px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-colors hover:bg-orange-dark"
      >
        <Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        Generate Resume
      </button>
    </Panel>
  );
}

export function MiraTargetRole() {
  return (
    <FeatureRow
      agentName="RQ-Mira"
      Icon={Briefcase}
      label="AI builds a resume"
      heading={
        <>
          Start With Your
          <br />
          <span className="text-orange">Dream Role</span>
        </>
      }
      description="Tell RQ-Mira the role you want and the AI builder shapes a resume designed for it."
      cta="Build my resume"
      ctaSolid
      visual={<TargetRolePanel />}
    />
  );
}

/* ── 2. Build a professional resume ──────────────────────────────────────── */

/** A tiny, realistic resume-layout preview used as a template thumbnail. */
function MiniResume({ variant }: { variant: "classic" | "sidebar" | "modern" }) {
  const line = (w: string, tone = "bg-cream-3") => (
    <span className={`block h-1 rounded-full ${tone}`} style={{ width: w }} />
  );
  return (
    <div className="aspect-[3/4] w-full overflow-hidden rounded-md bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      {variant === "sidebar" ? (
        <div className="flex h-full gap-1.5">
          <div className="flex w-1/3 flex-col gap-1 rounded-sm bg-ink/80 p-1.5">
            <span className="h-3 w-3 rounded-full bg-white/70" />
            <span className="mt-1 block h-1 w-full rounded-full bg-white/40" />
            <span className="block h-1 w-4/5 rounded-full bg-white/40" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 pt-1">
            {line("70%", "bg-ink/25")}
            {line("100%")}
            {line("90%")}
            {line("100%")}
            {line("60%")}
          </div>
        </div>
      ) : variant === "modern" ? (
        <div className="flex h-full flex-col">
          <div className="h-4 rounded-sm bg-orange/80" />
          <div className="mt-1.5 space-y-1">
            {line("60%", "bg-ink/25")}
            {line("100%")}
            {line("85%")}
          </div>
          <div className="mt-1.5 grid flex-1 grid-cols-2 gap-1.5">
            <div className="space-y-1">{line("100%")}{line("80%")}</div>
            <div className="space-y-1">{line("90%")}{line("70%")}</div>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-orange/50" />
            <span className="block h-1.5 w-1/2 rounded-full bg-ink/25" />
          </div>
          <div className="mt-0.5 space-y-1">
            {line("100%")}
            {line("95%")}
            {line("100%")}
            {line("80%")}
            {line("90%")}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatesPanel() {
  const templates = [
    { name: "Classic", variant: "classic" as const },
    { name: "Executive", variant: "sidebar" as const },
    { name: "Modern", variant: "modern" as const },
  ];
  return (
    <Panel gradient="from-purple-200 via-purple-100 to-violet-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Professional templates</h4>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <LayoutTemplate className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> 12 designs
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {templates.map((t, i) => (
          <div key={t.name} className="flex flex-col items-center gap-1.5">
            <div
              className={`relative w-full rounded-lg p-1 transition-colors ${
                i === 0 ? "bg-orange/10 ring-2 ring-orange" : "ring-1 ring-black/[0.06]"
              }`}
            >
              <MiniResume variant={t.variant} />
              {i === 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-orange text-white shadow-sm">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
              )}
            </div>
            <span
              className={`text-[11.5px] font-semibold ${
                i === 0 ? "text-ink" : "text-ink-4"
              }`}
            >
              {t.name}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-center justify-between rounded-xl bg-cream-2/60 px-4 py-2.5 text-[12.5px] font-semibold text-ink-3">
        Switch designs in one click
        <span className="text-orange-deep">Live editing</span>
      </p>
    </Panel>
  );
}

export function MiraBuildResume() {
  return (
    <FeatureRow
      agentName="RQ-Mira"
      reverse
      Icon={LayoutTemplate}
      label="Switch with one click"
      heading={
        <>
          Build a Resume
          <br />
          <span className="text-orange">Recruiters Shortlist</span>
        </>
      }
      description="Polished, professional templates you can switch in one click while you edit live."
      cta="See the templates"
      visual={<TemplatesPanel />}
    />
  );
}

/* ── 3. Analyze your resume ──────────────────────────────────────────────── */
function AnalyzePanel() {
  return (
    <Panel gradient="from-green-200 via-green-100 to-emerald-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Resume score</h4>
      <div className="mt-5 flex items-center gap-6">
        <div className="relative shrink-0">
          <Ring value={88} size={92} stroke={8} color="#16A34A" />
          <span className="absolute inset-0 grid place-items-center text-[24px] font-bold text-ink">88</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-cream-2/70 px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-ink-2">ATS Score</span>
            <span className="text-[14px] font-bold text-emerald-600">94</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-cream-2/70 px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-ink-2">Keyword Match</span>
            <span className="text-[14px] font-bold text-emerald-600">87%</span>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Missing skills</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["GraphQL", "Figma", "A/B Testing"].map((s) => (
            <span
              key={s}
              className="rounded-full border border-orange/25 bg-orange-lighter px-3 py-1 text-[12px] font-semibold text-orange-deep"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700">
        <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> Add 3 keywords to reach 95+
      </p>
    </Panel>
  );
}

export function MiraAnalyze() {
  return (
    <FeatureRow
      agentName="RQ-Mira"
      Icon={Gauge}
      label="Resume analysis + ATS"
      heading={
        <>
          Discover What&apos;s
          <br />
          <span className="text-orange">Holding You Back</span>
        </>
      }
      description="An overall score, ATS rating, and keyword match show you exactly what to fix."
      cta="Analyze my resume"
      visual={<AnalyzePanel />}
    />
  );
}

/* ── 4. Improve with AI copilot ──────────────────────────────────────────── */
function CopilotPanel() {
  return (
    <Panel gradient="from-rose-200 via-rose-100 to-pink-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">AI Co-pilot</h4>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Wand2 className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Rewrite
        </span>
      </div>
      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-black/[0.07] bg-cream-2/60 p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Before</div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-4">Worked on the checkout and helped increase sales.</p>
        </div>
        <div className="rounded-xl border border-orange/25 bg-orange-lighter/70 p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-orange-deep">After</div>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink">
            Redesigned checkout flow, lifting conversion 23% in one quarter.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["Improve bullet", "Professional tone", "Quantify impact"].map((s) => (
          <span
            key={s}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-2"
          >
            {s}
          </span>
        ))}
      </div>
    </Panel>
  );
}

export function MiraCopilot() {
  return (
    <FeatureRow
      agentName="RQ-Mira"
      reverse
      Icon={Wand2}
      label="AI Co-pilot"
      heading={
        <>
          Improve Every Section
          <br />
          <span className="text-orange">With Precision</span>
        </>
      }
      description="Ask the Co-pilot to rewrite, tighten, or strengthen any line and watch the preview update live."
      cta="Try the Co-pilot"
      visual={<CopilotPanel />}
    />
  );
}

/* ── 5. Tailor every application (JD optimization) ───────────────────────── */
function TailorPanel() {
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Match to the job</h4>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-bold text-emerald-600">
          95% match
        </span>
      </div>

      {/* job description snippet */}
      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Job description
        </div>
        <p className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">
          Senior Product Designer · Stripe
        </p>
        <div className="mt-3 space-y-1.5">
          <span className="block h-2 w-full rounded-full bg-cream-3" />
          <span className="block h-2 w-5/6 rounded-full bg-cream-3" />
        </div>
      </div>

      {/* keywords added to match the JD */}
      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
          Keywords added
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Design systems", "A/B testing", "Roadmapping"].map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange/25 bg-orange-lighter px-3 py-1 text-[12px] font-semibold text-orange-deep"
            >
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> {s}
            </span>
          ))}
        </div>
      </div>

      {/* match meter */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
          <span>Match score</span>
          <span className="text-emerald-600">72% → 95%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-2">
          <div className="h-full w-[95%] rounded-full bg-emerald-500" />
        </div>
      </div>
    </Panel>
  );
}

export function MiraTailor() {
  return (
    <FeatureRow
      agentName="RQ-Mira"
      Icon={Target}
      label="Job description optimization"
      heading={
        <>
          Tailor Every
          <br />
          <span className="text-orange">Application</span>
        </>
      }
      description="Paste a job description and RQ-Mira tunes your resume to it, lifting your match score."
      cta="Tailor my resume"
      visual={<TailorPanel />}
    />
  );
}

/* ── 6. Apply with confidence (export & versions) ────────────────────────── */
function VersionsPanel() {
  const versions = [
    { company: "Stripe", role: "Product Designer", match: 96 },
    { company: "Notion", role: "Senior Designer", match: 91 },
    { company: "Linear", role: "Design Lead", match: 88 },
  ];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Your resume versions</h4>
        <Layers className="h-5 w-5 text-ink-4" strokeWidth={2} aria-hidden />
      </div>
      <div className="mt-5 space-y-3">
        {versions.map((v) => (
          <div
            key={v.company}
            className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange/15 text-[13px] font-bold text-orange">
              {v.company[0]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-tight text-ink">{v.company}</p>
              <p className="text-[12px] text-ink-4">{v.role}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
              {v.match}%
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-white">
              <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function MiraVersions() {
  return (
    <FeatureRow
      agentName="RQ-Mira"
      reverse
      Icon={Layers}
      label="Export Role-Specific Resumes"
      heading={
        <>
          Apply With
          <br />
          <span className="text-orange">Confidence</span>
        </>
      }
      description="Save a version per role and export a polished, ready-to-send resume in one click."
      cta="Export my resume"
      visual={<VersionsPanel />}
    />
  );
}
