-- Two-stage pre-session reminders: 24 hours before and 1 hour before.
--
-- Replaces the single `reminder_sent` flag (which drove one ~2h reminder that
-- never actually fired — the daily cron's 2h eligibility window and the
-- 10:00-18:00 IST availability window did not overlap). `reminder_sent` is
-- left in place as a legacy column; nothing writes it any more.
--
-- Each stage is claimed independently so a failure or a retry on one stage
-- never blocks or double-sends the other.

alter table public.bookings
  add column if not exists reminder_24h_sent boolean not null default false,
  add column if not exists reminder_1h_sent  boolean not null default false;

-- Resend email ids for the scheduled sends, so a stage can be cancelled or
-- rescheduled later (Resend exposes both against the email id). One id per
-- recipient: [attendee, expert].
alter table public.bookings
  add column if not exists reminder_24h_email_ids text[],
  add column if not exists reminder_1h_email_ids  text[];

-- Backfill: bookings that have already started can never be reminded ahead of
-- time. Mark them resolved so the scheduler does not consider them and no
-- historical booking gets a surprise email on first run.
update public.bookings
set reminder_24h_sent = true,
    reminder_1h_sent  = true
where start_time <= now();

-- The scheduler's lookup: upcoming, non-cancelled, at least one stage pending.
create index if not exists bookings_reminder_pending_idx
  on public.bookings (start_time)
  where status <> 'cancelled'
    and (reminder_24h_sent = false or reminder_1h_sent = false);

-- The old single-stage index is dead now that nothing reads `reminder_sent`.
drop index if exists public.bookings_reminder_due_idx;
