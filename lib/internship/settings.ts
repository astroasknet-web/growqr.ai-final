import { createAdminClient } from "@/lib/data/server";
import { isRoundType, type RoundType } from "@/lib/internship/interviews";
import { PREFERRED_ROLES } from "@/lib/internship-options";
import type { Json, Tables, TablesUpdate } from "@/types/database";

/**
 * Internship automation settings: one org-wide row HR sets once, read by every
 * automatic step in the pipeline.
 *
 * Single source of truth. The auto-shortlist bar, the AI round, the auto-advance
 * rule, the final-round defaults and the appointment-letter defaults all used to
 * be constants sprinkled across routes and components. They live here now, so
 * changing a number is a settings edit, not a code change.
 *
 * Every read goes through getInternshipSettings(), which can never throw and can
 * never return a half-populated object: a missing row, an unreachable database
 * or a partial column set all fall back to DEFAULT_INTERNSHIP_SETTINGS. A caller
 * always gets a complete, valid config.
 */

export interface InternshipSettings {
  // On apply
  shortlistMinRq: number;
  autoAssignEnabled: boolean;
  /** Fallback AI round for any role not named in the per-role map below. */
  interviewRoundType: RoundType;
  /** AI round per role label. Complete over PREFERRED_ROLES after a read. */
  interviewRoundByRole: Record<string, RoundType>;
  // Interview scoring
  autoAdvanceEnabled: boolean;
  interviewPassScore: number;
  // Final round
  defaultInterviewerName: string | null;
  defaultInterviewerEmail: string | null;
  finalRoundCalendarId: string | null;
  // Appointment letter
  defaultDepartment: string | null;
  defaultDuration: string;
  defaultLocation: string;
  defaultReportingManager: string;
  defaultSignatoryName: string;
  defaultSignatoryTitle: string;
  // Automatic candidate emails
  emailApplicationReceived: boolean;
  emailInterviewInvite: boolean;
  emailFinalRound: boolean;
  emailAutoSelected: boolean;
}

/**
 * The shipped configuration. Matches the column defaults in migration 0042 so a
 * fresh install and a fallback read describe the same behaviour.
 */
export const DEFAULT_INTERNSHIP_SETTINGS: InternshipSettings = {
  shortlistMinRq: 50,
  autoAssignEnabled: true,
  interviewRoundType: "behavioral",
  interviewRoundByRole: {
    "Technology": "technical",
    "UI/UX": "behavioral",
    "Social Media": "behavioral",
    "Sales & Marketing": "behavioral",
    "Community": "behavioral",
  },
  autoAdvanceEnabled: false,
  interviewPassScore: 60,
  defaultInterviewerName: null,
  defaultInterviewerEmail: null,
  finalRoundCalendarId: null,
  defaultDepartment: null,
  defaultDuration: "6 months",
  defaultLocation: "Remote",
  defaultReportingManager: "Chandni Jha",
  defaultSignatoryName: "Chandni Jha",
  defaultSignatoryTitle: "Head of HR",
  emailApplicationReceived: true,
  emailInterviewInvite: true,
  emailFinalRound: true,
  emailAutoSelected: true,
};

type SettingsRow = Tables<"internship_settings">;

/**
 * Build the complete per-role round map. Over every current role, the stored
 * value wins if valid, else the shipped default for that role, else the global
 * fallback, so the map is always complete and every value is a real RoundType.
 */
function roundMapFromJson(raw: Json | null, globalFallback: RoundType): Record<string, RoundType> {
  const stored = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, RoundType> = {};
  for (const role of PREFERRED_ROLES) {
    const v = stored[role];
    if (typeof v === "string" && isRoundType(v)) out[role] = v;
    else out[role] = DEFAULT_INTERNSHIP_SETTINGS.interviewRoundByRole[role] ?? globalFallback;
  }
  return out;
}

