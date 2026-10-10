-- RQ-Score triage band for internship applications.
--
-- We have captured `growqr_rq_score` since migration 0028 and done nothing
-- with it but render it. This migration gives it a job: every application is
-- banded at submit time so HR opens the list already split into "worth a look"
-- and "parked", instead of reading 100 rows to find the 20 that matter.
--
-- Why a separate column instead of writing into `status`:
--
-- `status` is the human pipeline. If automation wrote `shortlisted` into it,
-- nobody could later tell an HR shortlist from a machine one, and any re-run
-- of the rule would overwrite a decision a person made. Keeping the band
-- separate means the machine can only ever inform, never overwrite. Same
-- machine-never-clobbers-human rule the app/Zoho ticketing handoff settled on
-- for its status columns.
--
-- `on_hold` is deliberately NOT "rejected". It means "below the bar today,
-- parked for review" — a band, not a decision.

alter table public.internship_applications
  -- The band itself. Written once at submit, never recomputed.
  add column if not exists triage       text,
  -- The RQ value the rule actually saw. The candidate's live RQ-Score can move
  -- afterwards (they keep working on their profile), and a band that can no
  -- longer explain itself is worse than no band. Same immutable-capture
  -- reasoning as growqr_profile_snapshot in 0028.
  add column if not exists triage_score numeric,
  add column if not exists triaged_at   timestamptz;

alter table public.internship_applications
  drop constraint if exists internship_applications_triage_check,
  drop constraint if exists internship_applications_triage_score_check;

alter table public.internship_applications
  add constraint internship_applications_triage_check
    check (triage is null or triage = any (array['auto_shortlist','on_hold','unscored'])),
  -- Mirrors the growqr_rq_score bound from 0028.
  add constraint internship_applications_triage_score_check
    check (triage_score is null or triage_score between 0 and 100);

-- HR filters on this the way it already filters status.
create index if not exists internship_applications_triage_idx
  on public.internship_applications (triage);

-- Backfill. The threshold (50) is duplicated from lib/internship/triage.ts on
-- purpose: this runs once, against rows that predate the rule, and hardcoding
-- it here keeps the migration a self-contained historical record of what the
-- bar was on the day it was applied. Later threshold changes belong in the
-- TypeScript constant and deliberately do NOT rewrite existing bands.
update public.internship_applications
   set triage = case
                  when growqr_rq_score is null then 'unscored'
                  when growqr_rq_score >= 50   then 'auto_shortlist'
                  else 'on_hold'
                end,
       triage_score = growqr_rq_score,
       triaged_at   = created_at
 where triage is null;

-- ── Dashboard tile aggregate ──────────────────────────────────────────────
-- Same shape, security posture and grants as admin_internship_status_counts
-- in migration 0034: one round trip instead of one head-count per band.
create or replace function public.admin_internship_triage_counts()
returns table (triage text, total bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select i.triage, count(*)::bigint
  from public.internship_applications i
  group by i.triage;
$$;

revoke all on function public.admin_internship_triage_counts() from public;
revoke all on function public.admin_internship_triage_counts() from anon;
revoke all on function public.admin_internship_triage_counts() from authenticated;
grant execute on function public.admin_internship_triage_counts() to service_role;
