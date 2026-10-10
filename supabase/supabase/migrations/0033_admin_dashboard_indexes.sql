-- Admin dashboard read-path indexes.
--
-- The admin list views all run the same shape: optionally filter by status,
-- then ORDER BY created_at DESC and take one page. The existing single-column
-- status indexes serve the filter but leave Postgres sorting the matches
-- afterwards, so add composites that serve both halves from one scan.
--
-- The search boxes run `ilike '%term%'` across several text columns, which no
-- btree index can serve. pg_trgm makes those index-scannable instead of a
-- sequential scan over the whole table.

create extension if not exists pg_trgm;

-- ── Ambassador applications ────────────────────────────────────────────────
create index if not exists ambassador_applications_status_created_idx
  on public.ambassador_applications (status, created_at desc);

create index if not exists ambassador_applications_full_name_trgm_idx
  on public.ambassador_applications using gin (full_name gin_trgm_ops);

create index if not exists ambassador_applications_email_trgm_idx
  on public.ambassador_applications using gin (email gin_trgm_ops);

create index if not exists ambassador_applications_college_trgm_idx
  on public.ambassador_applications using gin (college gin_trgm_ops);

-- ── Internship applications ────────────────────────────────────────────────
create index if not exists internship_applications_status_created_idx
  on public.internship_applications (status, created_at desc);

create index if not exists internship_applications_full_name_trgm_idx
  on public.internship_applications using gin (full_name gin_trgm_ops);

create index if not exists internship_applications_email_trgm_idx
  on public.internship_applications using gin (email gin_trgm_ops);

create index if not exists internship_applications_college_trgm_idx
  on public.internship_applications using gin (college gin_trgm_ops);

create index if not exists internship_applications_preferred_role_trgm_idx
  on public.internship_applications using gin (preferred_role gin_trgm_ops);

-- ── Housekeeping flagged by the Supabase performance advisor ───────────────
-- ambassador_waitlist_email_idx is byte-identical to the constraint-backing
-- ambassador_waitlist_email_key. Two identical indexes cost double on every
-- write and buy nothing on read.
drop index if exists public.ambassador_waitlist_email_idx;

-- call_bookings.intent_id is a foreign key with no covering index, so every
-- cascade check and every join by intent has to scan the table.
create index if not exists call_bookings_intent_id_idx
  on public.call_bookings (intent_id);
