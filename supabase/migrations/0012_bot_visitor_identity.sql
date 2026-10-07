-- 0012_bot_visitor_identity.sql
-- Visitor identity + deduplication for the SalesIQ bot. STRICTLY ADDITIVE:
-- no drops, renames, or type changes. bot_leads.conversation_id keeps its
-- unique constraint and its meaning (the FIRST conversation that created the
-- row); later conversations append to conversation_ids.
--
-- THE BUG THIS FIXES: lib/bot/context.ts resolves conversationId() as
-- `active_conversation_id ?? avuid`, and active_conversation_id is present on
-- live website traffic (the one real lead has conversation_id
-- 227090000000078003 — an 18-digit Zoho conversation id, not an avuid). So the
-- upsert key was per-CONVERSATION, and three visits from one device produced
-- three rows. The Zoho Lead itself was fine (upsert on Email), but each row
-- independently fired botLeadAfterSync: three Tasks, three Notes, three
-- notification emails.
--
--   1. bot_visitors — visit tracking for EVERY visitor, qualified or not
--   2. bot_leads — visitor identity + visit history columns
--   3. Indexes
--   4. Backfill
--   5. touch_bot_visitor() — atomic visit tracking
--   6. resolve_bot_lead()  — atomic dedupe + progressive enrichment

-- ────────────────────────────────────────────────────────────────────
-- 1. Visitor tracking, keyed on the SalesIQ device id.
-- Separate from bot_leads because it must exist BEFORE qualification: a
-- visitor who abandons the chat and returns days later leaves no bot_leads
-- row to enrich, only this one.

create table if not exists public.bot_visitors (
  id                   bigserial primary key,
  avuid                text not null unique,
  first_seen_at        timestamptz not null default now(),
  last_seen_at         timestamptz not null default now(),
  visit_count          integer not null default 1,
  last_conversation_id text,
  last_page_path       text,
  country_code         text,
  email                text,
  bot_lead_id          bigint references public.bot_leads(id) on delete set null,
  zoho_lead_id         text
);

-- Service-role only, same posture as the other bot_* tables: nothing in the
-- browser ever reads or writes visitor identity.
alter table public.bot_visitors enable row level security;

create index if not exists bot_visitors_email_idx
  on public.bot_visitors (lower(email)) where email is not null;
create index if not exists bot_visitors_lead_idx
  on public.bot_visitors (bot_lead_id) where bot_lead_id is not null;

-- ────────────────────────────────────────────────────────────────────
-- 2. Visitor identity + visit history on the lead itself.

alter table public.bot_leads
  add column if not exists avuid            text,
  add column if not exists visit_count      integer not null default 1,
  add column if not exists first_seen_at    timestamptz not null default now(),
  add column if not exists last_visit_at    timestamptz not null default now(),
  add column if not exists last_page_path   text,
  add column if not exists conversation_ids text[] not null default '{}',
  add column if not exists zoho_notes_count integer not null default 0;

-- Separate statement: a generated column cannot reference columns added in
-- the same ALTER. Exists because the sync sweep filters via PostgREST .or(),
-- which cannot express a column-vs-column comparison — see
-- CrmSourceDefinition.afterSyncFilter in lib/crm/sources.ts.
alter table public.bot_leads
  add column if not exists zoho_notes_pending boolean
    generated always as (zoho_notes_count < visit_count) stored;

-- ────────────────────────────────────────────────────────────────────
-- 3. Indexes backing the three dedupe lookups.

create index if not exists bot_leads_avuid_idx
  on public.bot_leads (avuid) where avuid is not null;
create index if not exists bot_leads_email_lower_idx
  on public.bot_leads (lower(email)) where email is not null;
create index if not exists bot_leads_conversation_ids_idx
  on public.bot_leads using gin (conversation_ids);
create index if not exists bot_leads_notes_pending_idx
  on public.bot_leads (created_at) where zoho_notes_pending;

-- ────────────────────────────────────────────────────────────────────
-- 4. Backfill: existing rows get their single conversation as their history,
-- and their creation time as both first and last visit. A row that already
-- has a Note counts as one Note, so the counter does not re-issue it.

update public.bot_leads
   set conversation_ids = array[conversation_id],
       first_seen_at    = created_at,
       last_visit_at    = created_at,
       last_page_path   = page_path,
       zoho_notes_count = case when zoho_note_created then 1 else 0 end
 where conversation_ids = '{}';

-- ────────────────────────────────────────────────────────────────────
-- 5. Visit tracking. Called on every webhook turn (from after(), never
-- inline), so it must be one atomic statement — two concurrent turns would
-- otherwise race on read-modify-write of visit_count.

