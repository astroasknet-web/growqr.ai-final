"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { Eyebrow, SectionHeading } from "./SectionHeader";
import JsonLd from "@/components/seo/JsonLd";
import { buildFaqSchema } from "@/lib/seo";
import { useHomeMode } from "@/components/layout/HomeMode";

/**
 * FAQ — common questions answered right before the final CTA, so visitors
 * resolve their last objections before converting.
 *
 * Editorial accordion: a single pointer icon + hairline dividers rather than the
 * generic bordered-card pattern, on a warm cream wash that continues the
 * PartnerStrip above and hands off into the CTA below.
 */

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is GrowQR?",
    a: "GrowQR is an AI-powered career growth platform that brings together specialized AI agents to help you build skills, strengthen your professional profile, prepare for opportunities, and accelerate your career, all in one intelligent ecosystem.",
  },
  {
    q: "What is RQ?",
    a: "RQ, or Readiness Quotient, is a measure of how prepared you are for your next career move. It brings together key signals across your skills, profile, experience, and career readiness to give you a clear view of where you stand and what to improve next.",
  },
  {
    q: "How is GrowQR different from ChatGPT?",
    a: "While ChatGPT is a general-purpose AI assistant, GrowQR combines specialized AI agents, career intelligence, and personalized workflows to support every stage of your career journey, from learning and branding to resumes, interviews, roleplays, and opportunity discovery.",
  },
  {
    q: "Who is GrowQR for?",
    a: "GrowQR is designed for students, job seekers, working professionals, career switchers, freelancers, and anyone looking to grow their skills, improve their employability, or advance their career.",
  },
  {
    q: "Do I need to use every AI agent?",
    a: "No. You can use a single agent for a specific need or combine multiple agents for an end-to-end career journey. Each agent is specialized, but they work together seamlessly to help you achieve your goals.",
  },
  {
    q: "Is my personal data used to train AI models?",
    a: "No. Your personal data is never used to train AI models. We follow strict PII (Personally Identifiable Information) handling practices, store only the minimum information required to deliver personalization and career guidance, and protect your data using enterprise-grade infrastructure hosted with AWS and Cloudflare.",
  },
];

const FAQS_ENTERPRISE: { q: string; a: string }[] = [
  {
    q: "How is GrowQR different from using ChatGPT or other AI tools?",
    a: "ChatGPT is a general-purpose AI assistant. GrowQR Business is a complete AI workforce platform where specialized AI agents collaborate across hiring, workforce development, operations, communication, analytics, and decision-making. Instead of prompting one AI for individual tasks, organizations activate role-specific AI experts that work together through structured workflows, delivering measurable business outcomes.",
  },
  {
    q: "Is GrowQR suitable for organizations of all sizes?",
    a: "Yes. Whether you're a startup, enterprise, educational institution, or recruitment agency, GrowQR scales to support your growth and evolving business needs.",
  },
  {
    q: "Do we need technical expertise to use GrowQR?",
    a: "No. GrowQR is designed with an intuitive experience, enabling teams to adopt AI quickly without requiring technical or AI expertise.",
  },
  {
    q: "Is our organizational data secure?",
    a: "Yes. Customer and employee data is never used to train AI models. We follow strict PII and privacy practices, collect only the minimum information required for platform functionality, and rely on enterprise-grade infrastructure powered by AWS and Cloudflare to help safeguard your data.",
  },
  {
    q: "Can we activate only the AI agents we need?",
    a: "Yes. Organizations can deploy the AI experts that match their priorities and expand their AI workforce as their needs evolve.",
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { mode } = useHomeMode();
  const faqs = mode === "enterprise" ? FAQS_ENTERPRISE : FAQS;

  return (
    <section className="relative px-6 md:px-14 py-20 md:py-28 bg-cream">
      <JsonLd data={buildFaqSchema(faqs)} />
      <div className="mx-auto max-w-[860px]">
        <div className="text-center">
          <Eyebrow center>FAQ</Eyebrow>
          <SectionHeading className="md:whitespace-nowrap xl:text-[58px]">
            Frequently asked <span className="text-orange">questions</span>.
          </SectionHeading>
        </div>

        <div className="mt-12 md:mt-16 border-t border-ink/[0.09]">
          {faqs.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="border-b border-ink/[0.09]">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    className="group flex w-full items-start justify-between gap-5 py-6 text-left md:py-7"
                  >
                    <span
                      className={`flex-1 text-[18px] font-semibold leading-snug tracking-[-0.01em] transition-colors md:text-[21px] ${
                        isOpen ? "text-ink" : "text-ink-2 group-hover:text-ink"
                      }`}
                    >
                      {item.q}
                    </span>
                    <span
                      className={`mt-0.5 shrink-0 transition-all duration-300 md:mt-1 ${
                        isOpen ? "rotate-90 text-orange" : "rotate-0 text-ink-4 group-hover:text-orange"
                      }`}
                      aria-hidden
                    >
                      <Icon icon="solar:alt-arrow-right-linear" className="h-[22px] w-[22px]" />
                    </span>
                  </button>
                </h3>

                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-7 pr-10 text-[15.5px] leading-[1.75] text-ink-3 md:text-[16.5px]">
                      {item.a}
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
