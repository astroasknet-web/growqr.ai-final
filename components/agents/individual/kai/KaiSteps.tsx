"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import {
  MessagesSquare,
  Users,
  Video,
  Sparkles,
  Check,
  Mic,
  Handshake,
  Flame,
  Presentation,
  Briefcase,
} from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";
import { Ring } from "@/components/agents/directory/AgentShowcase";

/* RQ-Kai — the Roleplay Coach. Four "How It Works" steps, each a FeatureRow with a
   minimal, premium mockup panel following the shared recipe. RQ-Kai sells
   confidence: rehearse the hard conversations before they happen. */

function Panel({ gradient, children }: { gradient: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-[28px] bg-gradient-to-br ${gradient} p-4 shadow-soft sm:p-6 md:p-10`}>
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">{children}</div>
    </div>
  );
}

/* ── 1. Choose a scenario ────────────────────────────────────────────────── */
function ScenarioPanel() {
  const scenarios = [
    { label: "Negotiation", Icon: Handshake, selected: true },
    { label: "Difficult talk", Icon: Flame, selected: false },
    { label: "Client meeting", Icon: Briefcase, selected: false },
    { label: "Presentation", Icon: Presentation, selected: false },
  ];
  return (
    <Panel gradient="from-blue-200 via-blue-100 to-sky-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Choose a scenario</h4>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {scenarios.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 ${
              s.selected
                ? "border-orange/40 bg-orange-lighter/70"
                : "border-black/[0.07] bg-cream-2/60"
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                s.selected ? "bg-orange text-white" : "bg-white text-ink-3"
              }`}
            >
              <s.Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="text-[13px] font-semibold text-ink">{s.label}</span>
            {s.selected && (
              <span className="ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange text-white">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-black/[0.07] bg-cream/60 px-4 py-3">
        <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-4">Difficulty</span>
        <span className="rounded-full bg-orange px-3 py-1 text-[12px] font-bold text-white">Realistic</span>
      </div>
    </Panel>
  );
}

export function KaiScenario() {
  return (
    <FeatureRow
      agentName="RQ-Kai"
      Icon={MessagesSquare}
      label="Choose a scenario"
      heading={
        <>
          Practice the Talks
          <br />
          <span className="text-orange">That Matter</span>
        </>
      }
      description="Rehearse negotiations, tough feedback, client meetings, and the moments you cannot afford to fumble."
      cta="Pick a scenario"
      ctaSolid
      visual={<ScenarioPanel />}
    />
  );
}

/* ── 2. Pick your AI coach ───────────────────────────────────────────────── */
type Coach = { name: string; style: string; img: string; selected?: boolean };

function CoachPanel() {
  const coaches: Coach[] = [
    { name: "Payal", style: "Supportive", img: "/agent-subpage/sample/payal.jpg", selected: true },
    { name: "Emma", style: "Direct", img: "/agent-subpage/sample/emma.jpg" },
    { name: "John", style: "Challenging", img: "/agent-subpage/sample/john.jpg" },
  ];
  const levels = ["Easy", "Medium", "Hard"];
  return (
    <Panel gradient="from-sky-200 via-sky-100 to-cyan-200">
      <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">Pick your coach</h4>
      <div className="mt-5 space-y-2.5">
        {coaches.map((c) => (
          <div
            key={c.name}
            className={`flex items-center gap-3 rounded-xl border p-2.5 ${
              c.selected
                ? "border-orange/40 bg-orange-lighter/70"
                : "border-black/[0.07] bg-cream-2/60"
            }`}
          >
            <Image
              src={c.img}
              alt={c.name}
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.25)]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-tight text-ink">{c.name}</p>
              <p className="text-[12px] text-ink-4">{c.style}</p>
            </div>
            {c.selected && (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange text-white">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Difficulty</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl bg-cream-2 p-1">
          {levels.map((l) => (
            <span
              key={l}
              className={`rounded-lg py-2 text-center text-[12.5px] font-semibold ${
                l === "Medium" ? "bg-white text-ink shadow-card" : "text-ink-4"
              }`}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function KaiCoach() {
  return (
    <FeatureRow
      agentName="RQ-Kai"
      reverse
      Icon={Users}
      label="Pick your coach"
      heading={
        <>
          Set the Room to
          <br />
          <span className="text-orange">Match Reality</span>
        </>
      }
      description="Choose a persona and difficulty so every rehearsal feels as real as the moment you are preparing for."
      cta="Choose my coach"
      visual={<CoachPanel />}
    />
  );
}

/* ── 3. Practice naturally ───────────────────────────────────────────────── */
function LiveCallPanel() {
  const bars = [10, 18, 30, 22, 38, 28, 44, 26, 34, 16];
  return (
    <Panel gradient="from-purple-200 via-purple-100 to-violet-200">
      <div className="relative overflow-hidden rounded-2xl bg-ink p-5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Live
          </span>
          <span className="text-[12px] font-semibold text-white/60">04:12</span>
        </div>
        <div className="mt-6 flex flex-col items-center">
          <Image
            src="/agent-subpage/sample/john.jpg"
            alt="AI coach"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-full object-cover ring-4 ring-white/15"
          />
          <p className="mt-3 text-[14px] font-bold text-white">John · Hiring Manager</p>
          <div className="mt-4 flex h-8 items-center gap-1">
            {bars.map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-orange"
                style={{ height: `${h}px`, opacity: 0.5 + (h / 44) * 0.5 }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-black/[0.07] bg-cream/60 p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">Live transcript</div>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
          &ldquo;Walk me through how you would handle the pushback.&rdquo;
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-xl bg-cream-2 p-1">
        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[12.5px] font-semibold text-ink shadow-card">
          <Mic className="h-3.5 w-3.5 text-orange" strokeWidth={2.4} aria-hidden /> Voice
        </span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-semibold text-ink-4">
          <Video className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden /> Video
        </span>
      </div>
    </Panel>
  );
}

export function KaiPractice() {
  return (
    <FeatureRow
      agentName="RQ-Kai"
      Icon={Video}
      label="Practice live"
      heading={
        <>
          Have a Real
          <br />
          <span className="text-orange">Conversation</span>
        </>
      }
      description="Talk it through by voice or video in real time, with RQ-Kai responding naturally like a real person."
      cta="Start practicing"
      visual={<LiveCallPanel />}
    />
  );
}

/* ── 4. Improve after every session ──────────────────────────────────────── */
function FeedbackPanel() {
  return (
    <Panel gradient="from-amber-200 via-amber-100 to-orange-200">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">
            Communication score
          </div>
          <p className="mt-1 text-[14px] font-semibold text-ink">Confident and clear under pressure</p>
        </div>
        <div className="relative shrink-0">
          <Ring value={88} size={64} stroke={7} color="#FF6A2F" />
          <span className="absolute inset-0 grid place-items-center text-[17px] font-bold text-ink">88</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">Strengths</div>
          <div className="mt-2 space-y-1.5">
            {["Clear structure", "Calm tone"].map((s) => (
              <p key={s} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} aria-hidden /> {s}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.07] bg-cream-2/60 p-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-4">To improve</div>
          <div className="mt-2 space-y-1.5">
            {["Ask more questions", "Slow the close"].map((s) => (
              <p key={s} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> {s}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-orange/25 bg-orange-lighter/70 p-4">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} aria-hidden />
        <p className="text-[13px] font-semibold leading-snug text-ink">
          Try pausing before your counteroffer to hold the room.
        </p>
      </div>
    </Panel>
  );
}

export function KaiImprove() {
  return (
    <FeatureRow
      agentName="RQ-Kai"
      reverse
      Icon={Sparkles}
      label="Get coached"
      heading={
        <>
          Leave Every
          <br />
          <span className="text-orange">Session Sharper</span>
        </>
      }
      description="Get a communication score and personalized coaching so you improve with every rehearsal."
      cta="See my feedback"
      visual={<FeedbackPanel />}
    />
  );
}