create or replace function public.touch_bot_visitor(
  p_avuid           text,
  p_conversation_id text default null,
  p_page_path       text default null,
  p_country_code    text default null,
  p_email           text default null
)
returns table (visitor_id bigint, visits integer)
language plpgsql
as $$
declare
  v_id     bigint;
  v_visits integer;
begin
  if nullif(btrim(coalesce(p_avuid, '')), '') is null then
    return;  -- no device id: nothing to track, caller logs it
  end if;

  insert into public.bot_visitors as bv (
    avuid, last_conversation_id, last_page_path, country_code, email
  )
  values (
    p_avuid,
    p_conversation_id,
    p_page_path,
    p_country_code,
    nullif(btrim(coalesce(p_email, '')), '')
  )
  on conflict (avuid) do update set
    last_seen_at = now(),
    -- A NEW conversation id is a new visit. More turns inside the same
    -- conversation are not — this is what keeps visit_count counting visits
    -- rather than messages.
    visit_count = bv.visit_count + case
      when excluded.last_conversation_id is not null
       and bv.last_conversation_id is distinct from excluded.last_conversation_id
      then 1 else 0 end,
    last_conversation_id = coalesce(excluded.last_conversation_id, bv.last_conversation_id),
    last_page_path       = coalesce(excluded.last_page_path, bv.last_page_path),
    country_code         = coalesce(excluded.country_code, bv.country_code),
    email                = coalesce(bv.email, excluded.email)
  returning bv.id, bv.visit_count into v_id, v_visits;

  return query select v_id, v_visits;
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- 6. Dedupe + progressive enrichment, in one statement per branch so two
-- concurrent turns cannot both insert.
--
-- Resolution order (approved 2026-08-01):
--   1. email          — strongest identity, works across devices
--   2. avuid          — same device, GUARDED (see below)
--   3. conversation   — pre-existing webhook-retry idempotency
--   4. otherwise insert
--
-- The guard on (2) is deliberate: a shared device — office machine, campus
-- lab, kiosk — gives two different people the same avuid. Matching on avuid
-- alone would merge two real leads and silently destroy the second person's
-- data, which is strictly worse than the duplicate this migration fixes: a
-- duplicate is visible and mergeable, a bad merge is neither. So we only
-- match when the emails agree or one side is absent.

create or replace function public.resolve_bot_lead(
  p_conversation_id text,
  p_avuid           text default null,
  p_intent          text default null,
  p_email           text default null,
  p_name            text default null,
  p_company         text default null,
  p_designation     text default null,
  p_team_size       text default null,
  p_use_case        text default null,
  p_country_code    text default null,
  p_page_path       text default null,
  p_utm_source      text default null,
  p_utm_medium      text default null,
  p_utm_campaign    text default null
)
returns table (lead_id bigint, matched_on text, visits integer)
language plpgsql
as $$
declare
  v_id     bigint;
  v_match  text;
  v_visits integer;
  v_email  text := nullif(btrim(coalesce(p_email, '')), '');
  v_avuid  text := nullif(btrim(coalesce(p_avuid, '')), '');
  v_use    text := nullif(btrim(coalesce(p_use_case, '')), '');
