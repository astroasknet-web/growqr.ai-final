"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import {
  Share2,
  ShieldCheck,
  Check,
  Gauge,
  Wand2,
  CalendarDays,
  PenLine,
  Copy,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";
import { Ring } from "@/components/agents/directory/AgentShowcase";

/** LinkedIn brand glyph (lucide dropped its brand icons). */
function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4z" />
    </svg>
  );
}

/* RQ-Nova — the Brand Builder. Six "How It Works" steps, each a FeatureRow with a
   minimal, premium mockup panel that follows the shared recipe:
   soft-gradient frame -> white card -> generous whitespace, very little text. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* One consistent profile identity used across the profile-focused steps, so
   the mockups clearly read as the user's own LinkedIn profile. */
const PROFILE = {
  name: "John Carter",
  title: "Product Marketing Manager",
  img: "/agent-subpage/sample/john.jpg",
};

function ProfileHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={PROFILE.img}
        alt={PROFILE.name}
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]"
      />
      <div className="min-w-0">
        <p className="text-[14px] font-bold leading-tight text-ink">{PROFILE.name}</p>
        <p className="text-[12px] text-ink-4">{PROFILE.title}</p>
      </div>
    </div>
  );
}

/* ── 1. Connect your LinkedIn ────────────────────────────────────────────── */
function ConnectPanel() {
  return (
    <Panel gradient="from-blue-200 via-blue-100 to-sky-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Connect your profile</h4>
      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#0A66C2] py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(10,102,194,0.6)]"
      >
        <LinkedInMark className="h-5 w-5" />
        LinkedIn Connected
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
        </span>
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-ink-4">
        <ShieldCheck className="h-4 w-4 text-emerald-500" strokeWidth={2.25} aria-hidden />
        Secure, read-only connection
      </p>
      <div className="mt-6 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="flex items-center justify-between text-[12px] font-medium text-ink-4">
          <span>Syncing profile</span>
          <span>100%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-2">
          <div className="h-full w-full rounded-full bg-emerald-500" />
        </div>
        <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> Import complete
        </p>
      </div>
    </Panel>
  );
}

export function NovaConnect() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      Icon={Share2}
      label="Connect"
      heading={
        <>
          Connect Your
          <br />
          <span className="text-orange">LinkedIn in a Click</span>
        </>
      }
      description="Link your profile and let RQ-Nova understand your professional brand right away."
      cta="Connect my profile"
      ctaSolid
      visual={<ConnectPanel />}
    />
  );
}

/* ── 2. Analyze your profile ─────────────────────────────────────────────── */
function ProfileAuditPanel() {
  const rows = [
    { label: "Headline", status: "Weak", tone: "bad" as const },
    { label: "About", status: "Needs work", tone: "warn" as const },
    { label: "Experience", status: "Good", tone: "good" as const },
    { label: "Skills", status: "Strong", tone: "good" as const },
  ];
  const dot = { bad: "bg-rose-500", warn: "bg-amber-500", good: "bg-emerald-500" };
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <div className="flex items-center justify-between gap-4">
        <ProfileHeader />
        <div className="relative shrink-0">
          <Ring value={62} size={60} stroke={7} color="#F59E0B" />
          <span className="absolute inset-0 grid place-items-center text-[16px] font-bold text-ink">62</span>
        </div>
      </div>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
        Profile score · Room to stand out
      </div>
      <div className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg bg-cream-2/70 px-3.5 py-2.5">
            <span className="text-[13px] font-medium text-ink-2">{r.label}</span>
            <span className="flex items-center gap-2 text-[12px] font-bold text-ink">
              <span className={`h-2 w-2 rounded-full ${dot[r.tone]}`} /> {r.status}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function NovaAudit() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      reverse
      Icon={Gauge}
      label="Profile audit"
      heading={
        <>
          Discover What&apos;s
          <br />
          <span className="text-orange">Limiting Your Profile</span>
        </>
      }
      description="RQ-Nova reviews your headline, about, experience, and skills, then reveals your highest-priority improvements."
      cta="Audit my profile"
      visual={<ProfileAuditPanel />}
    />
  );
}

/* ── 3. Improve with AI ──────────────────────────────────────────────────── */
function ImprovePanel() {
  return (
    <Panel gradient="from-purple-200 via-purple-100 to-violet-200">
      <div className="flex items-center justify-between gap-3">
        <ProfileHeader />
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Wand2 className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> AI rewrite
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-black/[0.07] bg-cream-2/60 p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Current</div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-4">Marketing Manager at a tech company</p>
        </div>
        <div className="rounded-xl border border-orange/25 bg-orange-lighter/70 p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-orange-deep">Improved</div>
          <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink">
            Growth Marketing Leader. I help SaaS teams turn content into pipeline.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange py-3 text-[14px] font-semibold text-white transition-colors hover:bg-orange-dark"
      >
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        Apply changes
      </button>
    </Panel>
  );
}

