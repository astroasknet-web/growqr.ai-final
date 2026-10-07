-- Interview and assessment rounds for an internship application.
--
-- The first round is an AI assessment run by RQ-Vera inside the GrowQR app
-- (app.growqr.ai), not here. This table is where that result lands so HR can
-- read it next to the application, and where the human rounds that follow are
-- scheduled and recorded.
--
-- Two kinds, one table, because HR reads them as one sequence:
--   ai_assessment    — run in the app, synced back, scored by the product
--   final_discussion — a one-on-one call, scheduled and judged by a person
--
-- What this table deliberately does NOT do: change
-- internship_applications.status. A completed round with a strong score is an
-- input to a hiring decision, not the decision. Same rule as the triage band
-- in 0035 — the machine informs, a person decides.

create table if not exists public.internship_interviews (
  id                    uuid primary key default gen_random_uuid(),

  application_id        uuid not null
                          references public.internship_applications(id) on delete cascade,

  -- Denormalised from the application. The inbound sync from the app matches
  -- on the GrowQR user id (it has no idea what our application ids are), and
  -- carrying it here means that match is one indexed lookup rather than a join.
  growqr_user_id        uuid,

  round                 smallint not null default 1 check (round between 1 and 10),

  kind                  text not null default 'ai_assessment'
                          check (kind = any (array['ai_assessment','final_discussion'])),

  -- One status set covering both kinds. `invited`/`in_progress`/`expired`
  -- belong to the AI round; `scheduled`/`no_show` to the human one;
  -- `completed`/`cancelled` to both.
  status                text not null default 'invited'
                          check (status = any (array[
                            'invited','scheduled','in_progress',
                            'completed','cancelled','expired','no_show'
                          ])),

  -- Where the row came from. Shown in the UI on every completed round, so an
  -- HR-typed result is never mistaken for one the product produced.
  source                text not null default 'manual'
                          check (source = any (array['manual','app_sync'])),

  -- The app's own id for the interview. Unique so a webhook replay updates the
  -- row it already created instead of inserting a second one.
  external_interview_id text,

  -- Deep link into the app for the candidate to take the assessment.
  interview_url         text check (interview_url is null or interview_url ~* '^https?://'),

  -- Scheduling, used by final_discussion.
  scheduled_at          timestamptz,
  interviewer           text check (interviewer is null or char_length(trim(both from interviewer)) between 2 and 200),
  meeting_url           text check (meeting_url is null or meeting_url ~* '^https?://'),

  -- Lifecycle
  invited_at            timestamptz,
  due_at                timestamptz,
  started_at            timestamptz,
  completed_at          timestamptz,

  -- Outcome. `score` is out of `max_score` rather than assumed to be a
  -- percentage, because the app's scoring scale is its own and may not be 100.
  score                 numeric check (score is null or score >= 0),
  max_score             numeric not null default 100 check (max_score > 0),
  recommendation        text check (recommendation is null or recommendation = any (array[
                            'strong_yes','yes','maybe','no'
                          ])),
  summary               text check (summary is null or char_length(summary) <= 4000),
  -- [{ "name": "Communication", "score": 82, "max": 100 }, ...]
  competencies          jsonb,
  transcript_url        text check (transcript_url is null or transcript_url ~* '^https?://'),

  -- The last payload the app sent, kept verbatim. Same immutable-capture
  -- reasoning as growqr_profile_snapshot in 0028: the rendered fields are our
  -- reading of the result, this is the result.
  raw                   jsonb,

  -- Admin email when a person entered the outcome by hand. Null for app_sync.
  recorded_by           text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- One row per round per application, so "invite round 1" twice updates
  -- rather than duplicates.
  constraint internship_interviews_application_round_key unique (application_id, round)
);

-- Partial unique: many rows legitimately have no external id (every manually
-- scheduled discussion), and NULLs would not collide anyway, but stating it
-- as a partial index documents the intent.
create unique index if not exists internship_interviews_external_id_key
  on public.internship_interviews (external_interview_id)
  where external_interview_id is not null;

create index if not exists internship_interviews_application_idx
  on public.internship_interviews (application_id, round);
create index if not exists internship_interviews_growqr_user_idx
  on public.internship_interviews (growqr_user_id);
create index if not exists internship_interviews_status_idx
  on public.internship_interviews (status);

drop trigger if exists set_updated_at on public.internship_interviews;
create trigger set_updated_at
  before update on public.internship_interviews
  for each row execute function public.update_updated_at_column();

-- RLS on, zero policies: service-role only, reached exclusively through
-- createAdminClient() in API routes. Same posture as internship_applications
-- (0025) and every table added since.
alter table public.internship_interviews enable row level security;