begin
  -- 1. Email.
  if v_email is not null then
    select l.id into v_id
      from public.bot_leads l
     where l.email is not null and lower(l.email) = lower(v_email)
     order by l.created_at asc
     limit 1;
    if v_id is not null then v_match := 'email'; end if;
  end if;

  -- 2. Device id, with the shared-device guard.
  if v_id is null and v_avuid is not null then
    select l.id into v_id
      from public.bot_leads l
     where l.avuid = v_avuid
       and (l.email is null or v_email is null or lower(l.email) = lower(v_email))
     order by l.created_at asc
     limit 1;
    if v_id is not null then v_match := 'avuid'; end if;
  end if;

  -- 3. Same conversation (webhook retry, or a later turn of one chat).
  if v_id is null then
    select l.id into v_id
      from public.bot_leads l
     where l.conversation_id = p_conversation_id
        or l.conversation_ids @> array[p_conversation_id]
     order by l.created_at asc
     limit 1;
    if v_id is not null then v_match := 'conversation'; end if;
  end if;

  -- 4. Genuinely new.
  if v_id is null then
    insert into public.bot_leads (
      conversation_id, conversation_ids, avuid, intent, email, name, company,
      designation, team_size, use_case, country_code, page_path, last_page_path,
      utm_source, utm_medium, utm_campaign
    ) values (
      p_conversation_id, array[p_conversation_id], v_avuid, p_intent, v_email,
      p_name, p_company, p_designation, p_team_size, v_use, p_country_code,
      p_page_path, p_page_path, p_utm_source, p_utm_medium, p_utm_campaign
    )
    -- Concurrent turn won the race on the same conversation: take its row.
    on conflict (conversation_id) do update set last_visit_at = now()
    returning id, visit_count into v_id, v_visits;

    if v_avuid is not null then
      update public.bot_visitors
         set bot_lead_id = v_id,
             email       = coalesce(email, v_email)
       where avuid = v_avuid;
    end if;

    return query select v_id, 'new'::text, v_visits;
    return;
  end if;

  -- Enrich the matched row.
  update public.bot_leads l set
    -- Identity: fill gaps only. A partial second form must never blank out a
    -- value we already collected.
    email          = coalesce(l.email, v_email),
    name           = coalesce(l.name, p_name),
    company        = coalesce(l.company, p_company),
    designation    = coalesce(l.designation, p_designation),
    team_size      = coalesce(l.team_size, p_team_size),
    avuid          = coalesce(l.avuid, v_avuid),
    -- An escalation (university_inquiry → demo_request) is real news.
    intent         = coalesce(p_intent, l.intent),
    -- Volatile context: latest wins.
    country_code   = coalesce(p_country_code, l.country_code),
    page_path      = coalesce(p_page_path, l.page_path),
    last_page_path = coalesce(p_page_path, l.last_page_path),
    -- Attribution: FIRST touch wins — the campaign that originally brought them.
    utm_source     = coalesce(l.utm_source, p_utm_source),
    utm_medium     = coalesce(l.utm_medium, p_utm_medium),
    utm_campaign   = coalesce(l.utm_campaign, p_utm_campaign),
    -- The free-text ask is the part that genuinely differs per visit, so it
    -- accumulates instead of overwriting.
    use_case       = case
                       when v_use is null then l.use_case
                       when l.use_case is null then v_use
                       when position(v_use in l.use_case) > 0 then l.use_case
                       else l.use_case || E'\n\n— return visit —\n' || v_use
                     end,
    visit_count    = l.visit_count
                     + case when l.conversation_ids @> array[p_conversation_id] then 0 else 1 end,
    conversation_ids = case
                         when l.conversation_ids @> array[p_conversation_id] then l.conversation_ids
                         else l.conversation_ids || p_conversation_id
                       end,
    last_visit_at  = now(),
    -- Re-queue so the enrichment reaches Zoho. Never stomp an in-flight claim:
    -- a row mid-sync keeps its 'syncing' status or the claim is lost.
    -- Because this is the SAME row, zoho_task_created and notification_sent
    -- are already true, so botLeadAfterSync skips both — one Task and one
    -- email per person, while field updates keep flowing.
    crm_sync_status   = case when l.crm_sync_status = 'syncing' then l.crm_sync_status else 'pending' end,
    crm_sync_attempts = case when l.crm_sync_status = 'syncing' then l.crm_sync_attempts else 0 end,
    crm_sync_error    = case when l.crm_sync_status = 'syncing' then l.crm_sync_error else null end
  where l.id = v_id
  returning l.visit_count into v_visits;

  if v_avuid is not null then
    update public.bot_visitors
       set bot_lead_id = v_id,
           email       = coalesce(email, v_email)
     where avuid = v_avuid;
  end if;

  return query select v_id, v_match, v_visits;
end;
$$;

-- These functions write leads. Only the service role may call them.
revoke execute on function public.touch_bot_visitor(text, text, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.resolve_bot_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;

-- ────────────────────────────────────────────────────────────────────
-- Documentation in the database itself.

comment on table public.bot_visitors is
  'One row per SalesIQ device (avuid). Tracks visits for every visitor, including those who never qualify as a lead — which is what lets an abandoned chat be enriched on a later visit.';
comment on column public.bot_leads.avuid is
  'SalesIQ device id. The VISITOR key. conversation_id is the CONVERSATION key and must never be used for visitor identity.';
comment on column public.bot_leads.conversation_ids is
  'Every conversation that contributed to this lead. conversation_id remains the first one.';
comment on column public.bot_leads.zoho_notes_count is
  'Notes written to the Zoho Lead so far. Compared against visit_count to allow exactly one Note per visit.';
comment on column public.bot_leads.zoho_notes_pending is
  'Generated: a visit has happened with no Note yet. Exists so the sync sweep''s PostgREST .or() filter can express what a column-vs-column comparison cannot.';
