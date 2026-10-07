-- 0016_call_bookings.sql
-- Cal.com booking pipeline, part 2 of 2. STRICTLY ADDITIVE: two new tables and
-- one view. No existing table, column, constraint, policy or function changes.
--
--   1. cal_webhook_events — append-only idempotency ledger + audit trail
--   2. call_bookings      — booking state of record, a new CRM sync source
--   3. call_booking_stats — funnel view, available from day one
--
-- The column contract on call_bookings is deliberately IDENTICAL to the four
-- tables from migration 0011 (attribution block + crm_sync_* block). That is
-- what lets lib/crm/sync.ts, lib/crm/health.ts and payload.ts commonFields()
-- operate on it with no modification. Two details are load-bearing and easy to
-- get wrong:
--
--   * the person column MUST be named `email`. lib/crm/health.ts selects
--     `id, email, crm_sync_attempts, crm_sync_error, created_at` from EVERY
--     registered source table by name; `attendee_email` would make the
--     stuck-row digest fail the moment this source is enabled.
--   * the queue index must be the same partial index on created_at, because
--     the sweep's drain query is `status in ('pending','failed')` ordered by
--     created_at.

-- ────────────────────────────────────────────────────────────────────
-- 1. Idempotency ledger.
--
-- Cal retries deliveries, and a retry is indistinguishable from a new event
-- unless something remembers. dedupe_key is sha256 of the RAW request body:
-- a retry re-sends identical bytes, while any genuinely new event differs in
-- at least uid/createdAt. The unique constraint is therefore the entire
-- deduplication mechanism — it is enforced by the database, not by a
-- read-then-write in application code that two concurrent deliveries could
-- both pass.
--
-- Append-only, and it stores the full body forever. When something looks wrong
-- in six months, this is the table that can answer what Cal actually sent,
-- independent of whatever call_bookings was subsequently updated to.

create table if not exists public.cal_webhook_events (
  id             bigserial primary key,
  received_at    timestamptz not null default now(),

  -- sha256(raw body). Unique = the retry guard.
  dedupe_key     text not null unique,

  trigger_event  text not null,
  cal_uid        text,

  -- The envelope's createdAt: the ORDERING key. Cal retries a failed delivery
  -- on a delay, so a BOOKING_CREATED can physically arrive after the
  -- BOOKING_CANCELLED that logically followed it. call_bookings compares this
  -- before applying an update.
  event_at       timestamptz,

  -- False rows are kept deliberately: a forged or misconfigured sender should
  -- be visible in the data, not merely rejected at the door.
  signature_ok   boolean not null,

  payload        jsonb not null,

  -- NULL = claimed but not finished. A retry that finds an unfinished claim
  -- older than the in-flight window reprocesses it; every downstream step is
  -- idempotent, so that is safe.
  processed_at   timestamptz,
  error          text
);

create index if not exists cal_webhook_events_uid_idx
  on public.cal_webhook_events (cal_uid, event_at);

-- The "unfinished work" query. Partial, so it costs nothing once processed.
create index if not exists cal_webhook_events_unprocessed_idx
  on public.cal_webhook_events (received_at)
  where processed_at is null;

alter table public.cal_webhook_events enable row level security;

comment on table public.cal_webhook_events is
  'Append-only Cal.com webhook ledger. dedupe_key = sha256(raw body); the unique constraint is what makes webhook retries safe. Full payload retained for forensics.';

-- ────────────────────────────────────────────────────────────────────
-- 2. Bookings.

