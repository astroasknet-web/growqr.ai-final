"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { trackAppCta, trackAppCtaAndNavigate } from "@/lib/analytics";
import { useHomeMode } from "@/components/layout/HomeMode";
import { useCurrency, useIsLive } from "@/components/layout/CurrencyProvider";
import { useSeekerWaitlist } from "@/components/seeker/SeekerWaitlistModal";
import type { Currency } from "@/lib/currency";
import { Eyebrow, SectionHeading } from "./SectionHeader";
import CompareFeaturesModal from "./CompareFeaturesModal";
import CompareFeaturesInline from "./CompareFeaturesInline";
import { useIsMobile } from "@/lib/useIsMobile";

/**
 * Pricing — job-seeker plans for the landing page.
 *
 * Visual design adapted from the 21st.dev `pricing-card` component
 * (cards grid → "Most Popular" highlight → detailed comparison table), but
 * mapped to the site's light cream/ink/orange palette and to GrowQR's real
 * four-plan model (Free Forever, 7-Day Sprint, Monthly, Career Accelerator).
 * Unlike the source component (3 boolean-only tiers with a monthly/annually
 * toggle), these tiers are distinct durations and the comparison cells can be
 * a check, a dash, or a quantitative/text value (e.g. "10", "Unlimited",
 * "Blockchain-verified"), so a feature value is `boolean | string`. The
 * comparison table is grouped by section to match the pricing sheet.
 */

type Cell = boolean | string;
const APP_SIGNUP_URL = "https://app.growqr.ai/signup";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  /** Optional secondary price line, e.g. the effective monthly rate. */
  priceNote?: string;
  /** Who the plan is for (from the CSV "Who it's for" row). */
  audience: string;
  /** The CSV "You'll Achieve" outcome for this plan. */
  outcome: string;
  description: string;
  cta: string;
  popular?: boolean;
  /** Curated card highlights (the full list lives in the compare modal). */
  highlights: string[];
}

/**
 * Currency-specific price strings. India (INR) shows the sheet's rupee prices;
 * everyone else (USD) shows the dollar equivalents. `compareRow` is the verbatim
 * "Price" row for the compare modal. NOTE: USD amounts are launch placeholders,
 * pending confirmed dollar pricing.
 */
const PRICE_TABLE: Record<
  Currency,
  {
    free: string;
    sprint: string;
    monthly: string;
    accelerator: string;
    acceleratorNote: string;
    compareRow: [string, string, string, string];
  }
> = {
  INR: {
    free: "₹0",
    sprint: "₹699",
    monthly: "₹1,999",
    accelerator: "₹4,999",
    acceleratorNote: "approx. ₹1,666/mo",
    compareRow: ["₹0 Forever", "₹699 Once", "₹1,999 / Mo", "₹4,999 / Qtr (≈₹1,666/Mo)"],
  },
  USD: {
    free: "$0",
    sprint: "$9",
    monthly: "$24",
    accelerator: "$59",
    acceleratorNote: "approx. $20/mo",
    compareRow: ["$0 Forever", "$9 Once", "$24 / Mo", "$59 / Qtr (≈$20/Mo)"],
  },
};

/** Plan content that never changes with currency (prices are merged in below). */
type PlanBase = Omit<Plan, "price" | "priceNote">;

