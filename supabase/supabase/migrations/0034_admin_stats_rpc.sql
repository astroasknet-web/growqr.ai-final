-- Single-round-trip aggregates for the admin dashboard.
--
-- Each dashboard tab used to issue one head-count request per status (seven
-- for ambassadors, ten for internships) plus separate queries for the events
-- tiles. Every one of those is its own HTTPS request to PostgREST, and the
-- functions run in a different region from the database, so the cost was
-- almost entirely round-trip latency rather than query time — each of these
-- aggregates executes in well under a millisecond.
--
-- These functions replace the fan-out with one call per tab.
--
-- Security: all of them are SECURITY INVOKER (the default), so they carry the
-- caller's own RLS. The application tables are RLS-deny-all with no policies,
-- meaning anon/authenticated would get zero rows regardless — but EXECUTE is
-- revoked from them anyway so the functions are not part of the public API
-- surface at all. Only service_role, which the server-side admin client uses,
-- can call them.

-- ── Ambassador applications: status → count ────────────────────────────────
create or replace function public.admin_ambassador_status_counts()
returns table (status text, total bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select a.status, count(*)::bigint
  from public.ambassador_applications a
  group by a.status;
$$;

revoke all on function public.admin_ambassador_status_counts() from public;
revoke all on function public.admin_ambassador_status_counts() from anon;
revoke all on function public.admin_ambassador_status_counts() from authenticated;
grant execute on function public.admin_ambassador_status_counts() to service_role;

-- ── Internship applications: status → count ────────────────────────────────
create or replace function public.admin_internship_status_counts()
returns table (status text, total bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select i.status, count(*)::bigint
  from public.internship_applications i
  group by i.status;
$$;

revoke all on function public.admin_internship_status_counts() from public;
revoke all on function public.admin_internship_status_counts() from anon;
revoke all on function public.admin_internship_status_counts() from authenticated;
grant execute on function public.admin_internship_status_counts() to service_role;

-- ── Events: the four dashboard tiles in one row ────────────────────────────
create or replace function public.admin_event_stats()
returns table (total bigint, active bigint, inactive bigint, total_registrations bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    (select count(*)::bigint from public.events),
    (select count(*)::bigint from public.events where is_active),
    (select count(*)::bigint from public.events where not is_active),
    (select count(*)::bigint from public.event_registrations);
$$;

revoke all on function public.admin_event_stats() from public;
revoke all on function public.admin_event_stats() from anon;
revoke all on function public.admin_event_stats() from authenticated;
grant execute on function public.admin_event_stats() to service_role;

-- ── Registrations per event ────────────────────────────────────────────────
-- The events list previously fetched every matching registration row and
-- counted them in JavaScript. PostgREST caps an unranged select at 1,000
-- rows, so once total registrations crossed that the per-event counts on the
-- list silently started undercounting. Aggregating in the database removes
-- both the cap and the payload.
create or replace function public.admin_event_registration_counts()
returns table (event_id uuid, total bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select r.event_id, count(*)::bigint
  from public.event_registrations r
  group by r.event_id;
$$;

revoke all on function public.admin_event_registration_counts() from public;
revoke all on function public.admin_event_registration_counts() from anon;
revoke all on function public.admin_event_registration_counts() from authenticated;
grant execute on function public.admin_event_registration_counts() to service_role;
