import { Fragment } from "react";
import { Check, Minus } from "lucide-react";

export type Cell = boolean | string;

export interface PlanLike {
  id: string;
  name: string;
  price: string;
  period?: string;
  popular?: boolean;
}

export interface FeatureRow {
  name: string;
  values: Cell[];
}

export interface FeatureGroup {
  category: string;
  rows: FeatureRow[];
}

/**
 * Renders text with any "(...)" phrase kept as a single non-breaking unit, so
 * long labels/values (e.g. "Background Check (On Blockchain)") wrap onto a
 * second line as a whole bracketed group instead of splitting mid-phrase.
 */
function wrapParens(text: string) {
  return text.split(/(\([^)]*\))/g).map((part, i) =>
    part.startsWith("(") && part.endsWith(")") ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Small green disc with a white checkmark — the "included" affordance. */
function CheckBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#16A34A] " +
        className
      }
      aria-label="Included"
    >
      <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
    </span>
  );
}

/** A single comparison-table cell: check, dash, or text value. */
function CellValue({ value }: { value: Cell }) {
  if (value === true) return <CheckBadge className="mx-auto" />;
  if (value === false)
    return (
      <Minus
        className="mx-auto h-4 w-4 text-ink-5/70"
        strokeWidth={2.5}
        aria-label="Not included"
      />
    );
  // CSV values that lead with "✓ " render the green badge + the text after it,
  // keeping the sheet's wording intact while matching the check styling.
  if (value.startsWith("✓ ")) {
    return (
      <span className="inline-flex items-center justify-center gap-1.5">
        <CheckBadge />
        <span className="text-[13px] font-semibold leading-snug text-ink-2">
          {wrapParens(value.slice(2))}
        </span>
      </span>
    );
  }
  return (
    <span className="text-[13px] font-semibold leading-snug text-ink-2">{wrapParens(value)}</span>
  );
}

/**
 * The pricing comparison table itself — shared between the desktop modal
 * (CompareFeaturesModal) and the mobile inline panel (CompareFeaturesInline)
 * so both stay in sync. Horizontally scrolls its own body; the first column
 * and header stay sticky while scrolling. A right-edge fade + "swipe" hint
 * (hidden at `lg` where the table fits without scrolling) signals that more
 * plan columns are off-screen on narrow viewports.
 */
export default function CompareFeaturesTable({
  plans,
  groups,
  showPopularBadge = true,
}: {
  plans: PlanLike[];
  groups: FeatureGroup[];
  /**
   * Withhold the "Most Popular" pill while keeping the column's orange
   * highlight — used where plans aren't live yet and nothing should claim a
   * plan is popular. Defaults to showing it.
   */
  showPopularBadge?: boolean;
}) {
  return (
    <>
      {/* No `overflow-hidden` on this wrapper — it would sit between the
          sticky cells below and their scroll container and break `position:
          sticky` (a known browser quirk). Rounding/border/clipping live on
          the scroll container itself instead; the fade overlay is a plain
          absolutely-positioned sibling. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-black/[0.07] bg-white shadow-card">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 sm:min-w-[720px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 w-[124px] min-w-[124px] [transform:translateZ(0)] border-b border-r border-black/[0.07] bg-white px-3 py-3 text-left align-bottom text-[13px] leading-snug font-bold text-ink sm:w-[240px] sm:min-w-[240px] sm:px-6 sm:py-4 sm:text-[14px]">
                Features
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={
                    "sticky top-0 z-20 min-w-[110px] px-2 py-3 text-center align-bottom sm:min-w-[150px] sm:px-5 sm:py-4 " +
                    (plan.popular
                      ? "border-x border-b border-orange/25 bg-gradient-to-b from-orange to-orange-dark"
                      : "border-b border-black/[0.07] bg-white")
                  }
                >
                  {plan.popular && showPopularBadge && (
                    <span className="mb-1.5 inline-block rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                      Most Popular
                    </span>
                  )}
                  <span
                    className={
                      "block text-[13px] font-bold leading-tight sm:text-[15px] " +
                      (plan.popular ? "text-white" : "text-ink")
                    }
                  >
                    {plan.name}
                  </span>
                  <span
                    className={
                      "mt-0.5 block text-[13px] font-bold sm:text-[15px] " +
                      (plan.popular ? "text-white" : "text-orange-deep")
                    }
                  >
                    {/^[₹$]\s?0$/.test(plan.price) ? "Free" : plan.price}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.category}>
                <tr>
                  <td
                    colSpan={plans.length + 1}
                    className="sticky left-0 z-10 [transform:translateZ(0)] border-y border-black/[0.06] bg-gradient-to-r from-cream-2 to-cream px-3 py-2.5 text-left text-[10.5px] font-bold uppercase tracking-[0.14em] text-orange-deep sm:px-6 sm:py-3 sm:text-[11px] sm:tracking-[0.16em] lg:static lg:text-center"
                  >
                    {group.category}
                  </td>
                </tr>
                {group.rows.map((feature, ri) => (
                  <tr key={feature.name} className="border-b border-black/[0.05]">
                    <td
                      className={
                        "sticky left-0 z-10 w-[124px] min-w-[124px] [transform:translateZ(0)] border-r border-black/[0.06] px-3 py-2.5 text-left text-[13px] leading-snug font-medium text-ink-2 sm:w-[240px] sm:min-w-[240px] sm:px-6 sm:py-3 sm:text-[14px] " +
                        (ri % 2 === 1 ? "bg-cream" : "bg-white")
                      }
                    >
                      {wrapParens(feature.name)}
                    </td>
                    {feature.values.map((v, ci) => (
                      <td
                        key={`${feature.name}-${ci}`}
                        className={
                          "min-w-[110px] px-2 py-2.5 text-center align-middle sm:min-w-[150px] sm:px-5 sm:py-3 " +
                          (plans[ci]?.popular
                            ? "border-x border-orange/20 bg-orange-lighter/60"
                            : ri % 2 === 1
                              ? "bg-cream/60"
                              : "bg-white")
                        }
                      >
                        <CellValue value={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
        {/* Right-edge fade — the table scrolls horizontally below `lg`, where
            it doesn't fit all plan columns at once. */}
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 rounded-r-2xl bg-gradient-to-l from-white to-transparent lg:hidden"
          aria-hidden
        />
      </div>
      <p className="mt-2 flex-shrink-0 text-center text-[11px] font-medium text-ink-4 lg:hidden">
        Swipe left/right to see all plans
      </p>
    </>
  );
}
