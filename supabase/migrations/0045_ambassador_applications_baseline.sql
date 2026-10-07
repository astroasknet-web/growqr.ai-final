-- Baseline definition for public.ambassador_applications.
--
-- This table predates the migrations folder, so until now it existed ONLY as
-- generated types in types/database.ts. Rebuilding a database by replaying
-- supabase/migrations/ produced every other table and then failed on this one,
-- and the later migrations that ALTER it (0002 UTM, 0026 index, 0027 identity,
-- 0029 semester, 0031 cohort, 0033 indexes, 0034 stats RPC) had nothing to
-- attach to.
--
-- Deliberately a no-op against the live database: `if not exists` means an
-- existing table is left exactly as it is, and this migration only does real
-- work on a fresh rebuild.
--
-- Columns only. The CHECK and UNIQUE constraints, the cohort default and the
-- indexes are intentionally NOT repeated here — 0027, 0029, 0031 and 0033 add
-- them, and duplicating them would make those migrations fail on a fresh run
-- (Postgres has no `add constraint if not exists`). Column nullability mirrors
-- types/database.ts, which is generated from the live schema.

create table if not exists public.ambassador_applications (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  -- Identity
  full_name        text not null,
  email            text not null unique,
  phone            text not null,
  whatsapp         text not null,
  student_id       text not null,
  gender           text,
  aadhaar_number   text,

  -- Education
  college          text not null,
  college_location text,
  course           text not null,
  passing_year     text not null,
  semester         text,

  -- Location
  home_town        text,
  current_address  text,

  -- Online presence
  linkedin         text not null,
  instagram        text,
  youtube          text,
  resume           text not null,

  -- Essays
  why_join         text not null,
  why_fit          text not null,
  led_something    text not null,
  experience       text,

  -- Review workflow. `notes` is the older column; `internal_notes` is what the
  -- admin detail page writes. Both are kept because live rows use both.
  status           text not null default 'pending',
  notes            text,
  internal_notes   text,

  -- Intake this application belongs to. 0031 adds the default and NOT NULL.
  cohort           text,

  -- Referral attribution. utm_medium carries the referring ambassador's id.
  utm_source       text,
  utm_medium       text,
  utm_campaign     text
);

-- Matches every other table in this schema: service-role access only, reached
-- through the API routes. Anon writes were revoked across the board in 0021.
alter table public.ambassador_applications enable row level security;
