/**
 * Canonical ambassador application statuses.
 *
 * Kept out of the server-only modules so route handlers, the stats aggregate,
 * and the list query can all validate against the same list. The internship
 * equivalent lives in components/admin/InternshipStatusBadge.
 */
export const AMBASSADOR_STATUSES = [
  "pending",
  "screening",
  "interviewed",
  "under_review",
  "shortlisted",
  "rejected",
] as const;

export type AmbassadorStatus = (typeof AMBASSADOR_STATUSES)[number];

export function isAmbassadorStatus(value: string): value is AmbassadorStatus {
  return (AMBASSADOR_STATUSES as readonly string[]).includes(value);
}