const PLAN_BASE: PlanBase[] = [
  {
    id: "free",
    name: "Free Forever",
    period: "forever",
    audience: "Aspirants",
    outcome: "Self-Audit",
    description: "Assess your Starting Point.",
    cta: "Start Free",
    highlights: [
      "Real-time QR identity",
      "RQ Score: 1 free profile report",
      "1 verified skill badge",
      "Resume builder & cover letters: 1/day",
      "3 mock interviews (5 min)",
    ],
  },
  {
    id: "sprint",
    name: "7-Day Sprint",
    period: "one-time",
    audience: "Professionals",
    outcome: "Visibility Boost",
    description: "Move from Invisible to Visible in 7 Days.",
    cta: "Start the Sprint",
    highlights: [
      "RQ Score x2 + 5 verified skill badges",
      "5 resume templates, 5 resumes/day",
      "8 mock interviews (10 min)",
      "Shortlist + apply to 20 jobs",
      "Pay-per-session expert access",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    period: "/month",
    audience: "Growth Seekers",
    outcome: "Goal Track",
    description: "Goal Oriented Career-Progression in 30 Days.",
    cta: "Go Monthly",
    popular: true,
    highlights: [
      "RQ Score 4/month + 10 skill badges",
      "3 video resumes",
      "Unlimited resumes, cover letters & 16 mock interviews",
      "Auto-apply + auto social posting 4/week",
      "Weekly account manager check-in",
    ],
  },
  {
    id: "accelerator",
    name: "Career Accelerator",
    period: "/quarter",
    audience: "Executives",
    outcome: "Opportunity Leap",
    description: "Strategic Transformation from Opportunities in 90 Days.",
    cta: "Get Accelerator",
    highlights: [
      "Blockchain-verified identity + RQ Score 12",
      "20 skill badges & 9 video resumes",
      "Expert review on resumes, interviews & roleplays",
      "Expert-managed applications + brand strategy",
      "6 one-to-one expert sessions + 1:1 coaching",
    ],
  },
];

/** Merge the base plan content with the price strings for `currency`. */
function buildPlans(currency: Currency): Plan[] {
  const p = PRICE_TABLE[currency];
  return PLAN_BASE.map((base) => {
    switch (base.id) {
      case "free":
        return { ...base, price: p.free };
      case "sprint":
        return { ...base, price: p.sprint };
      case "monthly":
        return { ...base, price: p.monthly };
      case "accelerator":
        return { ...base, price: p.accelerator, priceNote: p.acceleratorNote };
      default:
        return { ...base, price: "" };
    }
  });
}

/**
 * Feature comparison, grouped by the CSV's sections. `values` align to PLANS
 * by index (Free, Sprint, Monthly, Accelerator). A cell is a check (true), a
 * dash (false), or a text value.
 */
interface FeatureRow {
  name: string;
  values: [Cell, Cell, Cell, Cell];
}
interface FeatureGroup {
  category: string;
  rows: FeatureRow[];
}

/**
 * Cell values are sourced from the pricing sheet. Every label and value is
 * title-cased for display consistency in the compare popup (typos in the
 * original sheet, e.g. "Unlimites"/"Sugesstions", are preserved as-is — only
 * capitalization was normalized).
 */
const BASICS_CATEGORY = "The Basics";

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    category: BASICS_CATEGORY,
    rows: [
      { name: "Price", values: ["₹0 Forever", "₹699 Once", "₹1,999 / Mo", "₹4,999 / Qtr (≈₹1,666/Mo)"] },
      { name: "Who It's For", values: ["Aspirants", "Professionals", "Growth Seekers", "Executives"] },
      { name: "You'll Achieve", values: ["Self-Audit", "Visibility Boost", "Goal Track", "Opportunity Leap"] },
    ],
  },
  {
    category: "Your Identity",
    rows: [
      { name: "Real-Time QR Identity", values: [true, true, true, "✓ Blockchain-Verified"] },
      { name: "RQ Score (Readiness Score)", values: ["1 Free Profile Report", "2", "4 (1/Week)", "12 (1/Week) + Expert Session"] },
      { name: "Verified Skill Badges", values: ["1", "5", "10", "20"] },
      { name: "Video Resume", values: [false, false, "3", "9"] },
      { name: "Background Check (On Blockchain)", values: [false, false, "Add-On Service", "✓ Included"] },
    ],
  },
  {
    category: "Get Ready",
    rows: [
      { name: "Resume Builder", values: ["1 Resume/ Day", "Unlock 5 Resume Template + 5 Resume/ Day", "Unlimited", "Unlimited + Expert Review"] },
      { name: "Cover Letters", values: ["1/Day", "5/ Day", "Unlimited", "Unlimited + Expert Review"] },
      { name: "AI Interview Simulation", values: ["3 Mock Interviews (5min)", "8 Mock Interviews (10 min)", "16 Mock Interviews (10mins)", "Unlimited + Expert Review"] },
      { name: "AI Roleplay Simulation", values: ["3 Roleplays", "8 Roleplays", "16 Roleplays", "Unlimited + Expert Review"] },
      { name: "Courses", values: ["1 Free Lesson", "Course Access + Assignment", "Learning Access + Assessment + Certification", "Life Time Access"] },
    ],
  },
  {
    category: "Get Hired",
    rows: [
      { name: "Job Matching + Smart Apply", values: ["Shortlist Upto 10 Jobs", "Shortlist + Apply Upto 20 Jobs", "Unlimites + Auto-Apply Job Applications", "Expert Managed Job Applications"] },
      { name: "Social Branding", values: ["Evaluate Your Brand Score", "Auto Sugesstions + Manual Post", "Auto Suggestions + Auto Post 4/Week (LinkedIn, Insta, YouTube)", "Auto Sugesstions + Auto Post 12/Week + Brand Strategy (LinkedIn, Insta, YouTube)"] },
      { name: "Events", values: ["View", "View + Join With Limited Access", "Join + Access To Networking", "Access To Networking + Invite To Exclusive Events"] },
      { name: "Experts", values: ["Browse", "Pay Per Session", "Member Rate", "6 Sessions 1:1"] },
    ],
  },
  {
    category: "Your Human + Coach",
    rows: [
      { name: "Account Manager (Weekly Check-In)", values: [false, false, "✓ 1/Week", "✓ 2/Week + 1:1 Coaching"] },
      { name: "AI Coach On WhatsApp / Email", values: ["Alerts", "Check -Ins", "Check- Ins + Updates", "Check- Ins + Updates"] },
      { name: "Rewards", values: [false, "1", "Weekly", "Weekly + Milestones"] },
      { name: "Streaks", values: ["2 Days Streak", "7 Days Streak", "30 Days Streak", "90 Days Streak"] },
    ],
  },
  {
    category: "How Much You Can Use",
    rows: [
      { name: "Practice Time", values: ["Upto 30 min", "Upto 2 hrs", "Upto 4 hrs", "Unlimited (Fair-Use)"] },
      { name: "Access To Services", values: ["Sampler", "All Services", "All Services", "All Services"] },
    ],
  },
];

