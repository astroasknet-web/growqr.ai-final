"use client";

import Image from "next/image";
import { Video, Play, ArrowRight } from "lucide-react";
import FeatureRow from "@/components/agents/shared/FeatureRow";

function ExperiencePanel() {
  return (
    <div className="relative rounded-[28px] bg-gradient-to-br from-green-200 via-green-100 to-emerald-200 p-4 shadow-soft sm:p-6 md:p-10">
      {/* main interview card */}
      <div className="relative z-10 rounded-2xl bg-white p-5 shadow-card sm:p-7 md:p-8">
        <div className="flex items-center gap-2.5">
          <Image
            src="/agents/roadmaps/veera-interview.png"
            alt="RQ-Vera, your AI interviewer"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-orange/25"
          />
          <div>
            <p className="text-[14px] font-bold leading-tight text-ink">
              AI Interviewer
            </p>
            <p className="text-[12px] text-green-600">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500 align-middle animate-pulseDot" />
              Live now
            </p>
          </div>
        </div>

        {/* progress */}
        <div className="mt-7">
          <div className="flex items-center justify-between text-[12px] font-medium text-ink-4">
            <span>Question 3 of 8</span>
            <span>38%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-2">
            <div className="h-full w-[38%] rounded-full bg-orange" />
          </div>
        </div>

        {/* current question */}
        <div className="mt-6 rounded-xl border border-orange/20 bg-orange-lighter/60 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-deep">
            Current question
          </p>
          <p className="mt-2 text-[15px] font-semibold leading-snug text-ink">
            Tell me about yourself.
          </p>
        </div>

        <button
          type="button"
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-ink-2"
        >
          Next Question
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.5}
            aria-hidden
          />
        </button>
      </div>

      {/* floating questions card */}
      <div className="absolute -right-2 -top-3 z-20 hidden w-[200px] rotate-[3deg] rounded-2xl bg-white p-4 shadow-soft sm:block">
        <p className="text-[13px] font-bold text-ink">Questions</p>
        <div className="mt-3 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-100 text-green-600">
                <Play className="h-3 w-3 fill-current" aria-hidden />
              </span>
              <span className="h-2 flex-1 rounded-full bg-cream-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExperienceSection() {
  return (
    <FeatureRow
      agentName="RQ-Vera"
      Icon={Video}
      label="Interview"
      heading={
        <>
          A Realistic
          <br />
          <span className="text-orange">AI Interview</span> Experience
        </>
      }
      description="Face an AI interviewer that asks, listens, and follows up, as real as it gets."
      cta="Try a mock interview"
      visual={<ExperiencePanel />}
    />
  );
}
