"use client";

import { type ReactNode } from "react";
import { Palette, PenLine, Users, Megaphone, Globe, Check } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* RQ-Nova — the Brand Builder (B2B). Five "How It Works" cards in the shared
   zigzag FeatureRow layout, each paired with a minimal infographic panel.
   Nova sells one consistent brand voice across strategy, content, employer
   brand, communications, and reputation. Content sourced from the Nova sample. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">{children}</div>;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-cream-2 px-3 py-1 text-[12px] font-semibold text-ink-2">{children}</span>
  );
}

/* ── 1. Brand strategy ───────────────────────────────────────────────────── */
function StrategyPanel() {
  const swatches = ["#FF6A2F", "#1A1A1A", "#F5EFE6", "#1E40AF"];
  return (
    <Panel gradient="from-rose-200 via-rose-100 to-orange-200">
      <Label>Brand identity</Label>
      <h4 className="mt-1 text-lg font-bold tracking-[-0.01em] text-ink">Northwind</h4>
      <p className="text-[13px] font-semibold text-ink-3">Bold. Clear. Human.</p>

      <div className="mt-5">
        <Label>Voice</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>Confident</Chip>
          <Chip>Warm</Chip>
          <Chip>Direct</Chip>
        </div>
      </div>

      <div className="mt-5">
        <Label>Palette</Label>
        <div className="mt-2 flex gap-2">
          {swatches.map((c) => (
            <span
              key={c}
              className="h-8 w-8 rounded-lg ring-1 ring-black/[0.08]"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function NovaStrategy() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      Icon={Palette}
      label="Brand Strategy"
      heading={
        <>
          Build a Brand
          <br />
          <span className="text-orange">People Believe In</span>
        </>
      }
      description="Define a compelling brand identity, messaging, and positioning that differentiates your business."
      cta="Build Brand Strategy"
      ctaSolid
      visual={<StrategyPanel />}
    />
  );
}

/* ── 2. Thought leadership ───────────────────────────────────────────────── */
function LeadershipPanel() {
  return (
    <Panel gradient="from-violet-200 via-violet-100 to-fuchsia-200">
      <Label>Published article</Label>
      <h4 className="mt-1 text-lg font-bold leading-snug tracking-[-0.01em] text-ink">
        The Future of Work Is Already Here
      </h4>
      <p className="mt-1 text-[12.5px] font-semibold text-ink-4">By the CEO · 6 min read</p>

      <div className="mt-5 space-y-2">
        {["Executive article", "LinkedIn post", "Keynote script"].map((t) => (
          <div key={t} className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream-2/60 px-3 py-2.5">
            <span className="text-[13px] font-semibold text-ink">{t}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600">
              <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden /> Drafted
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function NovaLeadership() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      reverse
      Icon={PenLine}
      label="Thought Leadership"
      heading={
        <>
          Lead Conversations
          <br />
          <span className="text-orange">Shape Industries</span>
        </>
      }
      description="Create executive content, articles, speeches, and social posts that establish authority and trust."
      cta="Create Leadership Content"
      visual={<LeadershipPanel />}
    />
  );
}

/* ── 3. Employer brand ───────────────────────────────────────────────────── */
function EmployerPanel() {
  const stories = [
    { initials: "AM", name: "Alex Morgan", quote: "Growth here is real." },
    { initials: "SC", name: "Sam Carter", quote: "Best team I have worked with." },
  ];
  return (
    <Panel gradient="from-emerald-200 via-emerald-100 to-teal-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Employer brand</Label>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-600">
          <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden /> Great place to work
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {stories.map((s) => (
          <div key={s.name} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[12px] font-bold text-ink-2 ring-1 ring-black/[0.06]">
              {s.initials}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight text-ink">{s.name}</p>
              <p className="truncate text-[12.5px] text-ink-4">&ldquo;{s.quote}&rdquo;</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function NovaEmployer() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      Icon={Users}
      label="Employer Brand"
      heading={
        <>
          Become the
          <br />
          <span className="text-orange">Employer of Choice</span>
        </>
      }
      description="Showcase your culture, values, and employee stories to attract exceptional talent."
      cta="Strengthen Employer Brand"
      visual={<EmployerPanel />}
    />
  );
}

/* ── 4. Corporate communications ─────────────────────────────────────────── */
function CommsPanel() {
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-indigo-200">
      <Label>Announcement draft</Label>
      <h4 className="mt-1 text-lg font-bold tracking-[-0.01em] text-ink">Company Update: Q3 Milestones</h4>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-full rounded-full bg-cream-2" />
        <div className="h-2.5 w-[92%] rounded-full bg-cream-2" />
        <div className="h-2.5 w-[78%] rounded-full bg-cream-2" />
      </div>
      <div className="mt-5">
        <Label>Audience</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>All hands</Chip>
          <Chip>Press</Chip>
          <Chip>Investors</Chip>
        </div>
      </div>
    </Panel>
  );
}

export function NovaComms() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      reverse
      Icon={Megaphone}
      label="Corporate Communications"
      heading={
        <>
          Communicate with
          <br />
          <span className="text-orange">Clarity &amp; Confidence</span>
        </>
      }
      description="Draft internal announcements, PR content, stakeholder updates, and executive communications."
      cta="Create Communications"
      visual={<CommsPanel />}
    />
  );
}

/* ── 5. Reputation & visibility ──────────────────────────────────────────── */
function ReputationPanel() {
  const channels = ["LinkedIn", "Press", "Website"];
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Label>Total reach</Label>
          <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">2.4M</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-600">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> Sentiment positive
        </span>
      </div>
      <div className="mt-5 space-y-2">
        {channels.map((c) => (
          <div key={c} className="flex items-center gap-3 rounded-xl border border-black/[0.07] bg-cream-2/60 px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            <span className="flex-1 text-[13px] font-semibold text-ink">{c}</span>
            <span className="text-[12px] font-semibold text-ink-4">Growing</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function NovaReputation() {
  return (
    <FeatureRow
      agentName="RQ-Nova"
      Icon={Globe}
      label="Reputation & Visibility"
      heading={
        <>
          Grow Trust.
          <br />
          <span className="text-orange">Expand Reach.</span>
        </>
      }
      description="Strengthen your digital presence, monitor brand perception, and amplify your reputation across every channel."
      cta="Boost Brand Presence"
      visual={<ReputationPanel />}
    />
  );
}
