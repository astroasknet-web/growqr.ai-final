/**
 * Date-of-birth validation shared by the internship apply form and its submit
 * API, mirroring the dob check constraint added in migration 0032.
 *
 * Everything here is deliberately component-wise rather than going through
 * `toISOString()`. A `YYYY-MM-DD` string from a date input is a calendar date
 * with no timezone, and `toISOString()` converts local midnight to UTC, which
 * in IST (+5:30) lands on the previous day and shifts every date by one.
 */

/** Youngest plausible undergraduate applicant. */
export const MIN_APPLICANT_AGE = 15;

/** Oldest date the constraint accepts, guarding against typo'd centuries. */
export const MIN_DOB = "1900-01-01";

/** `YYYY-MM-DD` for a Date, read in local time. */
function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parses `YYYY-MM-DD` as a local calendar date, returning null if the string
 * is malformed or names a day that does not exist (2004-02-30 rolls over to
 * March 1 in the Date constructor, so the round-trip catches it).
 */
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** Whole years between `dob` and `on`, calendar-correct (not 365-day maths). */
export function ageOn(dob: Date, on: Date): number {
  let age = on.getFullYear() - dob.getFullYear();
  const monthDelta = on.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getDate() < dob.getDate())) age -= 1;
  return age;
}

/**
 * The latest DOB that clears the age floor, as `YYYY-MM-DD`. Feed this to a
 * date input's `max` so the picker cannot offer an out-of-range date at all.
 */
export function maxDobFor(today = new Date()): string {
  return toDateString(
    new Date(today.getFullYear() - MIN_APPLICANT_AGE, today.getMonth(), today.getDate()),
  );
}

/** Null when valid, otherwise the message to show under the field. */
export function dobError(value: string, today = new Date()): string | null {
  if (!value.trim()) return "Date of birth is required";

  const dob = parseDateOnly(value);
  if (!dob) return "Enter a valid date";

  if (value <= MIN_DOB) return "Enter a valid date";
  if (value > toDateString(today)) return "Date of birth cannot be in the future";
  if (ageOn(dob, today) < MIN_APPLICANT_AGE) return `You must be at least ${MIN_APPLICANT_AGE}`;
  return null;
}
