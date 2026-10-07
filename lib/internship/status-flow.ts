/**
 * Forward-only automatic status advancement.
 *
 * The pipeline status is still a person's to set, with one carve-out: a system
 * event may nudge it FORWARD along the linear path, never backward and never
 * onto or away from a human hold. So assigning the interview moves a `new`
 * applicant to `interview`, but it will never pull someone back from
 * `selected`, and it will never touch a `rejected` or `waitlist` a person
 * deliberately chose (those sit off the linear path).
 *
 * Used by the auto-assign on apply, the admin invite/schedule actions, and the
 * appointment letter send, so the stage the candidate is actually at is
 * reflected without a reviewer having to move the dropdown by hand.
 */

const LINEAR = [
  "new",
  "screening",
  "shortlisted",
  "interview",
  "selected",
  "offer",
  "joined",
] as const;

/**
 * The status to move to, or null to leave it alone. Returns `target` only when
 * it is strictly further along the linear path than `current`. Anything else
 * (already there, further along, or an off-path status like rejected/waitlist)
 * returns null.
 */
export function nextStatusOrNull(current: string, target: string): string | null {
  const ci = LINEAR.indexOf(current as (typeof LINEAR)[number]);
  const ti = LINEAR.indexOf(target as (typeof LINEAR)[number]);
  if (ci < 0 || ti < 0) return null;
  return ti > ci ? target : null;
}
