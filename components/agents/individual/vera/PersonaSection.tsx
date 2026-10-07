"use client";

import Image from "next/image";
import { Users, Check } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

/* The interviewer personas a candidate can choose between, plus the short
   session-length selector. One example per row keeps the panel scannable and
   matches the other step visuals (Setup / Experience / Feedback). */
type Persona = {
  name: string;
  style: string;
  img?: string;
  initials?: string;
  tint?: string;
  selected?: boolean;
};

const PERSONAS: Persona[] = [
  {
    name: "Payal",
    style: "Friendly",
    img: "/agent-subpage/sample/payal.jpg",
    selected: true,
  },
  { name: "Emma", style: "Structured", img: "/agent-subpage/sample/emma.jpg" },
  { name: "John", style: "Calm & Probing", img: "/agent-subpage/sample/john.jpg" },
];

const DURATIONS = ["15 min", "30 min", "45 min"] as const;

function PersonaPanel() {
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-rose-200 via-rose-100 to-pink-200 p-4 shadow-soft sm:p-6 md:p-10">
      <div className="rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">
        <h4 className="text-lg font-bold tracking-[-0.01em] text-ink">
          Choose your interviewer
        </h4>

        {/* persona options */}
        <div className="mt-6 flex flex-col gap-3">
          {PERSONAS.map((p) => (
            <div
              key={p.name}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                p.selected
                  ? "bg-orange-lighter ring-2 ring-orange"
                  : "border border-black/10 bg-white"
              }`}
            >
              {p.img ? (
                <Image
                  src={p.img}
                  alt={p.name}
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-orange/25"
                />
              ) : (
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white"
                  style={{ background: p.tint }}
                >
                  {p.initials}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold leading-tight text-ink">
                  {p.name}
                </p>
                <p className="text-[12px] text-ink-4">{p.style}</p>
              </div>
              {p.selected && (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
              )}
            </div>
          ))}
        </div>

        {/* duration selector — short segmented control */}
        <div className="mt-6">
          <label className="text-[13px] font-medium text-ink-3">Duration</label>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl bg-cream-2 p-1.5">
            {DURATIONS.map((d) => (
              <span
                key={d}
                className={`rounded-lg py-2.5 text-center text-[13px] font-semibold transition-colors ${
                  d === "30 min"
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-ink-4"
                }`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PersonaSection() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      reverse
      Icon={Users}
      label="Interviewer & format"
      heading={
        <>
          Pick Your Interviewer
          <br />
          <span className="text-orange">&amp; Session Length</span>
        </>
      }
      description="Choose from multiple interviewer personas and set your practice duration."
      cta="Meet the personas"
      visual={<PersonaPanel />}
    />
  );
}
