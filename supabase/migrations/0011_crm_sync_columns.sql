-- 0011_crm_sync_columns.sql
-- Phase 2 of the website → Zoho CRM integration. STRICTLY ADDITIVE:
-- no column drops, renames, type changes, or policy changes. Existing
-- inserts continue to work unchanged (every new column is nullable or
-- defaulted).
--
--   1. Snapshot the two dashboard-created tables (no-ops in production)
--   2. Attribution + CRM sync-state columns on the four lead tables
--   3. Status guard constraints
--   4. Partial indexes for the sync-queue sweep (3 sync-enabled tables)
--   5. Mark all pre-integration rows 'legacy' (never auto-synced)

-- ────────────────────────────────────────────────────────────────────
-- 1. Snapshots of dashboard-created tables.
-- contact_messages and newsletter_subscribers were created in the
-- Supabase dashboard and had no migration on record. These CREATEs are
-- no-ops in production (both tables exist) but bring the schemas under
-- version control and make fresh environments reproducible. Column
-- lists verified against the live database on 2026-07-22.
-- NOTE: RLS policies for fresh environments are not recreated here —
-- production policies predate this file and are unchanged by it.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  type text default 'general',
  created_at timestamptz default now(),
  read boolean default false,
  replied boolean default false
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  status text default 'active',
  source text,
  subscribed_at timestamp default now(),
  unsubscribed_at timestamp,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- ────────────────────────────────────────────────────────────────────
-- 2. Attribution + CRM sync-state columns.
-- Attribution (all nullable; captured by the routes from Phase 3 on,
-- NULL forever on older rows):
--   country_code  ISO-3166 alpha-2 from the x-vercel-ip-country header
--   utm_*         first-touch UTM parameters
--   gclid         Google Ads click id
--   landing_page  first-touch URL (path + query)
--   referrer      first-touch document.referrer
--   page_path     pathname at submit time (b2b_leads already has it)
-- Sync bookkeeping:
--   zoho_lead_id       Zoho record id after a successful sync
--   crm_sync_status    queue state (see constraint below)
--   crm_synced_at      timestamptz of the last successful sync
--   crm_sync_error     last failure detail, for ops
--   crm_sync_attempts  retry counter (cron gives up at 5)

alter table public.b2b_leads
  add column if not exists country_code text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists zoho_lead_id text,
  add column if not exists crm_sync_status text not null default 'pending',
  add column if not exists crm_synced_at timestamptz,
  add column if not exists crm_sync_error text,
  add column if not exists crm_sync_attempts integer not null default 0;

alter table public.contact_messages
  add column if not exists country_code text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists page_path text,
  add column if not exists zoho_lead_id text,
  add column if not exists crm_sync_status text not null default 'pending',
  add column if not exists crm_synced_at timestamptz,
  add column if not exists crm_sync_error text,
  add column if not exists crm_sync_attempts integer not null default 0;

alter table public.seeker_waitlist
  add column if not exists country_code text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists page_path text,
  add column if not exists zoho_lead_id text,
  add column if not exists crm_sync_status text not null default 'pending',
  add column if not exists crm_synced_at timestamptz,
  add column if not exists crm_sync_error text,
  add column if not exists crm_sync_attempts integer not null default 0;

-- Newsletter is EXCLUDED from Phase 1 CRM sync (locked decision A2) but
-- gets the same explicit columns so the exclusion is a config flip, not
-- a migration, later. Its status therefore defaults to 'skipped', never
-- 'pending' — newsletter rows must not look like queued sync work.
-- crm_synced_at is deliberately timestamptz even though this table's
-- older timestamps are tz-naive: CRM columns stay consistent across all
-- four tables.
alter table public.newsletter_subscribers
  add column if not exists country_code text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists gclid text,
  add column if not exists landing_page text,
  add column if not exists referrer text,
  add column if not exists page_path text,
  add column if not exists zoho_lead_id text,
  add column if not exists crm_sync_status text not null default 'skipped',
  add column if not exists crm_synced_at timestamptz,
  add column if not exists crm_sync_error text,
  add column if not exists crm_sync_attempts integer not null default 0;

-- ────────────────────────────────────────────────────────────────────
-- 3. Status guard: typos in sync states would silently strand rows, so
-- the full state machine is enforced in the database.
--   pending → syncing → synced | failed   (failed → syncing on retry)
--   skipped = excluded by rule (newsletter, general contact enquiries)
--   legacy  = row predates the integration; never auto-synced

alter table public.b2b_leads
  add constraint b2b_leads_crm_sync_status_check
  check (crm_sync_status in ('pending', 'syncing', 'synced', 'failed', 'skipped', 'legacy'));

alter table public.contact_messages
  add constraint contact_messages_crm_sync_status_check
  check (crm_sync_status in ('pending', 'syncing', 'synced', 'failed', 'skipped', 'legacy'));

alter table public.seeker_waitlist
  add constraint seeker_waitlist_crm_sync_status_check
  check (crm_sync_status in ('pending', 'syncing', 'synced', 'failed', 'skipped', 'legacy'));

alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_crm_sync_status_check
  check (crm_sync_status in ('pending', 'syncing', 'synced', 'failed', 'skipped', 'legacy'));

-- ────────────────────────────────────────────────────────────────────
-- 4. Sync-queue indexes: the cron sweep selects pending/failed rows
-- oldest-first, so a partial index on created_at covers it exactly and
-- costs nothing on synced/skipped/legacy rows. Newsletter gets none —
-- it is not swept in Phase 1.

create index if not exists b2b_leads_crm_sync_queue_idx
  on public.b2b_leads (created_at)
  where crm_sync_status in ('pending', 'failed');

create index if not exists contact_messages_crm_sync_queue_idx
  on public.contact_messages (created_at)
  where crm_sync_status in ('pending', 'failed');

create index if not exists seeker_waitlist_crm_sync_queue_idx
  on public.seeker_waitlist (created_at)
  where crm_sync_status in ('pending', 'failed');

-- ────────────────────────────────────────────────────────────────────
-- 5. Backfill: every row existing at migration time predates the
-- integration and must never be auto-synced (locked decision A3: the
-- 3 b2b_leads get an explicit, reviewed requeue in Phase 5; contact
-- sales rows get a manual review; the rest stay untouched). Running
-- inside the same transaction as the ADDs, "still at the column
-- default" identifies exactly the pre-existing rows.

update public.b2b_leads set crm_sync_status = 'legacy' where crm_sync_status = 'pending';
update public.contact_messages set crm_sync_status = 'legacy' where crm_sync_status = 'pending';
update public.seeker_waitlist set crm_sync_status = 'legacy' where crm_sync_status = 'pending';
update public.newsletter_subscribers set crm_sync_status = 'legacy' where crm_sync_status = 'skipped';

-- ────────────────────────────────────────────────────────────────────
-- Documentation in the database itself.

comment on column public.b2b_leads.crm_sync_status is
  'CRM sync queue state: pending → syncing → synced|failed; skipped = excluded by rule; legacy = pre-integration row (never auto-synced).';
comment on column public.contact_messages.crm_sync_status is
  'CRM sync queue state: pending → syncing → synced|failed; skipped = excluded by rule (type=general); legacy = pre-integration row.';
comment on column public.seeker_waitlist.crm_sync_status is
  'CRM sync queue state: pending → syncing → synced|failed; skipped = excluded by rule; legacy = pre-integration row.';
comment on column public.newsletter_subscribers.crm_sync_status is
  'Newsletter is excluded from Phase 1 CRM sync: rows default to skipped (locked decision A2); legacy = pre-integration row.';
