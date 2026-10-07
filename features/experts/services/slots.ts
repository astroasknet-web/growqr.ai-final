/* ────────────────────────────────────────────────────────────────
   Slot generation — pure helpers (no I/O).

   Expands weekly availability rules into concrete bookable slots for a
   date range, in the expert's timezone, then subtracts busy intervals
   (Google freeBusy) and already-booked starts.
──────────────────────────────────────────────────────────────── */

import type { AvailabilityRule } from "./availability.service";
import type { BusyInterval } from "@/lib/google/calendar";

export type Slot = { time: string }; // ISO start
export type SlotsMap = Record<string, Slot[]>; // "YYYY-MM-DD" (expert tz) → slots

/** "GMT+05:30" → "+05:30" offset for an IANA tz at a given instant. */
function tzOffset(timeZone: string, at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+00:00";
  const m = name.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : "+00:00";
}

/** "YYYY-MM-DD" calendar date for an instant in the given tz (en-CA → ISO date). */
function dateKeyInTz(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Build the UTC instant for a wall-clock time on a date in the given tz. */
function wallTimeToInstant(dateKey: string, minutesOfDay: number, timeZone: string): Date {
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, "0");
  const mm = String(minutesOfDay % 60).padStart(2, "0");
  // Offset is computed against noon of that date to stay on the right side of any DST flip.
  const ref = new Date(`${dateKey}T12:00:00Z`);
  const offset = tzOffset(timeZone, ref);
  return new Date(`${dateKey}T${hh}:${mm}:00${offset}`);
}

function minutesOfDay(timeStr: string): number {
  const [h, m] = timeStr.split(":").map((n) => parseInt(n, 10));
  return h * 60 + (m || 0);
}

function overlapsBusy(startMs: number, endMs: number, busy: BusyInterval[]): boolean {
  for (const b of busy) {
    const bs = new Date(b.start).getTime();
    const be = new Date(b.end).getTime();
    if (startMs < be && endMs > bs) return true;
  }
  return false;
}

/**
 * Generate available slots between two instants.
 *
 * @param rules        weekly availability rules
 * @param sessionMin   session length (from the expert's package)
 * @param rangeStart   range start (ISO)
 * @param rangeEnd     range end (ISO)
 * @param busy         busy intervals to exclude
 * @param bookedStarts ISO start times already booked
 * @param timeZone     expert timezone (default Asia/Kolkata)
 * @param leadMinutes  minimum lead time from now before a slot is bookable
 */
export function generateSlots(opts: {
  rules: AvailabilityRule[];
  sessionMin: number;
  rangeStart: string;
  rangeEnd: string;
  busy?: BusyInterval[];
  bookedStarts?: string[];
  timeZone?: string;
  leadMinutes?: number;
  now?: Date;
}): SlotsMap {
  const {
    rules,
    sessionMin,
    rangeStart,
    rangeEnd,
    busy = [],
    bookedStarts = [],
    timeZone = "Asia/Kolkata",
    leadMinutes = 120,
    now = new Date(),
  } = opts;

  if (rules.length === 0) return {};

  const bookedSet = new Set(bookedStarts.map((s) => new Date(s).getTime()));
  const minBookableMs = now.getTime() + leadMinutes * 60_000;

  const startDate = new Date(rangeStart);
  const endDate = new Date(rangeEnd);

  // Iterate calendar dates (expert tz) across the range, capped for safety.
  const out: SlotsMap = {};
  const cursor = new Date(`${dateKeyInTz(startDate, timeZone)}T00:00:00Z`);
  const lastKey = dateKeyInTz(endDate, timeZone);
  let guard = 0;

  while (guard++ < 120) {
    const dateKey = cursor.toISOString().slice(0, 10);
    const dow = cursor.getUTCDay();

    // 2nd & 4th Saturdays are non-working days by default (no slots).
    // nth occurrence of this weekday in the month = ceil(dayOfMonth / 7).
    const isExcludedSaturday =
      dow === 6 && [2, 4].includes(Math.ceil(parseInt(dateKey.slice(8, 10), 10) / 7));

    for (const rule of isExcludedSaturday ? [] : rules.filter((r) => r.day_of_week === dow)) {
      const ruleStart = minutesOfDay(rule.start_time);
      const ruleEnd = minutesOfDay(rule.end_time);
      const step = rule.slot_duration_min || sessionMin || 30;

      for (let t = ruleStart; t + sessionMin <= ruleEnd; t += step) {
        const slotStart = wallTimeToInstant(dateKey, t, timeZone);
        const startMs = slotStart.getTime();
        const endMs = startMs + sessionMin * 60_000;

        if (startMs < minBookableMs) continue;
        if (startMs < startDate.getTime() || startMs > endDate.getTime()) continue;
        if (bookedSet.has(startMs)) continue;
        if (overlapsBusy(startMs, endMs, busy)) continue;

        (out[dateKey] ??= []).push({ time: slotStart.toISOString() });
      }
    }

    if (dateKey === lastKey) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return out;
}
