-- One reminder email per booking, sent ~2h before the session.
-- The flag prevents the cron from re-sending on subsequent ticks.
alter table public.bookings
  add column if not exists reminder_sent boolean not null default false;

-- Index the cron's lookup: due, not-yet-reminded, upcoming sessions.
create index if not exists bookings_reminder_due_idx
  on public.bookings (start_time)
  where reminder_sent = false and status <> 'cancelled';
