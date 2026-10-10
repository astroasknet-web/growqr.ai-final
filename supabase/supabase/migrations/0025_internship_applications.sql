-- Internship Hiring: dedicated applications table, modeled on
-- ambassador_applications' constraint style (0002/0007/0008/0020/0021).
-- RLS enabled, zero policies — service-role only, same pattern as
-- b2b_leads / expert_submissions / booking_intents (the repo's current
-- best-practice, skipping the anon-insert-then-revoke history ambassador went through).

create table if not exists public.internship_applications (
  id               uuid primary key default gen_random_uuid(),

  full_name        text not null check (char_length(trim(both from full_name)) between 2 and 200),
  email            text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone            text not null check (char_length(trim(both from phone)) between 7 and 25),

  college          text not null check (char_length(trim(both from college)) between 2 and 300),
  course           text not null check (char_length(trim(both from course)) between 2 and 200),
  graduation_year  text not null check (graduation_year ~ '^\d{4}$'),

  preferred_role   text not null check (char_length(trim(both from preferred_role)) between 2 and 150),
  skills           text not null check (char_length(trim(both from skills)) between 2 and 500),
  availability     text not null check (availability = any (array['immediately','within_2_weeks','within_a_month','flexible'])),

  linkedin         text check (linkedin is null or linkedin ~* '^https?://'),
  portfolio        text check (portfolio is null or portfolio ~* '^https?://'),

  -- Storage path (not a signed URL) — resolved to a fresh signed URL at
  -- render time, so admin resume links never expire the way a stored
  -- 1-year signed URL eventually would.
  resume           text not null check (char_length(trim(both from resume)) between 3 and 500),

  why_intern       text not null check (char_length(trim(both from why_intern)) >= 20),
  additional_notes text check (additional_notes is null or char_length(additional_notes) <= 2000),

  status           text not null default 'new'
                     check (status = any (array[
                       'new','screening','shortlisted','interview',
                       'selected','waitlist','rejected','offer','joined'
                     ])),
  internal_notes   text,

  utm_source       text,
  utm_medium       text,
  utm_campaign     text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint internship_applications_email_key unique (email),
  constraint internship_applications_phone_key unique (phone)
);

create index if not exists internship_applications_created_at_idx
  on public.internship_applications (created_at desc);
create index if not exists internship_applications_status_idx
  on public.internship_applications (status);

-- Reuses the trigger function already backing events.updated_at.
drop trigger if exists set_updated_at on public.internship_applications;
create trigger set_updated_at
  before update on public.internship_applications
  for each row execute function public.update_updated_at_column();

alter table public.internship_applications enable row level security;
-- No policies: anon/authenticated get zero access. All reads/writes go
-- through createAdminClient() (service role) in API routes, same as
-- ambassador_applications post-migration-0021.

-- Private resume bucket — signed URLs only, matches the (intended) access
-- pattern for ambassador's "resumes" bucket, but private from day one.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('internship-resumes', 'internship-resumes', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
