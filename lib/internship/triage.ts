/**
 * RQ-Score triage: the automatic first pass over an internship application.
 *
 * Every applicant must link a GrowQR profile (migration 0028), so every
 * application arrives carrying an RQ-Score. Banding on it at submit time means
 * HR opens the list already sorted rather than reading every row to find the
 * ones worth reading.
 *
 * The band is NOT a pipeline status. `internship_applications.status` stays
 * entirely human: a band can never move a candidate, only describe what the
 * rule saw. See the header of migration 0035 for why that separation matters.
 */

/**
 * The bar for an automatic shortlist. Changing this affects applications
 * submitted from that moment on; existing rows keep the band they were given,
 * because `triage_score` records the value the rule saw and rewriting history
 * would make that record a lie.
 */
export const RQ_SHORTLIST_THRESHOLD = 50;

export type TriageBand = "auto_shortlist" | "on_hold" | "unscored";

export const TRIAGE_BANDS = ["auto_shortlist", "on_hold", "unscored"] as const;

/**
 * Band an RQ-Score.
 *
 * `unscored` is a real outcome, not an error case: GrowQR can be unreachable
 * at submit time (send-internship records the application anyway rather than
 * losing it to a transient outage), and applications predating the profile
 * requirement have no score at all. Those are "we don't know", which is a
 * different thing from "below the bar" and has to read differently to HR.
 */
export function triageFor(
  rq: number | null | undefined,
  threshold: number = RQ_SHORTLIST_THRESHOLD,
): TriageBand {
  if (typeof rq !== "number" || !Number.isFinite(rq)) return "unscored";
  return rq >= threshold ? "auto_shortlist" : "on_hold";
}

export function isTriageBand(value: string): value is TriageBand {
  return (TRIAGE_BANDS as readonly string[]).includes(value);
}

/**
 * Presentation config, same shape as INTERNSHIP_STATUS_CONFIG in
 * components/admin/InternshipStatusBadge.tsx so the two render identically.
 *
 * `hint` is the sentence HR reads on the detail page. The wording on `on_hold`
 * is load-bearing: this band must never be mistaken for a rejection.
 */
export const TRIAGE_CONFIG: Record<
  TriageBand,
  { label: string; color: string; bg: string; text: string; dot: string; hint: string }
> = {
  auto_shortlist: {
    label: "Auto-Shortlist",
    color: "bg-emerald-500",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    hint: `RQ-Score ${RQ_SHORTLIST_THRESHOLD} or above. Worth a first look.`,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-amber-500",
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
    hint: `RQ-Score below ${RQ_SHORTLIST_THRESHOLD}. Not rejected, parked for review.`,
  },
  unscored: {
    label: "Unscored",
    color: "bg-slate-400",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    hint: "No RQ-Score was available when this application was submitted.",
  },
};

/** Option shape the admin filter dropdowns expect. */
export const TRIAGE_OPTIONS = TRIAGE_BANDS.map((b) => ({
  value: b,
  label: TRIAGE_CONFIG[b].label,
}));

export const TRIAGE_LABEL: Record<string, string> = Object.fromEntries(
  TRIAGE_BANDS.map((b) => [b, TRIAGE_CONFIG[b].label]),
);
