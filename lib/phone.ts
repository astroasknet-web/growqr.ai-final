/**
 * Phone validation shared by both applicant forms and both submit APIs.
 *
 * The forms previously accepted anything with 10 or more digits, which let
 * "0000000000", a 15-digit mistype, and a landline through. Both programs
 * recruit on Indian campuses and the team calls these numbers, so the check
 * is an Indian mobile check.
 */

/** Digits only, with a leading +91 / 91 / 0 trunk prefix stripped. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * Indian mobile numbers are exactly 10 digits and start 6-9. Landlines and
 * short codes start lower, so this rejects them by construction.
 */
export function isValidIndianMobile(input: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizePhone(input));
}

/**
 * Null when valid, otherwise the message to show under the field. Kept in one
 * place so the client-side hint and the server-side rejection agree.
 */
export function phoneError(input: string, label = "Phone number"): string | null {
  if (!input.trim()) return `${label} is required`;
  const digits = normalizePhone(input);
  if (digits.length < 10) return "Enter a 10-digit mobile number";
  if (digits.length > 10) return "That looks too long for a mobile number";
  if (!/^[6-9]/.test(digits)) return "Indian mobile numbers start with 6, 7, 8 or 9";
  return null;
}

/**
 * Keeps a phone input to characters that can appear in a typed number, so the
 * field can't accumulate letters that the digit-strip would silently discard.
 */
export function sanitizePhoneInput(input: string): string {
  return input.replace(/[^\d+\-\s()]/g, "").slice(0, 25);
}
