-- B2B lead capture — EnterpriseContactModal (solution pages + agent pages CTAs).
-- Service-role only, same pattern as expert_submissions: RLS enabled, no
-- policies, so the anon key cannot read or write this table.

create table if not exists public.b2b_leads (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  company     text not null,
  team_size   text,
  message     text,
  agent       text,        -- e.g. "RQ-Rohan" — which agent page the CTA came from
  solution    text,        -- e.g. "Startups" — which solution page, for general enquiries
  page_path   text,        -- window.location.pathname at submit time
  created_at  timestamptz not null default now()
);

create index if not exists b2b_leads_created_at_idx on public.b2b_leads(created_at desc);

alter table public.b2b_leads enable row level security;
-- No policies: writes happen only through the service-role route
-- (/api/b2b-lead); the anon key cannot read or write this table.
