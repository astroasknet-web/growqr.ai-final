-- 0022 — one Zoho write per conversation, and a real transcript on the Lead
--
-- Two defects, both visible on the 2026-08-06 smoke test (Lead
-- 1371579000000794001, "kirti test"):
--
--  1. A single five-message chat produced SEVEN Zoho writes (1 insert +
--     6 updates). resolve_bot_lead() unconditionally reset a 'synced' row back
--     to 'pending', and captureB2cLead() calls it on every turn — so every
--     message re-claimed the row and re-pushed it. The result is idempotent,
--     nothing was corrupted, but Zoho's daily API credits are finite and this
--     burns them linearly with chat length.
--
--  2. The Lead's Note carried no transcript and no pointer back to the chat —
--     "Intent: general_inquiry / Page: /" and nothing more. Supabase held the
--     conversation id and (via bot_events) the visitor's questions; none of it
--     reached Zoho, and the bot's OWN replies were never stored anywhere at
--     all, so no complete transcript could be reconstructed after the fact.
--
-- Zoho's native SalesIQ↔CRM link is the other half of (2) and is portal
-- config, not code — our app creates the Lead through the CRM API, so SalesIQ
-- does not recognise the record as belonging to its visitor and never attaches
-- its Chats related list. This migration makes the CRM useful whether or not
-- that link is ever enabled.

begin;

-- ── A. bot_messages — the transcript store ─────────────────────────────────
--
-- bot_events already records what HAPPENED (ai_answered, handoff_requested…)
-- and incidentally carries the visitor's question in its payload. It is an
-- audit trail, not a transcript: it has no row for a deterministic KB answer,
-- and it never holds the bot's reply text. Reusing it would have meant a
-- partial transcript forever. This table holds both sides, verbatim, in order.
--
-- Written for EVERY conversation, not just qualified ones — the same reason
-- touch_bot_visitor() runs for everyone: an abandoned chat that turns into a
-- lead days later still needs its history.

create table if not exists public.bot_messages (
  id              bigint generated always as identity primary key,
  conversation_id text        not null,
  role            text        not null,
  content         text        not null,
  page_path       text,
  created_at      timestamptz not null default now(),
  -- Set once the turn has been written into a Zoho Note. Doubles as the
  -- flush queue (null = not yet in the CRM) and as the double-post guard,
  -- so a long chat can be flushed incrementally without ever repeating a
  -- line. See flushIdleTranscripts() in lib/bot/transcript.ts.
  synced_at       timestamptz,
  constraint bot_messages_role_check check (role in ('visitor', 'bot'))
);

-- Reading a conversation back, in order — the transcript builder's only query.
create index if not exists bot_messages_conversation_idx
  on public.bot_messages (conversation_id, created_at);

-- The flush queue. Partial, because once a chat is in the CRM its rows are
-- dead weight to this query and the unflushed set stays small.
create index if not exists bot_messages_unsynced_idx
  on public.bot_messages (created_at) where synced_at is null;

alter table public.bot_messages enable row level security;

-- Deliberately NO policies: RLS-enabled with none present denies anon and
-- authenticated by default, and the service role bypasses RLS entirely. Same
-- posture 0021 left every other table in. Chat transcripts are the last thing
-- that should be readable with the published anon key.

comment on table public.bot_messages is
  'Verbatim SalesIQ chat turns (both sides). Source for the Zoho transcript Note; service-role access only.';
comment on column public.bot_messages.synced_at is
  'When this turn was written into a Zoho Note. Null = still queued for the flush.';

-- ── B. resolve_bot_lead: requeue only on real change ───────────────────────
--
-- The old tail did this on EVERY call:
--
--   crm_sync_status = case when l.crm_sync_status = 'syncing'
--                          then l.crm_sync_status else 'pending' end
--
-- The 'syncing' guard is correct and is kept — it protects an in-flight claim.
-- What was missing is the other half: a turn that told us nothing new is not
-- news for the CRM either, and should leave a 'synced' row alone.
--
-- The return type gains `requeued`, so the caller knows whether to spend an
-- after() fast-path sync on this turn at all. A changed return type cannot be
-- CREATE OR REPLACE'd, hence the drop.