/** Count of included (non-dash) features for a plan, excluding the basics rows. */
function includedCount(planIndex: number): number {
  return FEATURE_GROUPS.filter((g) => g.category !== BASICS_CATEGORY)
    .flatMap((g) => g.rows)
    .filter((r) => r.values[planIndex] !== false).length;
}

/** Feature groups with the "Price" comparison row filled in for `currency`. */
function buildFeatureGroups(currency: Currency): FeatureGroup[] {
  const priceRow = PRICE_TABLE[currency].compareRow;
  return FEATURE_GROUPS.map((g) =>
    g.category !== BASICS_CATEGORY
      ? g
      : {
          ...g,
          rows: g.rows.map((r) =>
            r.name === "Price" ? { ...r, values: priceRow } : r,
          ),
        },
  );
}

/**
 * Shown instead of an amount wherever subscriptions aren't live yet. USD
 * pricing is unconfirmed, so no dollar figure is published anywhere — cards,
 * compare-table headers, or the compare "Price" row.
 */
const UNPRICED_LABEL = "Coming soon";

/** Replace the "Price" row values with `UNPRICED_LABEL`, one per plan. */
function withoutComparePrices(groups: FeatureGroup[]): FeatureGroup[] {
  const unpriced: FeatureRow["values"] = [
    UNPRICED_LABEL,
    UNPRICED_LABEL,
    UNPRICED_LABEL,
    UNPRICED_LABEL,
  ];
  return groups.map((g) =>
    g.category !== BASICS_CATEGORY
      ? g
      : {
          ...g,
          rows: g.rows.map((r) =>
            r.name === "Price" ? { ...r, values: unpriced } : r,
          ),
        },
  );
}

