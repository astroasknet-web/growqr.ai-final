"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { buildFaqSchema } from "@/lib/seo";
import { withAgentMarks } from "@/components/ui/AgentName";

export type FaqItem = { q: string; a: string };

type Props = {
  /** Centered heading, can include <span className="text-orange"> accent. */
  heading: ReactNode;
  items: FaqItem[];
};

export default function FAQ({ heading, items }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="relative bg-orange-light/40 px-6 py-20 md:px-14 md:py-28">
      <JsonLd data={buildFaqSchema(items)} />
      <div className="mx-auto max-w-[900px]">
        <div className="text-center">
          <h2 className="text-[30px] font-bold leading-[1.06] tracking-[-0.04em] text-ink sm:text-[36px] md:text-[52px]">
            {heading}
          </h2>
        </div>

        <div className="mt-12 md:mt-16">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="border-b border-ink/10">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left md:py-7"
                >
                  <span className="text-lg font-bold leading-snug text-ink md:text-xl">
                    {withAgentMarks(item.q)}
                  </span>
                  <ChevronDown
                    className={`h-6 w-6 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-orange" : "rotate-0 text-ink-4"
                    }`}
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] pb-6 opacity-100 md:pb-7" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[760px] text-[17px] leading-[1.7] text-ink-2 md:text-[18px]">
                      {withAgentMarks(item.a)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
