/**
 * Internship hiring option lists, shared by the public apply form, the submit
 * API that validates against them, and the admin filters that query them.
 *
 * These were previously duplicated across those three call sites with
 * "keep in sync" comments. A filter that drifts from the values actually
 * stored silently returns zero rows, so they live in one place now.
 */

/**
 * The internship tracks. "Technology" stays deliberately broad rather than
 * splitting into Frontend/Backend; "UI/UX" is separate because design
 * applicants are screened by a different reviewer.
 *
 * Stored verbatim in internship_applications.preferred_role, so renaming a
 * label here leaves the rows already carrying the old one behind. Move the old
 * label into LEGACY_PREFERRED_ROLES below when that happens, so the admin can
 * still filter for it.
 */
export const PREFERRED_ROLES = [
  "Sales & Marketing",
  "Social Media",
  "Technology",
  "UI/UX",
  "Community",
] as const;

export type PreferredRole = (typeof PREFERRED_ROLES)[number];

/**
 * Roles the form used to offer and applications are still stored under. The
 * apply form no longer lists them and the submit API no longer accepts them,
 * but the admin filters do, so those rows stay reachable instead of dropping
 * out of the dropdown they were filed under.
 *
 * "Growth & Digital Marketing" became "Social Media" in August 2026, to match
 * the published job description.
 */
export const LEGACY_PREFERRED_ROLES = ["Growth & Digital Marketing"] as const;

/** Current plus retired roles: what the admin filters validate and offer. */
export const FILTERABLE_ROLES: readonly string[] = [
  ...PREFERRED_ROLES,
  ...LEGACY_PREFERRED_ROLES,
];

export function isLegacyRole(role: string): boolean {
  return (LEGACY_PREFERRED_ROLES as readonly string[]).includes(role);
}

/**
 * Matches the availability check constraint in migration 0025. Deliberately not
 * `as const`: the apply form's FloatingSelect takes a mutable option array.
 */
export const AVAILABILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "immediately", label: "Immediately" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_a_month", label: "Within a month" },
  { value: "flexible", label: "Flexible" },
];

export const AVAILABILITY_VALUES: string[] = AVAILABILITY_OPTIONS.map((o) => o.value);

/** Option shape the form's FloatingSelect expects. */
export const ROLE_OPTIONS = PREFERRED_ROLES.map((r) => ({ value: r, label: r }));

export const AVAILABILITY_LABEL: Record<string, string> = Object.fromEntries(
  AVAILABILITY_OPTIONS.map((o) => [o.value, o.label]),
);

/** Matches the mode check constraint in migration 0032. */
export const MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export const MODE_VALUES: string[] = MODE_OPTIONS.map((o) => o.value);

export const MODE_LABEL: Record<string, string> = Object.fromEntries(
  MODE_OPTIONS.map((o) => [o.value, o.label]),
);

/** Matches the duration check constraint in migration 0032. */
export const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
];

export const DURATION_VALUES: string[] = DURATION_OPTIONS.map((o) => o.value);

export const DURATION_LABEL: Record<string, string> = Object.fromEntries(
  DURATION_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Degree specializations offered as a dropdown rather than free text, so the
 * admin can group applicants by stream instead of reconciling "CSE", "C.S.E."
 * and "Computer Sc." by hand.
 *
 * Stored verbatim in internship_applications.degree_specialization (free text,
 * 2-200 chars), so this list can grow without a migration. "Other" is the
 * escape hatch: a fixed list will always miss someone's programme, and an
 * applicant who cannot find theirs would otherwise be stuck.
 */
export const DEGREE_SPECIALIZATIONS = [
  // Engineering & technology
  "Computer Science & Engineering",
  "Information Technology",
  "Artificial Intelligence & Machine Learning",
  "Data Science",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Automobile Engineering",
  "Instrumentation & Control",
  "Industrial & Production",
  "Mining Engineering",
  "Metallurgical Engineering",
  "Agricultural Engineering",
  "Biotechnology",
  "Computer Applications",
  // Sciences
  "Physics",
  "Chemistry",
  "Mathematics",
  "Statistics",
  "Life Sciences",
  "Environmental Science",
  // Commerce & management
  "Commerce",
  "Accounting & Finance",
  "Banking & Insurance",
  "Economics",
  "Business Administration",
  "Marketing",
  "Human Resources",
  "Operations & Supply Chain",
  "Hotel Management",
  // Humanities & communication
  "Mass Communication & Journalism",
  "English Literature",
  "Psychology",
  "Sociology",
  "Political Science",
  "History",
  "Law",
  "Education",
  // Health sciences
  "Pharmacy",
  "Nursing",
  "Medicine (MBBS)",
  "Dental Surgery",
  "Physiotherapy",
  // Design & architecture
  "Architecture",
  "Fashion Design",
  "Communication / Graphic Design",
  "Interior Design",
  "Fine Arts",
  "Other",
] as const;

export const DEGREE_SPECIALIZATION_OPTIONS = DEGREE_SPECIALIZATIONS.map((d) => ({
  value: d,
  label: d,
}));
