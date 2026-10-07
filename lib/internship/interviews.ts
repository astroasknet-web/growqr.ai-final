/**
 * Interview and assessment rounds, shared by the admin card, the admin API
 * that writes them, and (later) the inbound sync from the GrowQR app.
 *
 * The vocabulary lives here rather than in the components so a value cannot
 * drift between what the UI offers, what the API accepts, and what the CHECK
 * constraints in migration 0036 allow.
 */

export type InterviewKind = "ai_assessment" | "final_discussion";
export type InterviewStatus =
  | "invited"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired"
  | "no_show";
/**
 * OUR hire verdict, not the interview service's.
 *
 * The service returns no hire/no-hire signal at all: its `recommendations`
 * field is an array of coaching suggestions addressed to the candidate. This
 * is a judgement a person on our side makes after reading the score, and the
 * name says so.
 */
export type HrVerdict = "strong_yes" | "yes" | "maybe" | "no";

/** The service's own round vocabulary, from CreateAssignmentRequest.round. */
export type RoundType = "warm_up" | "behavioral" | "technical";
export type Difficulty = "easy" | "medium" | "hard";
export type InterviewSource = "manual" | "app_sync";

export const INTERVIEW_KINDS = ["ai_assessment", "final_discussion"] as const;
export const INTERVIEW_STATUSES = [
  "invited", "scheduled", "in_progress", "completed", "cancelled", "expired", "no_show",
] as const;
export const HR_VERDICTS = ["strong_yes", "yes", "maybe", "no"] as const;
export const ROUND_TYPES = ["warm_up", "behavioral", "technical"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const ROUND_TYPE_LABEL: Record<string, string> = {
  warm_up: "Warm-up",
  behavioral: "Behavioural",
  technical: "Technical",
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/**
 * The eight rubric metrics the interview service scores against, with the
 * labels it uses for them. Taken from the service's own review payload
 * (`rubric_scores` keys, labelled in `historical_comparison.metric_deltas`),
 * not invented here, so the admin card shows a candidate exactly what the app
 * showed them.
 *
 * Order is the reading order of the review, not alphabetical: how the
 * interview opened, how they spoke, how it closed, then the substance.
 */
export const RUBRIC_METRICS: { key: string; label: string }[] = [
  { key: "intro", label: "Opening & Introduction" },
  { key: "language", label: "Language & Clarity" },
  { key: "voice", label: "Voice & Tone" },
  { key: "outro", label: "Closing & Summary" },
  { key: "content_quality", label: "Content & Examples" },
  { key: "role_alignment", label: "Role Alignment" },
  { key: "time_intelligence", label: "Time Management" },
  { key: "audio_quality", label: "Audio Quality" },
];

const RUBRIC_LABEL: Record<string, string> = Object.fromEntries(
  RUBRIC_METRICS.map((m) => [m.key, m.label]),
);

/** Turn a snake_case metric key we do not know into something readable. */
function titleise(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const KIND_CONFIG: Record<InterviewKind, { label: string; agent: string | null; blurb: string }> = {
  ai_assessment: {
    label: "AI Assessment",
    agent: "RQ-Vera",
    blurb: "Run inside the GrowQR app. The result syncs back here.",
  },
  final_discussion: {
    label: "Final Discussion",
    agent: null,
    blurb: "A one-on-one call with the team.",
  },
};

export const INTERVIEW_STATUS_CONFIG: Record<
  InterviewStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  invited:     { label: "Invited",     bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-400" },
  scheduled:   { label: "Scheduled",   bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500" },
  in_progress: { label: "In Progress", bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
  completed:   { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",   bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400" },
  expired:     { label: "Expired",     bg: "bg-orange-lighter", text: "text-orange",   dot: "bg-orange" },
  no_show:     { label: "No Show",     bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500" },
};

/**
 * Recommendation colours run green to red so a reviewer can read the verdict
 * before reading the word. `maybe` is deliberately amber rather than neutral:
 * it is the one that most needs a human to actually look.
 */
export const HR_VERDICT_CONFIG: Record<
  HrVerdict,
  { label: string; bg: string; text: string }
> = {
  strong_yes: { label: "Strong Yes", bg: "bg-emerald-100", text: "text-emerald-800" },
  yes:        { label: "Yes",        bg: "bg-green-100",   text: "text-green-800" },
  maybe:      { label: "Maybe",      bg: "bg-amber-100",   text: "text-amber-800" },
  no:         { label: "No",         bg: "bg-red-100",     text: "text-red-800" },
};

// Type alias rather than an interface on purpose: aliases get an implicit
// index signature, so a competency array stays assignable to `Json` when it is
// written to the jsonb column. Same reason as GrowqrEducationEntry in
// lib/growqr-profile.ts.
export type Competency = {
  name: string;
  score: number;
  max?: number;
};

/**
 * Read the stored `competencies` jsonb defensively.
 *
 * Two shapes are accepted, because two things write this column:
 *
 *   - `{ intro: 93, language: 88, … }`  the interview service's `rubric_scores`,
 *     stored verbatim. Rendered in the service's own metric order, with its
 *     own labels, and any key we do not recognise still shows up (titleised)
 *     rather than being silently dropped.
 *   - `[{ name, score, max }]`  what a human types for a round the service
 *     knows nothing about.
 *
 * Written by a system we do not control, so a malformed entry degrades to "no
 * breakdown shown" rather than throwing inside a server component.
 */
export function readCompetencies(value: unknown): Competency[] {
  if (!value || typeof value !== "object") return [];

  if (!Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const known = RUBRIC_METRICS.filter((m) => m.key in obj).map((m) => ({
      name: m.label,
      score: Number(obj[m.key]),
      max: 100,
    }));
    const extra = Object.keys(obj)
      .filter((k) => !(k in RUBRIC_LABEL))
      .map((k) => ({ name: titleise(k), score: Number(obj[k]), max: 100 }));
    return [...known, ...extra].filter((c) => Number.isFinite(c.score));
  }

  const out: Competency[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const name = typeof e.name === "string" ? e.name.trim() : "";
    const score = typeof e.score === "number" ? e.score : Number(e.score);
    if (!name || !Number.isFinite(score)) continue;
    const max = typeof e.max === "number" && e.max > 0 ? e.max : 100;
    out.push({ name, score, max });
  }
  return out;
}

/** Text[] columns come back as null or with stray blanks; normalise both. */
export function readList(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
}

/** Score as a percentage of its own scale, clamped for use as a bar width. */
export function scorePercent(score: number | null, maxScore: number | null): number | null {
  if (score === null || !Number.isFinite(score)) return null;
  const max = maxScore && maxScore > 0 ? maxScore : 100;
  return Math.max(0, Math.min(100, (score / max) * 100));
}

export function isInterviewKind(v: string): v is InterviewKind {
  return (INTERVIEW_KINDS as readonly string[]).includes(v);
}
export function isInterviewStatus(v: string): v is InterviewStatus {
  return (INTERVIEW_STATUSES as readonly string[]).includes(v);
}
export function isHrVerdict(v: string): v is HrVerdict {
  return (HR_VERDICTS as readonly string[]).includes(v);
}
export function isRoundType(v: string): v is RoundType {
  return (ROUND_TYPES as readonly string[]).includes(v);
}

/**
 * Where the candidate goes to take an assigned assessment.
 *
 * The interview service does not hand back a per-assignment URL: assignments
 * surface inside the app on the seeker's own dashboard ("Assigned Interview"
 * card, populated from GET /interviews/assignments?email=). So this is the
 * app entry point, not a magic link, and it is the same for every candidate.
 */
export function assessmentUrlFor(): string {
  const base = (process.env.NEXT_PUBLIC_GROWQR_APP_URL || "https://app.growqr.ai").replace(/\/+$/, "");
  return `${base}/interview`;
}