drop function if exists public.resolve_bot_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
);

create function public.resolve_bot_lead(
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
returns table (lead_id bigint, matched_on text, visits integer, requeued boolean)
language plpgsql
as $$
declare
  v_id      bigint;
  v_match   text;
  v_visits  integer;
  v_email   text := nullif(btrim(coalesce(p_email, '')), '');
  v_avuid   text := nullif(btrim(coalesce(p_avuid, '')), '');
  v_use     text := nullif(btrim(coalesce(p_use_case, '')), '');
  v_before  public.bot_leads%rowtype;
  v_after   public.bot_leads%rowtype;
  v_requeue boolean;
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

  -- 4. Genuinely new. Always queued — a brand-new lead must reach sales now,
  --    not on the next sweep.
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
    on conflict (conversation_id) do update set last_visit_at = now()
    returning id, visit_count into v_id, v_visits;

    if v_avuid is not null then
      update public.bot_visitors
         set bot_lead_id = v_id,
             email       = coalesce(email, v_email)
       where avuid = v_avuid;
    end if;

    return query select v_id, 'new'::text, v_visits, true;
    return;
  end if;

  -- Snapshot under lock, so the requeue decision below compares the row to
  -- itself rather than to whatever a concurrent turn left behind.
  select * into v_before from public.bot_leads where id = v_id for update;

  -- Enrich the matched row. Identical to 0014 except that the three crm_sync_*
  -- columns are no longer touched here — that is now conditional, below.
  update public.bot_leads l set
    email          = coalesce(l.email, v_email),
    name           = coalesce(l.name, p_name),
    company        = coalesce(l.company, p_company),
    designation    = coalesce(l.designation, p_designation),
    team_size      = coalesce(l.team_size, p_team_size),
    avuid          = coalesce(l.avuid, v_avuid),
    -- 0014: 'general_inquiry' never downgrades an existing, more specific
    -- intent. Every other value keeps new-wins precedence.
    intent         = case
                       when p_intent = 'general_inquiry'
                        and l.intent is not null
                        and l.intent <> 'general_inquiry'
                       then l.intent
                       else coalesce(p_intent, l.intent)
                     end,
    country_code   = coalesce(p_country_code, l.country_code),
    page_path      = coalesce(p_page_path, l.page_path),
    last_page_path = coalesce(p_page_path, l.last_page_path),
    utm_source     = coalesce(l.utm_source, p_utm_source),
    utm_medium     = coalesce(l.utm_medium, p_utm_medium),
    utm_campaign   = coalesce(l.utm_campaign, p_utm_campaign),
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
    last_visit_at  = now()
  where l.id = v_id
  returning l.* into v_after;

  v_visits := v_after.visit_count;

  -- Would Zoho see a different record than it already has? Only these columns
  -- can change what we push: every one of them feeds buildBotLeadPayload() or
  -- the Note. last_visit_at and conversation_ids are deliberately absent —
  -- another message in the same chat carrying no new facts is not news for the
  -- CRM, and treating it as such is exactly what caused the 7-writes-per-chat
  -- problem this migration exists to fix.
  v_requeue :=
    v_after.zoho_lead_id is null
    or v_after.crm_sync_status is distinct from 'synced'
    or (
         v_after.email, v_after.name, v_after.company, v_after.designation,
         v_after.team_size, v_after.use_case, v_after.intent, v_after.country_code,
         v_after.page_path, v_after.last_page_path, v_after.utm_source,
         v_after.utm_medium, v_after.utm_campaign, v_after.visit_count
       ) is distinct from (
         v_before.email, v_before.name, v_before.company, v_before.designation,
         v_before.team_size, v_before.use_case, v_before.intent, v_before.country_code,
         v_before.page_path, v_before.last_page_path, v_before.utm_source,
         v_before.utm_medium, v_before.utm_campaign, v_before.visit_count
       );

  -- Never disturb a live claim: whoever holds 'syncing' is mid-flight and will
  -- push the row as it stands now anyway. Same guard as 0014, same reason.
  if v_after.crm_sync_status = 'syncing' then
    v_requeue := false;
  end if;

  if v_requeue then
    update public.bot_leads
       set crm_sync_status   = 'pending',
           crm_sync_attempts = 0,
           crm_sync_error    = null
     where id = v_id;
  end if;

  if v_avuid is not null then
    update public.bot_visitors
       set bot_lead_id = v_id,
           email       = coalesce(email, v_email)
     where avuid = v_avuid;
  end if;

  return query select v_id, v_match, v_visits, v_requeue;
end;
$$;

comment on function public.resolve_bot_lead is
  'Match-or-insert a bot lead and enrich it. Returns requeued=false when the turn changed nothing Zoho would see, so the caller can skip the CRM push.';

-- ── C. claim_idle_transcripts — "which chats have finished?" ───────────────
--
-- SalesIQ's webhook bot only ever calls us with handler = trigger | message |
-- context. There is NO end-of-chat handler, so "the conversation is over" is
-- not something we are told — it has to be inferred, and the only honest
-- signal we have is silence. A conversation whose newest unwritten turn is
-- older than p_idle_minutes is treated as finished.
--
-- Kept in SQL rather than assembled in TypeScript for two reasons: PostgREST
-- cannot express the group-by-having, and it cannot express the join to
-- bot_leads, which has to match EITHER conversation_id OR the conversation_ids
-- array (a returning visitor's later chats live only in the array).
--
-- The 7-day window is what keeps this cheap forever: a chat that never
-- produced a lead has no Note to write and would otherwise sit in the queue
-- being re-grouped on every run. After a week it simply falls out of range,
-- and the partial index on (created_at) where synced_at is null makes that a
-- range scan rather than a full pass.
--
-- distinct on: the OR-join can match more than one lead when a visitor's rows
-- were merged; the oldest lead wins, matching resolve_bot_lead's own
-- `order by created_at asc` tie-break everywhere else.
create or replace function public.claim_idle_transcripts(
  p_idle_minutes integer default 20,
  p_limit        integer default 25
)
returns table (conversation_id text, lead_id bigint, zoho_lead_id text)
language sql
stable
as $$
  select s.conversation_id, s.lead_id, s.zoho_lead_id
    from (
      select distinct on (c.conversation_id)
             c.conversation_id,
             l.id           as lead_id,
             l.zoho_lead_id as zoho_lead_id,
             c.last_at
        from (
          select m.conversation_id, max(m.created_at) as last_at
            from public.bot_messages m
           where m.synced_at is null
             and m.created_at > now() - interval '7 days'
           group by m.conversation_id
          having max(m.created_at) < now() - make_interval(mins => p_idle_minutes)
        ) c
        join public.bot_leads l
          on l.conversation_id = c.conversation_id
          or l.conversation_ids @> array[c.conversation_id]
       where l.zoho_lead_id is not null
       order by c.conversation_id, l.created_at asc
    ) s
   order by s.last_at asc
   limit p_limit;
$$;

-- ── D. bot_events gains 'transcript_synced' ────────────────────────────────
--
-- Same trap 0013 documented: event_type carries a CHECK constraint, and
-- logEvent() swallows its own errors — so a value missing here would make
-- every transcript log write fail silently at the database, leaving the one
-- new pipeline stage completely unobserved.
alter table public.bot_events
  drop constraint if exists bot_events_event_type_check;

alter table public.bot_events
  add constraint bot_events_event_type_check
  check (event_type = any (array[
    'lead_created',
    'task_created',
    'note_created',
    'email_sent',
    'handoff_requested',
    -- 0022
    'transcript_synced',
    -- AI fallback layer (0013)
    'ai_answered',
    'ai_declined',
    'ai_rejected',
    'ai_timeout',
    'ai_error'
  ]));

comment on function public.claim_idle_transcripts is
  'Conversations that have gone quiet and have un-written turns, joined to the Zoho Lead they belong to. SalesIQ sends no end-of-chat event, so idleness is the proxy.';

commit;
