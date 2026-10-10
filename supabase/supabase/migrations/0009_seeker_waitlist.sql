-- Stores emails of US (USD) job-seeker visitors who hit a "Join the Waitlist"
-- CTA while subscriptions aren't live for their region yet, so they can be
-- notified when self-serve signup opens.
create table if not exists public.seeker_waitlist (
  id          bigint generated always as identity primary key,
  email       text not null,
  source      text, -- which CTA it came from, e.g. "homepage-pricing", "individuals-hero"
  created_at  timestamptz not null default now(),
  constraint seeker_waitlist_email_key unique (email)
);

alter table public.seeker_waitlist enable row level security;

-- Allow inserts from the anon key (server-side API route uses the anon key)
create policy "anon insert" on public.seeker_waitlist
  for insert to anon with check (true);
