import { selected, notSelected, offerExtended, type CandidateEmail } from "./emails";
import type { InternshipEmailKind } from "./send-email";

/**
 * Which application statuses email the candidate, and with which template.
 *
 * Only three of the nine statuses mail: the three that are news the candidate
 * is waiting on. The rest (new, screening, shortlisted, interview, waitlist,
 * joined) are internal pipeline moves and stay silent. `interview` is silent on
 * purpose: the interview invite is owned by the interview card, so exactly one
 * place mails each thing.
 *
 * Kept here, apart from the route, so the PATCH handler that sends, the preview
 * route that renders, and the status dropdown that offers the confirm all read
 * the same map and cannot drift.
 */

export type EmailableStatus = "selected" | "offer" | "rejected";

export const STATUS_EMAIL: Record<
  EmailableStatus,
  { kind: InternshipEmailKind; label: string; subjectHint: string }
> = {
  selected: {
    kind: "selected",
    label: "Selected",
    subjectHint: "Update on your GrowQR internship application",
  },
  offer: {
    kind: "offer",
    label: "Offer",
    subjectHint: "Your GrowQR internship offer",
  },
  rejected: {
    kind: "rejected",
    label: "Rejected",
    subjectHint: "Update on your GrowQR internship application",
  },
};

export function isEmailableStatus(s: string): s is EmailableStatus {
  return s === "selected" || s === "offer" || s === "rejected";
}

export interface OfferParticulars {
  startLabel?: string | null;
  durationLabel?: string | null;
}

/** Build the candidate email for an emailing status. */
export function buildStatusEmail(
  status: EmailableStatus,
  name: string,
  role: string,
  offer?: OfferParticulars,
): CandidateEmail {
  switch (status) {
    case "selected":
      return selected(name, role);
    case "offer":
      return offerExtended(name, role, offer?.startLabel ?? null, offer?.durationLabel ?? null);
    case "rejected":
      return notSelected(name, role);
  }
}
