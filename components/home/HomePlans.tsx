"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { BillingToggle, PlanGrid } from "@/components/pricing/PlanCards";

/** Home page packages: sits right under the opening section, above "Your Journey". id="pricing" keeps the footer's Pricing link working. */
export default function HomePlans() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="scroll-mt-24 border-y border-black/5 bg-cream-2 py-16 md:py-24" aria-labelledby="home-plans">
      <div className="mx-auto max-w-[1180px] px-5 text-center">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-ink-4">Pricing</p>
        <h2 id="home-plans" className="mx-auto mt-3 max-w-[16em] text-[clamp(2rem,4.2vw,3.2rem)] font-semibold leading-[1.07] tracking-tight text-ink">
          Pick the Plan That Fits Your <span className="text-orange">Goals</span>.
        </h2>
        <p className="mx-auto mt-4 max-w-[36em] text-[1.05rem] leading-relaxed text-ink-3">Start free. Upgrade when you want more courses, more practice and expert help.</p>
        <div className="mt-8"><BillingToggle yearly={yearly} onChange={setYearly} /></div>
      </div>
      <PlanGrid yearly={yearly} headingLevel={3} />
      <p className="px-5 text-center">
        <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink underline underline-offset-4">Compare every feature <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </p>
    </section>
  );
}
