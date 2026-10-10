-- GrowQR Expert Booking V1 — booking-ops only (profiles stay in experts-data.ts)
-- Keyed by static expert.slug. All writes go through the service-role key.

----------------------------------------------------------------------
-- calendar_connections
--   V1: a single shared row (expert_slug NULL) for the GrowQR account.
--   Future: one row per expert_slug; resolution falls back to the shared row.
----------------------------------------------------------------------
create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  expert_slug text,
  google_email text,
  google_refresh_token text,
  is_active boolean not null default true,
  connected_at timestamptz not null default now()
);

-- Only one connection per slug (and one shared NULL-slug connection).
create unique index if not exists calendar_connections_default_idx
  on public.calendar_connections ((coalesce(expert_slug, '__default__')));

----------------------------------------------------------------------
-- expert_availability — weekly recurring rules
----------------------------------------------------------------------
create table if not exists public.expert_availability (
  id uuid primary key default gen_random_uuid(),
  expert_slug text not null,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun .. 6=Sat
  start_time time not null,
  end_time time not null,
  slot_duration_min int not null default 30,
  is_active boolean not null default true
);

create index if not exists expert_availability_slug_idx
  on public.expert_availability(expert_slug);

----------------------------------------------------------------------
-- bookings
----------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  expert_slug text not null,
  user_name text not null,
  user_email text not null,
  user_phone text,
  session_topic text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending',          -- pending|confirmed|completed|cancelled
  payment_status text not null default 'pending',   -- pending|paid|failed
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_inr int,
  google_event_id text,
  google_meet_link text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_slug_idx on public.bookings(expert_slug);
create index if not exists bookings_start_idx on public.bookings(start_time);

-- Block double-booking the same expert/slot for non-cancelled rows.
create unique index if not exists bookings_no_double_book_idx
  on public.bookings(expert_slug, start_time)
  where status <> 'cancelled';

----------------------------------------------------------------------
-- Row-Level Security
--   No public access on any of these tables. All reads/writes happen
--   server-side via the service-role key, which bypasses RLS.
----------------------------------------------------------------------
alter table public.calendar_connections enable row level security;
alter table public.expert_availability enable row level security;
alter table public.bookings enable row level security;

----------------------------------------------------------------------
-- Seed weekly availability: Mon–Fri 10:00–18:00, 30-min slots
----------------------------------------------------------------------
insert into public.expert_availability (expert_slug, day_of_week, start_time, end_time, slot_duration_min)
select s.slug, d.dow, time '10:00', time '18:00', 30
from (values
  ('pranav-prashar'), ('kanika-mishra'), ('bibin-babu'), ('ruchi-sharma')
) as s(slug)
cross join (values (1),(2),(3),(4),(5)) as d(dow)
where not exists (
  select 1 from public.expert_availability ea
  where ea.expert_slug = s.slug and ea.day_of_week = d.dow
);
