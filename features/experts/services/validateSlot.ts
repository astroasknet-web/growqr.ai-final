import { getWeeklyAvailability } from "./availability.service";
import { generateSlots } from "./slots";

const EXPERT_TZ = "Asia/Kolkata";

/**
 * Server-side revalidation of a booking start time (H2).
 *
 * Confirms the requested start corresponds to a real bookable slot derived
 * from the expert's weekly availability rules, i.e. it lies on the slot grid
 * and is not in the past.
 *
 * Notes:
 * - Uses a tight ±1min window so generateSlots yields only the target slot.
 * - leadMinutes is 0 here on purpose: the 120-min lead is enforced at slot
 *   selection time; re-applying it post-payment could falsely reject a valid
 *   booking that crossed the lead boundary while the user was paying.
 * - Double-booking is intentionally NOT checked here (bookedStarts omitted);
 *   that is handled separately by isSlotTaken + the DB unique index so the
 *   user gets the precise "slot taken" message.
 */
export async function isStartTimeBookable(
  slug: string,
  startISO: string,
  sessionMin: number,
): Promise<boolean> {
  const startMs = new Date(startISO).getTime();
  if (!Number.isFinite(startMs)) return false;

  const rangeStart = new Date(startMs - 60_000).toISOString();
  const rangeEnd = new Date(startMs + 60_000).toISOString();

  const rules = await getWeeklyAvailability(slug);

  const slots = generateSlots({
    rules,
    sessionMin,
    rangeStart,
    rangeEnd,
    bookedStarts: [],
    timeZone: EXPERT_TZ,
    leadMinutes: 0,
  });

  const target = new Date(startISO).toISOString();
  return Object.values(slots).some((arr) => arr.some((s) => s.time === target));
}
