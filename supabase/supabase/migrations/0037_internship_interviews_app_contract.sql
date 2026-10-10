-- Aligns internship_interviews with the GrowQR interview-service contract.
--
-- Migration 0036 modelled the interview round on assumptions. The real
-- contract turns out to be a purpose-built B2B API that already does what we
-- need (interview-service, api.growqr.ai/interview/api/v1):
--
--   POST /interviews/assignments    assign by EMAIL + role + round,
--                                   returns batch_id and one assignment_id
--                                   per assignee
--   POST /interviews/results:bulk   up to 500 assignment_ids in, results out,
--                                   with a per-id completion_status. "Pure DB
--                                   read; no AI calls in the hot path", so it
--                                   is safe to poll on a schedule.
--   GET  /interviews/assignments    a single seeker's assignments, by email
--
-- Two consequences worth recording:
--
-- 1. The join key is the candidate's EMAIL, which internship_applications
--    already holds and already enforces UNIQUE. The Clerk-id vs profile-UUID
--    problem that made an inbound webhook awkward simply does not arise.
-- 2. Because results are pulled rather than pushed, there is no webhook to
--    secure, no replay ledger, and the sync self-heals after downtime.
--
-- Column changes below mirror the service's ResultItem verbatim rather than
-- reinterpreting it.

-- `recommendation` was ours: a hire/no-hire verdict. The service ALSO returns
-- a field called `recommendations` — an array of coaching suggestions for the
-- candidate, nothing to do with hiring. Two fields one letter apart, meaning
-- opposite things, is a bug waiting to happen, so ours is renamed to say who
-- it belongs to.
alter table public.internship_interviews
  rename column recommendation to hr_verdict;

alter table public.internship_interviews
  drop constraint if exists internship_interviews_recommendation_check;

alter table public.internship_interviews
  add constraint internship_interviews_hr_verdict_check
    check (hr_verdict is null or hr_verdict = any (array['strong_yes','yes','maybe','no']));

alter table public.internship_interviews
  -- Straight from ResultItem. Text arrays rather than jsonb: they are flat
  -- lists of sentences, and array_length beats jsonb_array_length everywhere
  -- we would want to count them.
  add column if not exists strengths        text[],
  add column if not exists weaknesses       text[],
  -- The service's `recommendations`, named for what it is so it can never be
  -- confused with hr_verdict.
  add column if not exists coaching_notes   text[],

  -- session_meta on the review payload.
  add column if not exists round_type       text,
  add column if not exists difficulty       text,
  add column if not exists target_role      text,
  add column if not exists duration_minutes integer,

  -- The service hands back two identifiers. `assignment_id` is the canonical
  -- key for results:bulk and lands in external_interview_id (already unique).
  -- `session_id` only exists once the candidate actually starts, and is what
  -- GET /review/{session_id} takes, so it is worth keeping separately.
  add column if not exists external_session_id text,
  -- Returned once per assignment batch. Not unique per row by design.
  add column if not exists batch_id            text;

alter table public.internship_interviews
  drop constraint if exists internship_interviews_round_type_check,
  drop constraint if exists internship_interviews_difficulty_check,
  drop constraint if exists internship_interviews_duration_check;

alter table public.internship_interviews
  add constraint internship_interviews_round_type_check
    check (round_type is null or round_type = any (array['warm_up','behavioral','technical'])),
  -- 'hard' is not in the observed data (only easy and medium appear across
  -- every captured leaderboard) but is in the service's own vocabulary, so it
  -- is allowed rather than waiting to reject a real value later.
  add constraint internship_interviews_difficulty_check
    check (difficulty is null or difficulty = any (array['easy','medium','hard'])),
  add constraint internship_interviews_duration_check
    check (duration_minutes is null or duration_minutes between 0 and 600);

create index if not exists internship_interviews_session_idx
  on public.internship_interviews (external_session_id)
  where external_session_id is not null;

-- The poller's work queue: rounds that were assigned but have no result yet.
create index if not exists internship_interviews_pending_sync_idx
  on public.internship_interviews (status)
  where external_interview_id is not null and completed_at is null;