export default function Pricing() {
  // These are the individual job-seeker plans, so hide the whole section when
  // the Hero toggle is set to Enterprise.
  const { mode } = useHomeMode();
  const currency = useCurrency();
  const isLive = useIsLive();
  const { openWaitlist } = useSeekerWaitlist();
  const [compareOpen, setCompareOpen] = useState(false);
  // Below `md`, the compare table opens inline in the page instead of the
  // fixed-overlay modal — see CompareFeaturesInline for why.
  const isMobile = useIsMobile();
  if (mode === "enterprise") return null;

  // US subscriptions aren't live yet — every plan CTA becomes a waitlist
  // signup instead of routing to the app for USD visitors.
  const isWaitlist = !isLive;

  // Resolve prices for the visitor's currency (server-detected, no flicker).
  const plans = buildPlans(currency);
  const groups = buildFeatureGroups(currency);

  // Until USD pricing is live, the compare surface shows "Coming soon" in place
  // of every amount. The cards keep `popular` (ring + scale + filled CTA are the
  // focal point) but withhold the badge — nothing claims a plan is popular
  // before launch. See UNPRICED_LABEL.
  const comparePlans = isWaitlist
    ? plans.map((p) => ({ ...p, price: UNPRICED_LABEL }))
    : plans;
  const compareGroups = isWaitlist ? withoutComparePrices(groups) : groups;

  return (
    <section
      id="pricing"
      className="relative isolate overflow-hidden bg-white border-y border-black/5 py-20 md:py-28 px-5 sm:px-8 md:px-14"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <Reveal>
          <div className="mx-auto text-center">
            <Eyebrow center>Pricing</Eyebrow>
            <SectionHeading className="md:whitespace-nowrap">
              Pick the Plan That Fits Your <span className="text-orange">Goals</span>.
            </SectionHeading>
          </div>
        </Reveal>

        {/* Pricing cards — below lg this is a swipeable snap-rail with the next
            card peeking (so plans aren't squeezed together); at lg it's the
            approved 4-up grid, unchanged. */}
        <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-3 md:mt-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5 sm:-mx-8 sm:px-8 md:-mx-14 md:px-14 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0">
          {plans.map((plan, i) => {
            const highlights = plan.highlights;
            const extra = includedCount(i) - highlights.length;

            return (
              <div
                key={plan.id}
                className={
                  "relative flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col rounded-3xl bg-white p-6 transition-all duration-300 sm:w-[60vw] sm:p-7 lg:w-auto lg:max-w-none lg:shrink " +
                  (plan.popular
                    ? "ring-1 ring-orange/30 shadow-card lg:scale-[1.03]"
                    : "border border-black/[0.07] shadow-card hover:shadow-soft")
                }
              >
                {plan.popular && !isWaitlist && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                    Most Popular
                  </span>
                )}

                <span className="inline-flex w-fit items-center rounded-full bg-orange-lighter px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-orange-deep">
                  For {plan.audience}
                </span>

                <h3 className="mt-3 text-[20px] font-semibold tracking-[-0.01em] text-ink">
                  {plan.name}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.45] text-ink-3 min-h-[42px]">
                  {plan.description}
                </p>

                <p className="mt-2.5 text-[13px] font-medium text-ink-3">
                  You&apos;ll achieve{" "}
                  <span className="font-semibold text-orange-deep">{plan.outcome}</span>
                </p>

                {/* "Coming soon" is a state, not a price — it sits at the muted
                    weight rather than the 40px bold of a real amount, which
                    would both overflow the card and read as a headline number.
                    Every card shows it in the USD view, so they still align. */}
                <div className="mt-5 flex min-h-[48px] items-baseline gap-1.5">
                  {isWaitlist ? (
                    <span className="text-[20px] font-semibold tracking-[-0.01em] text-ink-3">
                      {UNPRICED_LABEL}
                    </span>
                  ) : (
                    <>
                      <span className="text-[40px] font-bold tracking-[-0.03em] text-ink">
                        {plan.price}
                      </span>
                      <span className="text-[14px] font-medium text-ink-4">
                        {plan.period}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-[12.5px] font-medium text-ink-4 min-h-[18px]">
                  {isWaitlist ? "" : plan.priceNote ?? ""}
                </p>

                <button
                  type="button"
                  onClick={
                    isWaitlist
                      ? () => {
                          trackAppCta({
                            ctaLabel: plan.cta,
                            ctaLocation: `landing_pricing_${plan.id}`,
                            ctaAction: "waitlist",
                          });
                          openWaitlist("homepage-pricing");
                        }
                      : () =>
                          trackAppCtaAndNavigate({
                            ctaLabel: plan.cta,
                            ctaLocation: `landing_pricing_${plan.id}`,
                            destinationUrl: APP_SIGNUP_URL,
                          })
                  }
                  className={
                    "mt-6 w-full rounded-xl py-3 text-[15px] font-semibold transition-all duration-200 " +
                    (plan.popular
                      ? "bg-orange text-white hover:bg-orange-dark"
                      : "bg-cream-2 text-ink hover:bg-cream-3 border border-black/[0.06]")
                  }
                >
                  {isWaitlist ? "Join the Waitlist" : plan.cta}
                </button>

                <div className="mt-7 h-px w-full bg-black/[0.06]" />

                <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.12em] text-ink-4">
                  Includes
                </p>
                <ul className="mt-3.5 flex flex-col gap-3">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#16A34A]">
                        <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
                      </span>
                      <span className="text-[14px] leading-snug text-ink-2">{h}</span>
                    </li>
                  ))}
                  {extra > 0 && (
                    <li className="pl-[30px]">
                      <button
                        type="button"
                        onClick={() => setCompareOpen(true)}
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange transition-colors hover:text-orange-dark focus-visible:outline-none focus-visible:underline"
                      >
                        + {extra} more {extra === 1 ? "feature" : "features"}
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Compare every feature — opens a modal on desktop/tablet, or
            expands inline on mobile (see CompareFeaturesInline). */}
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => setCompareOpen((v) => !v)}
            aria-expanded={isMobile ? compareOpen : undefined}
            className="cta-shine group inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-dark hover:shadow-[0_12px_28px_-12px_rgba(255,106,47,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
          >
            {isMobile && compareOpen ? "Hide comparison" : "Compare every feature"}
            <ArrowRight
              className={
                "h-4 w-4 transition-transform duration-200 " +
                (isMobile && compareOpen ? "rotate-90" : "group-hover:translate-x-0.5")
              }
            />
          </button>
        </div>

        {isMobile && (
          <CompareFeaturesInline
            open={compareOpen}
            plans={comparePlans}
            groups={compareGroups}
            showPopularBadge={!isWaitlist}
          />
        )}
      </div>

      {!isMobile && (
        <CompareFeaturesModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          plans={comparePlans}
          groups={compareGroups}
          showPopularBadge={!isWaitlist}
        />
      )}
    </section>
  );
}
