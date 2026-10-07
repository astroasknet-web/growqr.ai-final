"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  why_join: string;
  why_fit: string;
  led_something: string;
  experience: string | null;
}

export default function ApplicationAnswers({ why_join, why_fit, led_something, experience }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    why_join: true,
    why_fit: false,
    led_something: false,
  });

  function toggleExpand(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const answers = [
    { key: "why_join", question: "Why do you want to join?", answer: why_join },
    { key: "why_fit", question: "What makes you a great fit?", answer: why_fit },
    {
      key: "led_something",
      question: "Led or organized something?",
      answer: led_something,
      additionalAnswer: experience,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-black/[0.1] shadow-card p-6">
      <h2 className="text-[15px] md:text-[16px] font-semibold text-ink mb-4">Application Answers</h2>

      <div className="space-y-2">
        {answers.map(({ key, question, answer, additionalAnswer }) => (
          <div key={key} className="border border-black/[0.08] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(key)}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-cream transition-colors cursor-pointer group"
            >
              <p className="text-[14px] md:text-[15px] font-semibold text-ink text-left">{question}</p>
              <ChevronDown
                className={`w-4 h-4 text-ink-3 shrink-0 transition-transform duration-200 ${
                  expanded[key] ? "rotate-180" : ""
                }`}
              />
            </button>

            {expanded[key] && (
              <div className="px-4 py-3 bg-cream border-t border-black/[0.06]">
                <p className="text-[14px] md:text-[15px] text-ink-2 leading-relaxed mb-2">{answer}</p>
                {additionalAnswer && (
                  <p className="text-[14px] md:text-[15px] text-ink-3 leading-relaxed italic">{additionalAnswer}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
