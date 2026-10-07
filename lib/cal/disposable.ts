/**
 * Disposable-email detection for bookings.
 *
 * FLAG, NEVER BLOCK. By the time this webhook fires, Cal has already reserved a
 * real slot on a real calendar — refusing the booking here would not undo that,
 * it would only hide a meeting the team is nonetheless expected to attend. So a
 * flagged booking still gets its row and still raises a notification; the flag
 * only keeps it out of Zoho (buildCallBookingPayload returns null, the row is
 * marked 'skipped' by the existing engine, exactly like a general-enquiry
 * contact message).
 *
 * Matching is on the registrable domain, including subdomains: throwaway
 * services hand out `foo.mailinator.com` style addresses freely.
 *
 * This list is maintained by hand and is deliberately short. It is not meant to
 * be exhaustive — an arms race against thousands of throwaway domains is not
 * worth running when the only cost of a miss is one junk Lead a human deletes.
 */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "10minutemail.com",
  "10minutemail.net",
  "yopmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "fakeinbox.com",
  "mailnesia.com",
  "mintemail.com",
  "spamgourmet.com",
  "tempinbox.com",
  "emailondeck.com",
  "moakt.com",
  "mohmal.com",
  "tempr.email",
  "discard.email",
  "byom.de",
]);

export function isDisposableEmail(email: string | null | undefined): boolean {
  const domain = email?.trim().toLowerCase().split("@").pop();
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Subdomain form: foo.mailinator.com
  return [...DISPOSABLE_DOMAINS].some((d) => domain.endsWith(`.${d}`));
}
