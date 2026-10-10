-- Stamps each ambassador application with the intake it belongs to, so the
-- admin panel can filter Cohort 01 from Cohort 02.
--
-- Backfill rule: every row that exists when this migration runs is Cohort 01.
-- Cohort 02 opened on 2026-08-24 (the commit that flipped the public copy from
-- "Cohort 01" to "Cohort 02"), and nothing had been submitted against it yet,
-- so "already in the table" is an exact proxy for "Cohort 01" here. Deliberately
-- not a created_at cutoff: that would need a timestamp nobody recorded, and
-- would silently mislabel rows either side of the boundary.
--
-- Three-step rather than `add column ... not null default '02'`, because that
-- form stamps the 1,124 historical rows with '02' and there is then no way to
-- tell them apart from real Cohort 02 submissions.

-- 1. Add nullable so existing rows land with no cohort.
alter table public.ambassador_applications
  add column if not exists cohort text;

-- 2. Everything already in the table is the first intake.
update public.ambassador_applications
  set cohort = '01'
  where cohort is null;

-- 3. Now that no nulls remain, lock it down. New rows default to the live
--    intake; app/api/send-ambassador/route.ts also writes it explicitly, and
--    lib/cohorts.ts is the source of truth for both.
alter table public.ambassador_applications
  alter column cohort set default '02';

alter table public.ambassador_applications
  alter column cohort set not null;

alter table public.ambassador_applications
  drop constraint if exists ambassador_applications_cohort_check;

alter table public.ambassador_applications
  add constraint ambassador_applications_cohort_check
    check (cohort = any (array['01','02']));

-- Admin list and export both filter on this; it pairs with the existing
-- created_at desc ordering.
create index if not exists ambassador_applications_cohort_idx
  on public.ambassador_applications (cohort, created_at desc);
