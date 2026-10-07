-- AI fallback layer observability.
--
-- Additive only: no drops, no renames, no type changes. The existing five
-- event types keep working untouched.
--
-- WHY THIS MIGRATION IS REQUIRED: bot_events.event_type carries a CHECK
-- constraint pinning it to exactly five values. Adding AI event types in
-- TypeScript alone would make every AI log write fail at the database with a
-- constraint violation — and logEvent() swallows its own errors, so the
-- failure would be silent and the AI layer would run completely unobserved.
--
-- Verified against the live database 2026-08-01:
--   bot_events_event_type_check
--     CHECK (event_type = ANY (ARRAY['lead_created','task_created',
--            'note_created','email_sent','handoff_requested']))

alter table public.bot_events
  drop constraint if exists bot_events_event_type_check;

alter table public.bot_events
  add constraint bot_events_event_type_check
  check (event_type = any (array[
    -- existing, unchanged
    'lead_created',
    'task_created',
    'note_created',
    'email_sent',
    'handoff_requested',
    -- AI fallback layer
    'ai_answered',   -- served to the visitor, guards passed
    'ai_declined',   -- model set answered=false, or confidence below high
    'ai_rejected',   -- a guard rejected the answer (payload.rejection says which)
    'ai_timeout',    -- no response inside the 2,200ms budget
    'ai_error'       -- API error, misconfiguration, unparseable response
  ]));

-- ── bot_unanswered.answered_by ─────────────────────────────────────────────
--
-- The KB backlog must stay honest. logUnanswered() still fires on EVERY miss,
-- including ones the AI answers; without this column an AI answer would
-- silently suppress the signal that a KB article is missing, exactly when the
-- content gap is widest. See AI_FALLBACK_DESIGN.md §8.2.
--
--   null       — nobody answered it; the visitor got the fallback or a human
--   'ai'       — the AI layer served an answer, but the gap is still real

alter table public.bot_unanswered
  add column if not exists answered_by text;

alter table public.bot_unanswered
  drop constraint if exists bot_unanswered_answered_by_check;

alter table public.bot_unanswered
  add constraint bot_unanswered_answered_by_check
  check (answered_by is null or answered_by in ('ai'));

-- Partial index: the triage query is "show me gaps nothing answered", which is
-- the null case, and the AI-answered rows are the smaller, separately-reviewed
-- set (§6.2's weekly promotion pass).
create index if not exists bot_unanswered_ai_idx
  on public.bot_unanswered (created_at)
  where answered_by is not null;
