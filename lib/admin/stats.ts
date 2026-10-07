import "server-only";
import { createAdminClient } from "@/lib/supabase-server";
import { INTERNSHIP_STATUSES } from "@/components/admin/InternshipStatusBadge";
import { AMBASSADOR_STATUSES } from "@/lib/admin/statuses";
import { TRIAGE_BANDS } from "@/lib/internship/triage";

/**
 * Dashboard stat tiles, one database round trip each.
 *
 * These used to issue one `head: true` count request per status — seven for
 * ambassadors, ten for internships — plus one for the total. The counts
 * themselves take well under a millisecond; the cost was entirely the
 * per-request round trip. `admin_*_status_counts()` returns the whole
 * breakdown in a single grouped aggregate instead.
 *
 * `ok` is reported rather than swallowed: the previous version caught every
 * error and returned all zeros, so a database outage rendered as a dashboard
 * claiming there were no applications at all.
 */

export { AMBASSADOR_STATUSES };

export type AmbassadorStats = Record<
  (typeof AMBASSADOR_STATUSES)[number] | "total",
  number
>;

export type InternshipStats = Record<
  (typeof INTERNSHIP_STATUSES)[number] | "total",
  number
>;

export type InternshipTriageStats = Record<
  (typeof TRIAGE_BANDS)[number] | "total",
  number
>;

export interface StatsResult<T> {
  stats: T;
  ok: boolean;
}

function emptyFrom<K extends string>(keys: readonly K[]): Record<K | "total", number> {
  const out = { total: 0 } as Record<K | "total", number>;
  for (const k of keys) out[k] = 0;
  return out;
}

/**
 * Fold `[{status, total}]` rows into the tile shape.
 *
 * `total` sums every row, including statuses the UI has no tile for, so the
 * Total tile always matches the real table count even if a status value is
 * introduced in the database before the UI knows about it.
 */
function foldCounts<K extends string>(
  keys: readonly K[],
  rows: { status: string | null; total: number | string }[],
): Record<K | "total", number> {
  return foldBy(keys, rows, (r) => r.status);
}

/**
 * The general form: the triage RPC keys its rows on `triage` rather than
 * `status`, so the bucket name is read through a selector instead of being
 * hardcoded. Everything else (summing `total` over every row, including
 * buckets the UI has no tile for) is unchanged.
 */
function foldBy<K extends string, R extends { total: number | string }>(
  keys: readonly K[],
  rows: R[],
  bucketOf: (row: R) => string | null,
): Record<K | "total", number> {
  const out = emptyFrom(keys);
  const known = new Set<string>(keys);
  for (const row of rows) {
    const n = Number(row.total) || 0;
    out.total += n;
    const bucket = bucketOf(row);
    if (bucket && known.has(bucket)) {
      out[bucket as K] = n;
    }
  }
  return out;
}

export async function getAmbassadorStats(): Promise<StatsResult<AmbassadorStats>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_ambassador_status_counts");
    if (error) throw new Error(error.message);
    return {
      stats: foldCounts(AMBASSADOR_STATUSES, (data ?? []) as never) as AmbassadorStats,
      ok: true,
    };
  } catch (err) {
    console.error("getAmbassadorStats failed:", err);
    return { stats: emptyFrom(AMBASSADOR_STATUSES) as AmbassadorStats, ok: false };
  }
}

export async function getInternshipStats(): Promise<StatsResult<InternshipStats>> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_internship_status_counts");
    if (error) throw new Error(error.message);
    return {
      stats: foldCounts(INTERNSHIP_STATUSES, (data ?? []) as never) as InternshipStats,
      ok: true,
    };
  } catch (err) {
    console.error("getInternshipStats failed:", err);
    return { stats: emptyFrom(INTERNSHIP_STATUSES) as InternshipStats, ok: false };
  }
}

/**
 * Triage band → count, for the summary pills above the applications table.
 *
 * Separate from the status counts on purpose, because the two answer different
 * questions: status is where HR has moved someone, triage is what the RQ rule
 * saw on the way in. A row is counted in exactly one of each.
 */
export async function getInternshipTriageStats(): Promise<
  StatsResult<InternshipTriageStats>
> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_internship_triage_counts");
    if (error) throw new Error(error.message);
    return {
      stats: foldBy(TRIAGE_BANDS, (data ?? []) as never[], (r: never) =>
        (r as { triage: string | null }).triage,
      ) as InternshipTriageStats,
      ok: true,
    };
  } catch (err) {
    console.error("getInternshipTriageStats failed:", err);
    return { stats: emptyFrom(TRIAGE_BANDS) as InternshipTriageStats, ok: false };
  }
}