export function NovaImprove() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      Icon={Wand2}
      label="AI rewrites"
      heading={
        <>
          Sound Like the Expert
          <br />
          <span className="text-orange">You Already Are</span>
        </>
      }
      description="RQ-Nova rewrites your headline, about, and experience to position you as the obvious choice."
      cta="Improve my copy"
      visual={<ImprovePanel />}
    />
  );
}

/* ── 4. Plan your content ────────────────────────────────────────────────── */
function ContentPlanPanel() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const active = [0, 2, 4];
  return (
    <Panel gradient="from-rose-200 via-rose-100 to-pink-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Weekly content plan</h4>
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Themes</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Leadership", "Case studies", "Industry takes"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-orange/25 bg-orange-lighter px-3 py-1 text-[12px] font-semibold text-orange-deep"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
          <span>This week</span>
          <span>3 posts</span>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5">
          {week.map((d, i) => (
            <div
              key={i}
              className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold ${
                active.includes(i) ? "bg-orange text-white" : "bg-cream-2 text-ink-4"
              }`}
            >
              {d}
              {active.includes(i) && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function NovaPlan() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      reverse
      Icon={CalendarDays}
      label="Content strategy"
      heading={
        <>
          Plan a Week of
          <br />
          <span className="text-orange">Content in One Click</span>
        </>
      }
      description="RQ-Nova generates a themed weekly posting plan around your goals, so showing up never feels random."
      cta="Plan my content"
      visual={<ContentPlanPanel />}
    />
  );
}

/* ── 5. Generate ready-to-post content ───────────────────────────────────── */
function GeneratePanel() {
  return (
    <Panel gradient="from-green-200 via-green-100 to-emerald-200">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Ready to post</h4>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-lighter px-2.5 py-1 text-[11px] font-bold text-orange-deep">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> 3 variations
        </span>
      </div>
      <div className="mt-5 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-orange-deep">Hook</div>
        <p className="mt-1.5 text-[14px] font-semibold leading-snug text-ink">
          Most resumes get rejected in 7 seconds. Here&apos;s why.
        </p>
        <div className="mt-3 space-y-1.5">
          <span className="block h-2 w-full rounded-full bg-cream-3" />
          <span className="block h-2 w-11/12 rounded-full bg-cream-3" />
          <span className="block h-2 w-3/4 rounded-full bg-cream-3" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-2">
          Carousel idea
        </span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-white"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden /> Copy
        </button>
      </div>
    </Panel>
  );
}

export function NovaGenerate() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      Icon={PenLine}
      label="Content generation"
      heading={
        <>
          Create Posts
          <br />
          <span className="text-orange">In Real Time</span>
        </>
      }
      description="Generate hooks, posts, and carousel ideas in your voice, so writer's block never slows you down."
      cta="Generate content"
      visual={<GeneratePanel />}
    />
  );
}

/* ── 6. Grow your professional brand ─────────────────────────────────────── */
function GrowthPanel() {
  const bars = [30, 42, 38, 56, 70, 100];
  const chips = ["3× profile views", "6-week streak"];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between gap-3">
        <ProfileHeader />
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> Growing
        </span>
      </div>

      {/* hero impact card: rising trend + positive wins together */}
      <div className="mt-5 rounded-2xl bg-gradient-to-br from-orange/[0.08] to-orange/[0.02] p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-ink">+48%</span>
          <span className="text-[13px] font-semibold text-emerald-600">engagement this month</span>
        </div>
        <div className="mt-6 flex h-14 items-end gap-2">
          {bars.map((h, i) => {
            const peak = i === bars.length - 1;
            return (
              <div key={i} className="relative flex flex-1 flex-col items-center justify-end">
                {peak && (
                  <span className="absolute -top-6 right-0 whitespace-nowrap rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(255,106,47,0.8)] sm:right-auto">
                    +12k reach
                  </span>
                )}
                <span
                  className={`w-full rounded-t-md ${peak ? "bg-orange" : "bg-orange/25"}`}
                  style={{ height: `${h}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-ink shadow-[0_2px_8px_-4px_rgba(0,0,0,0.2)]"
            >
              <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} aria-hidden />
              {chip}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function NovaGrow() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      reverse
      Icon={TrendingUp}
      label="Brand growth"
      heading={
        <>
          Turn Views Into
          <br />
          <span className="text-orange">Recruiters and Clients</span>
        </>
      }
      description="Track your profile strength, posting consistency, and engagement as your presence compounds."
      cta="Track my growth"
      visual={<GrowthPanel />}
    />
  );
}