create table if not exists public.call_bookings (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- ── Cal identity ────────────────────────────────────────────────
  -- cal_uid is THE idempotency key for the booking itself (as opposed to the
  -- delivery): unique, so a reprocessed webhook updates rather than duplicates.
  cal_uid              text not null unique,
  cal_booking_id       bigint,
  cal_event_type_id    bigint,
  -- Populated when Cal mints a NEW uid for a reschedule instead of reusing the
  -- old one. Which of the two it does is confirmed by the Phase 0 capture; the
  -- column exists either way so the linkage is never lost.
  rescheduled_from_uid text,

  -- Newest applied event. The upsert refuses to apply anything older, which is
  -- what makes out-of-order delivery harmless.
  last_event_at        timestamptz not null,
  last_trigger_event   text not null,

  -- ── Person ──────────────────────────────────────────────────────
  -- `email`, NOT `attendee_email` — see the header note on health.ts.
  email                text not null,
  attendee_name        text not null,
  attendee_timezone    text,
  -- From Cal booking questions (locked decision D3). company feeds Zoho's
  -- mandatory Company field; team_size feeds No_of_Employees via
  -- teamSizeToEmployees(), whose keys are the enterprise modal's exact option
  -- strings — the Cal dropdown must reuse those verbatim, en-dashes included,
  -- rather than introducing a second set of size bands.
  company              text,
  team_size            text,

  -- ── Booking ─────────────────────────────────────────────────────
  title                text,
  start_time           timestamptz not null,
  end_time             timestamptz,
  meeting_url          text,
  status               text not null default 'booked',

  -- Funnel timestamps. booked_at is CAL's creation time, deliberately distinct
  -- from created_at (OUR receipt time): they diverge by the retry delay, and
  -- only the former is a real time-to-book measurement. The gap between them is
  -- itself a delivery-health signal.
  booked_at            timestamptz not null,
  rescheduled_at       timestamptz,
  cancelled_at         timestamptz,
  cancellation_reason  text,

  -- Spam posture: FLAG, never block. A disposable address still gets a row and
  -- still raises a notification — Cal has already reserved a real slot on a
  -- real calendar, and hiding that from the team would be worse than the spam.
  -- The flag only stops it reaching Zoho (the payload builder returns null →
  -- the row is marked 'skipped' by the existing engine).
  is_disposable_email  boolean not null default false,

  -- Everything Cal collected, verbatim, plus the newest raw body.
  responses            jsonb,
  raw_payload          jsonb,

  -- ── Attribution (joined from booking_intents; NULL when the beacon was
  -- blocked). Same column names as the migration-0011 tables so
  -- payload.ts commonFields()/rowAttribution() work unchanged. ───────
  intent_id            uuid references public.booking_intents(id) on delete set null,
  source               text,
  country_code         text,
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  utm_term             text,
  utm_content          text,
  gclid                text,
  landing_page         text,
  referrer             text,
  page_path            text,

  -- ── CRM state ───────────────────────────────────────────────────
  -- zoho_contact_id + crm_record_type are NEW versus the 0011 contract: this is
  -- the first source that can attach to an existing Contact instead of creating
  -- a Lead (locked decision D4). Everything else is byte-identical.
  zoho_lead_id         text,
  zoho_contact_id      text,
  crm_record_type      text,
  crm_sync_status      text not null default 'pending',
  crm_synced_at        timestamptz,
  crm_sync_error       text,
  crm_sync_attempts    integer not null default 0,

  -- ── afterSync / notification guards ─────────────────────────────
  -- events_count increments on every lifecycle event (booked=1, +1 per
  -- reschedule/cancel). The two counters below chase it. This is the same
  -- counter-gating bot_leads uses for per-visit Notes, and for the same reason:
  -- a boolean would send exactly one notification ever and silently swallow a
  -- cancellation.
  events_count         integer not null default 1,
  zoho_task_id         text,
  zoho_task_created    boolean not null default false,
  zoho_notes_count     integer not null default 0,
  notifications_count  integer not null default 0,

  -- PostgREST .or() filters cannot compare two columns, so the comparison is
  -- materialised here — exactly the trick bot_leads.zoho_notes_pending uses.
  zoho_notes_pending   boolean generated always as (zoho_notes_count < events_count) stored,
  notifications_pending boolean generated always as (notifications_count < events_count) stored
);

alter table public.call_bookings
  drop constraint if exists call_bookings_status_check;
alter table public.call_bookings
  add constraint call_bookings_status_check
  check (status in ('booked', 'rescheduled', 'cancelled'));

-- Same state machine as every other synced table (migration 0011 §3).
alter table public.call_bookings
  drop constraint if exists call_bookings_crm_sync_status_check;
