import "server-only";
import { createAdminClient } from "@/lib/supabase-server";
import { escapePostgrestPattern } from "@/lib/postgrest";
import { isCohort } from "@/lib/cohorts";
import { isAmbassadorStatus } from "@/lib/admin/statuses";
import { INTERNSHIP_STATUSES } from "@/components/admin/InternshipStatusBadge";
import { isTriageBand } from "@/lib/internship/triage";
import {
  FILTERABLE_ROLES,
  AVAILABILITY_VALUES,
  MODE_VALUES,
  DURATION_VALUES,
} from "@/lib/internship-options";

/**
 * One implementation of the admin list query, shared by the API route (which
 * the table component calls when filters change) and by the page's server
 * component (which renders the first page directly into the HTML).
 *
 * Before this existed the two paths were separate: the server rendered stats,
 * then the client mounted and fetched page 1 over the network. That second
 * round trip is pure latency — the functions run in a different region from
 * the database — so the table sat empty for the whole trip. Sharing the query
 * lets the server hand the first page down as `initialData`, and guarantees
 * the two paths can't drift apart on filtering or column selection.
 */

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export const AMBASSADOR_LIST_COLUMNS =
  "id,full_name,email,college,course,semester,passing_year,cohort,status,created_at,phone,whatsapp,linkedin,instagram,youtube,resume,why_join,why_fit,led_something,experience,internal_notes,student_id";

export const INTERNSHIP_LIST_COLUMNS =
  "id,full_name,email,phone,college,course,degree_specialization,graduation_year,preferred_role,skills,availability,mode,duration,languages,career_profile_score,status,created_at,updated_at,linkedin,portfolio,resume,why_intern,additional_notes,internal_notes,growqr_user_id,growqr_profile_url,growqr_rq_score,growqr_avatar_url,triage,triage_score";

export interface ListParams {
  page: number;
  limit: number;
  search: string;
  status: string;
  sort: "asc" | "desc";
}

export interface AmbassadorListParams extends ListParams {
  cohort: string;
}

export interface InternshipListParams extends ListParams {
  role: string;
  availability: string;
  mode: string;
  duration: string;
  triage: string;
}

export interface ListResult<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

/** A filter value the caller supplied that isn't in the canonical list. */
export class InvalidFilterError extends Error {}

function clampPaging(page: number, limit: number) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
  const safeLimit = Number.isFinite(limit)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(limit)))
    : DEFAULT_PAGE_SIZE;
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

/**
 * True when these params are exactly what the server component renders, so the
 * table can adopt `initialData` instead of immediately refetching the same rows.
 */
export function isDefaultAmbassadorParams(p: AmbassadorListParams): boolean {
  return (
    p.page === 1 &&
    p.limit === DEFAULT_PAGE_SIZE &&
    !p.search &&
    !p.status &&
    !p.cohort &&
    p.sort === "desc"
  );
}

export function isDefaultInternshipParams(p: InternshipListParams): boolean {
  return (
    p.page === 1 &&
    p.limit === DEFAULT_PAGE_SIZE &&
    !p.search &&
    !p.status &&
    !p.role &&
    !p.availability &&
    !p.mode &&
    !p.duration &&
    !p.triage &&
    p.sort === "desc"
  );
}

export async function fetchAmbassadorPage<T = Record<string, unknown>>(
  params: AmbassadorListParams,
): Promise<ListResult<T>> {
  const { page, limit, offset } = clampPaging(params.page, params.limit);

  // Unknown filter values are rejected rather than passed through: they would
  // match nothing, and an empty table reads in the UI as "nobody has applied"
  // instead of "that filter is wrong".
  if (params.cohort && !isCohort(params.cohort)) {
    throw new InvalidFilterError("Invalid cohort");
  }
  if (params.status && !isAmbassadorStatus(params.status)) {
    throw new InvalidFilterError("Invalid status");
  }

  const admin = createAdminClient();
  let query = admin
    .from("ambassador_applications")
    .select(AMBASSADOR_LIST_COLUMNS, { count: "exact" });

  if (params.search) {
    // `search` lands in a PostgREST filter string on a service-role client, so
    // an unescaped comma or paren would let a caller reshape the whole query.
    // Quoting the value is what makes those characters literal.
    const safe = escapePostgrestPattern(params.search);
    query = query.or(
      `full_name.ilike."%${safe}%",email.ilike."%${safe}%",college.ilike."%${safe}%"`,
    );
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.cohort) query = query.eq("cohort", params.cohort);

  query = query
    .order("created_at", { ascending: params.sort === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as T[],
    count: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}

export async function fetchInternshipPage<T = Record<string, unknown>>(
  params: InternshipListParams,
): Promise<ListResult<T>> {
  const { page, limit, offset } = clampPaging(params.page, params.limit);

  // Validated against the canonical lists rather than passed through: an
  // unrecognised value would return zero rows, which reads in the UI as
  // "nobody has applied" instead of "that filter is wrong".
  if (params.role && !FILTERABLE_ROLES.includes(params.role)) {
    throw new InvalidFilterError("Invalid role");
  }
  if (params.availability && !AVAILABILITY_VALUES.includes(params.availability)) {
    throw new InvalidFilterError("Invalid availability");
  }
  if (params.mode && !MODE_VALUES.includes(params.mode)) {
    throw new InvalidFilterError("Invalid mode");
  }
  if (params.duration && !DURATION_VALUES.includes(params.duration)) {
    throw new InvalidFilterError("Invalid duration");
  }
  if (params.triage && !isTriageBand(params.triage)) {
    throw new InvalidFilterError("Invalid triage band");
  }
  if (
    params.status &&
    !(INTERNSHIP_STATUSES as readonly string[]).includes(params.status)
  ) {
    throw new InvalidFilterError("Invalid status");
  }

  const admin = createAdminClient();
  let query = admin
    .from("internship_applications")
    .select(INTERNSHIP_LIST_COLUMNS, { count: "exact" });

  if (params.search) {
    const safe = escapePostgrestPattern(params.search);
    query = query.or(
      `full_name.ilike."%${safe}%",email.ilike."%${safe}%",college.ilike."%${safe}%",preferred_role.ilike."%${safe}%"`,
    );
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.role) query = query.eq("preferred_role", params.role);
  if (params.availability) query = query.eq("availability", params.availability);
  if (params.mode) query = query.eq("mode", params.mode);
  if (params.duration) query = query.eq("duration", params.duration);
  if (params.triage) query = query.eq("triage", params.triage);

  query = query
    .order("created_at", { ascending: params.sort === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: (data ?? []) as unknown as T[],
    count: count ?? 0,
    page,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  };
}
