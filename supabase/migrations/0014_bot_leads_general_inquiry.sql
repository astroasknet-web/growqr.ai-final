-- B2C organic-chat lead capture.
--
-- Additive only. Extends the existing bot_leads pipeline that today only
-- fires for the 4 B2B-shaped intents (demo_request/recruiter_inquiry/
-- university_inquiry/enterprise_inquiry, gated by a qualification form) with
-- ONE new intent value, 'general_inquiry', used when a B2C visitor's email is
-- already known (SalesIQ's own pre-chat form) and they send a real chat
-- message — no form, same enrichment (Region/Country/UTM/Segment/Audience/
-- Product_Interest via the SAME buildBotLeadPayload derivation B2B already
-- uses). See lib/bot/router.ts captureB2cLead().
--
-- 'general_inquiry' is NEVER returned by detectIntent() and NEVER added to
-- B2B_INTENTS — it cannot be reached by, and does not alter, the existing
-- qualification-form flow.

alter table public.bot_leads
  drop constraint if exists bot_leads_intent_check;

alter table public.bot_leads
  add constraint bot_leads_intent_check
  check (intent = any (array[
    'demo_request', 'recruiter_inquiry', 'university_inquiry', 'enterprise_inquiry',
    'general_inquiry'
  ]));

-- ── Close a real clobber risk before this ships ─────────────────────────────
--
-- resolve_bot_lead()'s enrich branch does `intent = coalesce(p_intent, l.intent)`
-- — the NEW call's intent always wins when provided, which is deliberate: an
-- escalation (university_inquiry -> demo_request) is real news, so newer must
-- win over older in that direction.
--
-- But 'general_inquiry' is the one intent that is never MORE specific than
-- whatever's already there. Concretely: a visitor qualifies as
-- recruiter_inquiry on /solutions/recruiters, then later in the SAME
-- conversation browses to /solutions/students and sends an ordinary message.
-- isB2bContext() reflects the CURRENT page, so that later turn is eligible
-- for captureB2cLead() and would call resolve_bot_lead with
-- intent='general_inquiry' — silently downgrading a real B2B lead back to
-- generic. That is a genuine data-corruption path, not a hypothetical one,
-- given the router change lands in the same deploy.
--
-- Fix, scoped to exactly this one value: 'general_inquiry' only ever SETS an
-- empty intent: it never overwrites an existing, more specific one. Every
-- other value keeps today's precedence (new wins), unchanged.
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
    email          = coalesce(l.email, v_email),
    name           = coalesce(l.name, p_name),
    company        = coalesce(l.company, p_company),
    designation    = coalesce(l.designation, p_designation),
    team_size      = coalesce(l.team_size, p_team_size),
    avuid          = coalesce(l.avuid, v_avuid),
    -- CHANGED (0014): 'general_inquiry' never downgrades an existing,
    -- more specific intent. Every other value keeps new-wins precedence.
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
    last_visit_at  = now(),
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
