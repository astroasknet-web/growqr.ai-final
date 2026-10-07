-- 0019_attendee_notifications.sql
-- Additive: one column and its generated companion on call_bookings.
--
-- The attendee now receives a GrowQR-branded confirmation alongside Cal.com's
-- own. Cal's email carries the calendar invite and the reschedule/cancel links;
-- ours carries the brand, what happens next, and who to contact — so both are
-- wanted, and neither replaces the other.
--
-- WHY A SEPARATE COUNTER rather than reusing notifications_count: the team
-- notification and the attendee confirmation are two different sends to two
-- different audiences that can fail independently. Sharing one counter means
-- the first successful send advances it and the second is never retried — the
-- attendee would silently never hear from us while the team saw nothing wrong.
-- Counting them apart keeps each one's retry lane honest.
--
-- Both counters chase events_count, so a reschedule or cancellation re-opens
-- both lanes exactly once.

alter table public.call_bookings
  add column if not exists attendee_notifications_count integer not null default 0;

alter table public.call_bookings
  drop column if exists attendee_notifications_pending;

alter table public.call_bookings
  add column attendee_notifications_pending boolean
  generated always as (attendee_notifications_count < events_count) stored;

-- Partial index for the reconciliation lane, matching the team-notification one.
create index if not exists call_bookings_attendee_notifications_pending_idx
  on public.call_bookings (created_at)
  where attendee_notifications_pending;

comment on column public.call_bookings.attendee_notifications_count is
  'Branded confirmations sent to the ATTENDEE, counted separately from the internal team notification so a failure to reach one is never masked by the other succeeding.';