alter table public.call_bookings
  add constraint call_bookings_crm_sync_status_check
  check (crm_sync_status in ('pending', 'syncing', 'synced', 'failed', 'skipped', 'legacy'));

alter table public.call_bookings
  drop constraint if exists call_bookings_crm_record_type_check;
alter table public.call_bookings
  add constraint call_bookings_crm_record_type_check
  check (crm_record_type is null or crm_record_type in ('lead', 'contact'));

-- The sweep's drain query, covered exactly (see 0011 §4).
create index if not exists call_bookings_crm_sync_queue_idx
  on public.call_bookings (created_at)
  where crm_sync_status in ('pending', 'failed');

-- Notification reconciliation runs on its own lane, independent of CRM state:
-- the team must be told about a booking even when CRM_SYNC_ENABLED is false or
-- Zoho is down. That is why this is NOT folded into the afterSync filter, which
-- only ever visits rows that already reached 'synced'.
create index if not exists call_bookings_notifications_pending_idx
  on public.call_bookings (created_at)
  where notifications_pending;

-- Lead/Contact resolution and the health digest both look up by person.
create index if not exists call_bookings_email_idx
  on public.call_bookings (email);

create index if not exists call_bookings_start_time_idx
  on public.call_bookings (start_time);

alter table public.call_bookings enable row level security;

comment on table public.call_bookings is
  'Cal.com bookings, state of record. Registered CRM sync source (lib/crm/sources.ts). One row per booking, keyed on cal_uid.';
comment on column public.call_bookings.email is
  'Attendee email. MUST keep this exact name: lib/crm/health.ts selects it by name from every registered source table.';
comment on column public.call_bookings.booked_at is
  'Cal''s booking-creation time, NOT our webhook receipt time (created_at). The two differ by retry delay.';
comment on column public.call_bookings.last_event_at is
  'Envelope createdAt of the newest applied webhook. The upsert refuses older events, making out-of-order delivery harmless.';
comment on column public.call_bookings.crm_record_type is
  'Whether this booking attached to a Zoho Lead or an existing Contact (locked decision D4).';
comment on column public.call_bookings.is_disposable_email is
  'Flagged, never blocked: the row and the notification still happen; only the CRM sync is skipped.';

-- ────────────────────────────────────────────────────────────────────
-- 3. Funnel view, available from day one.
--
-- Deliberately covers only what the pipeline actually captures. Show-up rate
-- needs the MEETING_ENDED / no-show triggers (not subscribed — open decision
-- D8) and demo→customer conversion needs the Deals module (out of scope per
-- D4), so neither appears here as a column that would silently read zero.

create or replace view public.call_booking_stats as
select
  date_trunc('day', created_at)                                          as day,
  source,
  page_path,
  utm_campaign,
  count(*)                                                               as bookings,
  count(*) filter (where status = 'cancelled')                           as cancelled,
  count(*) filter (where status = 'rescheduled')                         as rescheduled,
  count(*) filter (where is_disposable_email)                            as disposable,
  count(*) filter (where crm_sync_status = 'synced')                     as crm_synced,
  count(*) filter (where crm_sync_status = 'failed')                     as crm_failed,
  count(*) filter (where crm_record_type = 'contact')                    as existing_contacts,
  round(
    100.0 * count(*) filter (where status = 'cancelled') / nullif(count(*), 0),
    1
  )                                                                      as cancelled_pct
from public.call_bookings
group by 1, 2, 3, 4;

-- A view is SECURITY DEFINER by default, which would let it read straight past
-- the base table's RLS and hand booking counts to any anon PostgREST caller —
-- RLS on call_bookings would be silently bypassed by its own summary. Both
-- lines below are required: security_invoker makes the view respect the
-- caller's RLS, and the revoke removes it from the public API surface entirely.
alter view public.call_booking_stats set (security_invoker = on);
revoke all on public.call_booking_stats from anon, authenticated;

comment on view public.call_booking_stats is
  'Booking funnel by day/source/page/campaign. Show-up rate and demo→customer conversion are deliberately absent — they need webhook triggers and CRM modules that are out of scope.';
