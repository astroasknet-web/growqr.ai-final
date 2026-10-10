-- Expert Profile Intake — temporary collection table
-- Each row is one expert's submitted profile, pending review before being
-- promoted into features/experts/data/experts-data.ts.
-- Writes happen ONLY through the service-role route handler (/api/expert-intake);
-- no public RLS policy is added, so the anon key cannot read or write this table.

create table if not exists public.expert_submissions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',

  -- Scalar / top-level fields
  name text not null,
  display_name text,
  email text not null,
  role text not null,
  tag text not null,
  country text not null,
  location text,
  persona text,
  years_experience int not null default 0,
  session_duration text not null,
  price text not null,
  headline text not null,
  bio text not null,
  intro text not null,
  about text not null,
  image_url text not null,
  trusted_by_label text,

  -- Nested sections (arrays / objects)
  expertise jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  industries jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  work_experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  awards jsonb not null default '[]'::jsonb,
  what_you_get jsonb not null default '[]'::jsonb,
  stats jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  socials jsonb not null default '[]'::jsonb,
  supports jsonb not null default '[]'::jsonb,
  trusted_by jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists expert_submissions_created_at_idx on public.expert_submissions(created_at desc);
create index if not exists expert_submissions_status_idx on public.expert_submissions(status);

-- Lock the table down: enable RLS with no policies → only the service role
-- (used by the API route) can read/write. The anon/public key is denied.
alter table public.expert_submissions enable row level security;
