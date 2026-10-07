-- Stores emails of people who visited the ambassador apply page
-- while applications were closed, so they can be notified when
-- the next cohort opens.
create table if not exists public.ambassador_waitlist (
  id          bigint generated always as identity primary key,
  email       text not null,
  created_at  timestamptz not null default now(),
  constraint ambassador_waitlist_email_key unique (email)
);

alter table public.ambassador_waitlist enable row level security;

-- Allow inserts from the anon key (server-side API route uses the anon key)
create policy "anon insert" on public.ambassador_waitlist
  for insert to anon with check (true);