/** Map a raw row to the typed config, falling back per-field so a null column never leaks through. */
function fromRow(row: SettingsRow): InternshipSettings {
  const d = DEFAULT_INTERNSHIP_SETTINGS;
  const s = (v: string | null, fallback: string) => (v && v.trim() ? v.trim() : fallback);
  const nn = (v: number | null, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
  const globalRound = isRoundType(row.interview_round_type) ? row.interview_round_type : d.interviewRoundType;
  return {
    shortlistMinRq: nn(row.shortlist_min_rq, d.shortlistMinRq),
    autoAssignEnabled: row.auto_assign_enabled ?? d.autoAssignEnabled,
    interviewRoundType: globalRound,
    interviewRoundByRole: roundMapFromJson(row.interview_round_by_role, globalRound),
    autoAdvanceEnabled: row.auto_advance_enabled ?? d.autoAdvanceEnabled,
    interviewPassScore: nn(row.interview_pass_score, d.interviewPassScore),
    defaultInterviewerName: row.default_interviewer_name?.trim() || null,
    defaultInterviewerEmail: row.default_interviewer_email?.trim()?.toLowerCase() || null,
    finalRoundCalendarId: row.final_round_calendar_id?.trim() || null,
    defaultDepartment: row.default_department?.trim() || null,
    defaultDuration: s(row.default_duration, d.defaultDuration),
    defaultLocation: s(row.default_location, d.defaultLocation),
    defaultReportingManager: s(row.default_reporting_manager, d.defaultReportingManager),
    defaultSignatoryName: s(row.default_signatory_name, d.defaultSignatoryName),
    defaultSignatoryTitle: s(row.default_signatory_title, d.defaultSignatoryTitle),
    emailApplicationReceived: row.email_application_received ?? d.emailApplicationReceived,
    emailInterviewInvite: row.email_interview_invite ?? d.emailInterviewInvite,
    emailFinalRound: row.email_final_round ?? d.emailFinalRound,
    emailAutoSelected: row.email_auto_selected ?? d.emailAutoSelected,
  };
}

/**
 * Read the settings row. Never throws, always returns a complete config: on any
 * failure (no row yet, DB down, bad shape) it returns the shipped defaults, so
 * the automation degrades to its documented default behaviour rather than
 * crashing the request that reads it.
 */
export async function getInternshipSettings(): Promise<InternshipSettings> {
  try {
    const { data, error } = await createAdminClient()
      .from("internship_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error || !data) return DEFAULT_INTERNSHIP_SETTINGS;
    return fromRow(data);
  } catch {
    return DEFAULT_INTERNSHIP_SETTINGS;
  }
}

/**
 * The final-round calendar id, preferring the setting over the INTERNSHIP_CALENDAR_ID
 * env var, then Google's own primary. Kept as one helper so the interview route
 * and any future caller resolve it identically.
 */
export function resolveFinalRoundCalendarId(settings: InternshipSettings): string | undefined {
  return settings.finalRoundCalendarId || process.env.INTERNSHIP_CALENDAR_ID?.trim() || undefined;
}

/**
 * The AI interview round for a given role: the per-role setting when the role is
 * named, otherwise the global fallback. This is what the auto-assign and the
 * manual invite key on, so a Technology applicant runs a technical round while
 * the rest run whatever HR set.
 */
export function roundTypeForRole(settings: InternshipSettings, role: string | null | undefined): RoundType {
  const key = (role ?? "").trim();
  return settings.interviewRoundByRole[key] ?? settings.interviewRoundType;
}

const clampScore = (v: unknown, fallback: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
};
const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/**
 * Validate an incoming patch and write it to the singleton row. Unknown keys are
 * ignored; every value is clamped or trimmed here, so the API route stays thin
 * and the DB CHECK constraints are a backstop rather than the first line of
 * defence. Returns the saved, re-read config.
 */
export async function updateInternshipSettings(
  patch: Record<string, unknown>,
  updatedBy: string | null,
): Promise<InternshipSettings> {
  const row: TablesUpdate<"internship_settings"> = { id: true, updated_at: new Date().toISOString(), updated_by: updatedBy };

  if ("shortlistMinRq" in patch) row.shortlist_min_rq = clampScore(patch.shortlistMinRq, DEFAULT_INTERNSHIP_SETTINGS.shortlistMinRq);
  if ("autoAssignEnabled" in patch) row.auto_assign_enabled = Boolean(patch.autoAssignEnabled);
  if ("interviewRoundType" in patch)
    row.interview_round_type = isRoundType(String(patch.interviewRoundType)) ? String(patch.interviewRoundType) : "behavioral";
  if ("interviewRoundByRole" in patch) {
    // Keep only known roles paired with a valid round type; everything else is
    // dropped, so a malformed client payload can never poison the map.
    const src =
      patch.interviewRoundByRole && typeof patch.interviewRoundByRole === "object" && !Array.isArray(patch.interviewRoundByRole)
        ? (patch.interviewRoundByRole as Record<string, unknown>)
        : {};
    const clean: Record<string, string> = {};
    for (const role of PREFERRED_ROLES) {
      const v = src[role];
      if (typeof v === "string" && isRoundType(v)) clean[role] = v;
    }
    row.interview_round_by_role = clean as Json;
  }
  if ("autoAdvanceEnabled" in patch) row.auto_advance_enabled = Boolean(patch.autoAdvanceEnabled);
  if ("interviewPassScore" in patch) row.interview_pass_score = clampScore(patch.interviewPassScore, DEFAULT_INTERNSHIP_SETTINGS.interviewPassScore);

  if ("defaultInterviewerName" in patch) row.default_interviewer_name = str(patch.defaultInterviewerName, 200);
  if ("defaultInterviewerEmail" in patch) {
    const e = str(patch.defaultInterviewerEmail, 254);
    row.default_interviewer_email = e ? e.toLowerCase() : null;
  }
  if ("finalRoundCalendarId" in patch) row.final_round_calendar_id = str(patch.finalRoundCalendarId, 200);

  if ("defaultDepartment" in patch) row.default_department = str(patch.defaultDepartment, 200);
  if ("defaultDuration" in patch) row.default_duration = str(patch.defaultDuration, 100) ?? DEFAULT_INTERNSHIP_SETTINGS.defaultDuration;
  if ("defaultLocation" in patch) row.default_location = str(patch.defaultLocation, 200) ?? DEFAULT_INTERNSHIP_SETTINGS.defaultLocation;
  if ("defaultReportingManager" in patch) row.default_reporting_manager = str(patch.defaultReportingManager, 200) ?? DEFAULT_INTERNSHIP_SETTINGS.defaultReportingManager;
  if ("defaultSignatoryName" in patch) row.default_signatory_name = str(patch.defaultSignatoryName, 200) ?? DEFAULT_INTERNSHIP_SETTINGS.defaultSignatoryName;
  if ("defaultSignatoryTitle" in patch) row.default_signatory_title = str(patch.defaultSignatoryTitle, 200) ?? DEFAULT_INTERNSHIP_SETTINGS.defaultSignatoryTitle;

  if ("emailApplicationReceived" in patch) row.email_application_received = Boolean(patch.emailApplicationReceived);
  if ("emailInterviewInvite" in patch) row.email_interview_invite = Boolean(patch.emailInterviewInvite);
  if ("emailFinalRound" in patch) row.email_final_round = Boolean(patch.emailFinalRound);
  if ("emailAutoSelected" in patch) row.email_auto_selected = Boolean(patch.emailAutoSelected);

  const admin = createAdminClient();
  const { error } = await admin.from("internship_settings").upsert(row, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return getInternshipSettings();
}
