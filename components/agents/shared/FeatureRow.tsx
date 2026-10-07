"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { withAgentMarks } from "@/components/ui/AgentName";
import { useEnterpriseContact } from "@/components/enterprise/EnterpriseContactModal";
import { useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import { AGENT_URL } from "@/lib/agentMedia";
import { trackAppCta } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

const textVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

type Props = {
  /** When true, the visual sits on the LEFT and text on the RIGHT. */
  reverse?: boolean;
  Icon: LucideIcon;
  label: string;
  heading: ReactNode;
  description: string;
  cta: string;
  /** Solid orange CTA vs. outline CTA. */
  ctaSolid?: boolean;
  visual: ReactNode;
  /** Agent key (e.g. "RQ-Kai") — routes the CTA to that agent's specific
   *  suite deep link via AGENT_URL, instead of the generic signup flow. */
  agentName: string;
};

export default function FeatureRow({
  reverse = false,
  Icon,
  label,
  heading,
  description,
  cta,
  ctaSolid = false,
  visual,
  agentName,
}: Props) {
  const reduce = useReducedMotion();
  const contact = useEnterpriseContact();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  // US subscriptions aren't live yet — keep the CTA's existing label but
  // trigger the waitlist modal instead of the dead-end link, for USD visitors.
  const isWaitlist = !contact.enabled && !isLive;
  const agentHref = AGENT_URL[agentName] ?? "https://app.growqr.ai/signup";

  const ctaClass = ctaSolid
    ? "group mt-9 inline-flex items-center gap-3 rounded-xl bg-orange py-4 pl-8 pr-6 text-[18px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,106,47,0.6)] transition-all hover:-translate-y-0.5 hover:bg-orange-dark"
    : "group mt-9 inline-flex items-center gap-3 rounded-xl border border-orange/40 bg-white py-4 pl-8 pr-7 text-[18px] font-bold text-orange transition-all hover:-translate-y-0.5 hover:border-orange hover:bg-orange-lighter";

  return (
    <section className="bg-white px-6 py-16 md:px-14 md:py-24">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* TEXT */}
        <motion.div
          variants={reduce ? undefined : textVariants}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-100px" }}
          className={`lg:max-w-[540px] ${reverse ? "lg:order-2 lg:ml-auto" : "lg:order-1"}`}
        >
          <span className="inline-flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.14em] text-orange-deep">
            <Icon className="h-[18px] w-[18px] text-orange" strokeWidth={2.5} aria-hidden />
            {label}
          </span>
          <h3 className="mt-5 text-[28px] font-bold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[34px] md:text-[44px]">
            {heading}
          </h3>
          <p className="mt-5 max-w-[440px] text-[17px] leading-[1.7] text-ink-2 sm:text-[19px]">
            {withAgentMarks(description)}
          </p>
          {contact.enabled ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({ ctaLabel: cta, ctaLocation: "agent_feature_row", ctaAction: "modal" });
                contact.openContact();
              }}
              className={ctaClass}
            >
              {withAgentMarks(cta)}
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
            </button>
          ) : isWaitlist ? (
            <button
              type="button"
              onClick={() => {
                trackAppCta({ ctaLabel: cta, ctaLocation: "agent_feature_row", ctaAction: "waitlist" });
                openWaitlist("agent-feature-row");
              }}
              className={ctaClass}
            >
              {withAgentMarks(cta)}
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
            </button>
          ) : (
            <a href={agentHref} className={ctaClass}>
              {withAgentMarks(cta)}
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
                aria-hidden
              />
            </a>
          )}
        </motion.div>

        {/* VISUAL */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className={`mx-auto w-full max-w-[460px] lg:max-w-none ${reverse ? "lg:order-1" : "lg:order-2"}`}
        >
          {visual}
        </motion.div>
      </div>
    </section>
  );
}
