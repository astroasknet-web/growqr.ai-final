-- 0018_apply_cal_booking_reschedule.sql
-- Replaces apply_cal_booking(). No schema changes.
--
-- WHY: confirmed against a real reschedule on 2026-08-04 — Cal.com mints a
-- BRAND NEW uid when a booking is rescheduled and reports the previous one in
-- the payload (fromReschedule / rescheduleUid). The original function keyed
-- purely on cal_uid, so a reschedule inserted a SECOND row instead of moving
-- the first, which produced:
--
--   * a zombie row still marked 'booked' at the old time, which would inflate
--     every booking count and show the team a meeting that no longer exists;
--   * a SECOND Zoho follow-up Task, because zoho_task_created is per-row and
--     the new row had never created one — two open tasks for one call is how a
--     follow-up queue stops being trustworthy;
--   * booked_at reset to the reschedule time, destroying time-to-book.
--
-- FIX: when the payload names a prior uid and we hold that booking, the
-- EXISTING row is migrated onto the new uid rather than a new row being
-- inserted. One row per logical booking, whatever Cal does with identifiers:
-- events_count keeps counting, zoho_task_id/zoho_lead_id carry over so the
-- afterSync hook updates the existing Task instead of creating another, and
-- booked_at stays at the original booking time.
--
-- Everything else is unchanged from 0017, including the ordering guard and the
-- list of fields deliberately never overwritten (email, booked_at, attribution).

create or replace function public.apply_cal_booking(
  p_cal_uid    text,
  p_event_at   timestamptz,
  p_booking    jsonb,
  p_supersedes text default null
)
returns table (
  booking_id   uuid,
  applied      boolean,
  is_new       boolean,
  events_count integer,
  status       text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id      uuid;
  v_new     boolean;
  v_applied boolean := false;
begin
  -- ── Reschedule path ──────────────────────────────────────────────────────
  -- Only when the new uid is genuinely unknown: if a row for p_cal_uid already
  -- exists this is a REDELIVERY of the reschedule, and the ordinary upsert
  -- below handles it correctly. Checking this first is what keeps retries from
  -- migrating the row twice.
  if p_supersedes is not null
     and not exists (select 1 from public.call_bookings where cal_uid = p_cal_uid) then

    update public.call_bookings set
      cal_uid              = p_cal_uid,
      rescheduled_from_uid = p_supersedes,
      last_event_at        = p_event_at,
      last_trigger_event   = p_booking ->> 'last_trigger_event',
      status               = coalesce(p_booking ->> 'status', 'rescheduled'),
      start_time           = (p_booking ->> 'start_time')::timestamptz,
      end_time             = (p_booking ->> 'end_time')::timestamptz,
      title                = coalesce(p_booking ->> 'title', title),
      meeting_url          = coalesce(p_booking ->> 'meeting_url', meeting_url),
      attendee_name        = coalesce(p_booking ->> 'attendee_name', attendee_name),
      attendee_timezone    = coalesce(p_booking ->> 'attendee_timezone', attendee_timezone),
      company              = coalesce(p_booking ->> 'company', company),
      team_size            = coalesce(p_booking ->> 'team_size', team_size),
      cal_booking_id       = coalesce((p_booking ->> 'cal_booking_id')::bigint, cal_booking_id),
      cal_event_type_id    = coalesce((p_booking ->> 'cal_event_type_id')::bigint, cal_event_type_id),
      rescheduled_at       = coalesce((p_booking ->> 'rescheduled_at')::timestamptz, p_event_at),
      responses            = coalesce(p_booking -> 'responses', responses),
      raw_payload          = p_booking -> 'raw_payload',
      -- Attribution: fill gaps only. A reschedule can arrive without the hidden
      -- fields (Cal drops them if the reschedule link is opened directly), and
      -- first touch must win over a later blank.
      intent_id            = coalesce((p_booking ->> 'intent_id')::uuid, intent_id),
      source               = coalesce(p_booking ->> 'source', source),
      page_path            = coalesce(p_booking ->> 'page_path', page_path),
      country_code         = coalesce(p_booking ->> 'country_code', country_code),
      utm_source           = coalesce(p_booking ->> 'utm_source', utm_source),
      utm_medium           = coalesce(p_booking ->> 'utm_medium', utm_medium),
      utm_campaign         = coalesce(p_booking ->> 'utm_campaign', utm_campaign),
      utm_term             = coalesce(p_booking ->> 'utm_term', utm_term),
      utm_content          = coalesce(p_booking ->> 'utm_content', utm_content),
      gclid                = coalesce(p_booking ->> 'gclid', gclid),
      landing_page         = coalesce(p_booking ->> 'landing_page', landing_page),
      referrer             = coalesce(p_booking ->> 'referrer', referrer),
      events_count         = call_bookings.events_count + 1,
      crm_sync_status      = case
                               when call_bookings.crm_sync_status in ('syncing', 'skipped')
                                 then call_bookings.crm_sync_status
                               else 'pending'
                             end,
      crm_sync_attempts    = 0,
      crm_sync_error       = null,
      updated_at           = now()
      -- booked_at, email, created_at and every zoho_*/notification counter are
      -- deliberately absent: the booking's identity and history survive a
      -- reschedule, and carrying zoho_task_id over is exactly what makes the
      -- afterSync hook UPDATE the existing Task instead of creating a second.
    where cal_uid = p_supersedes
      and p_event_at >= last_event_at
    returning id into v_id;

    if v_id is not null then
      return query
        select v_id, true, false, cb.events_count, cb.status
        from public.call_bookings cb where cb.id = v_id;
      return;
    end if;
    -- No prior row (or the event was stale): fall through and treat it as new.
  end if;

  -- ── Ordinary path (create, cancel, redelivery) ────────────────────────────
  insert into public.call_bookings (
    cal_uid, cal_booking_id, cal_event_type_id, rescheduled_from_uid,
    last_event_at, last_trigger_event,
    email, attendee_name, attendee_timezone, company, team_size,
    title, start_time, end_time, meeting_url, status,
    booked_at, rescheduled_at, cancelled_at, cancellation_reason,
    is_disposable_email, responses, raw_payload,
    intent_id, source, country_code,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    gclid, landing_page, referrer, page_path,
    crm_sync_status
  )
  values (
    p_cal_uid,
    (p_booking ->> 'cal_booking_id')::bigint,
    (p_booking ->> 'cal_event_type_id')::bigint,
    coalesce(p_booking ->> 'rescheduled_from_uid', p_supersedes),
    p_event_at,
    p_booking ->> 'last_trigger_event',
    p_booking ->> 'email',
    p_booking ->> 'attendee_name',
    p_booking ->> 'attendee_timezone',
    p_booking ->> 'company',
    p_booking ->> 'team_size',
    p_booking ->> 'title',
    (p_booking ->> 'start_time')::timestamptz,
    (p_booking ->> 'end_time')::timestamptz,
    p_booking ->> 'meeting_url',
    coalesce(p_booking ->> 'status', 'booked'),
    coalesce((p_booking ->> 'booked_at')::timestamptz, p_event_at),
    (p_booking ->> 'rescheduled_at')::timestamptz,
    (p_booking ->> 'cancelled_at')::timestamptz,
    p_booking ->> 'cancellation_reason',
    coalesce((p_booking ->> 'is_disposable_email')::boolean, false),
    p_booking -> 'responses',
    p_booking -> 'raw_payload',
    (p_booking ->> 'intent_id')::uuid,
    p_booking ->> 'source',
    p_booking ->> 'country_code',
    p_booking ->> 'utm_source',
    p_booking ->> 'utm_medium',
    p_booking ->> 'utm_campaign',
    p_booking ->> 'utm_term',
    p_booking ->> 'utm_content',
    p_booking ->> 'gclid',
    p_booking ->> 'landing_page',
    p_booking ->> 'referrer',
    p_booking ->> 'page_path',
    case when coalesce((p_booking ->> 'is_disposable_email')::boolean, false)
         then 'skipped' else 'pending' end
  )
  on conflict (cal_uid) do update set
    last_event_at        = excluded.last_event_at,
    last_trigger_event   = excluded.last_trigger_event,
    status               = excluded.status,
    start_time           = excluded.start_time,
    end_time             = excluded.end_time,
    title                = coalesce(excluded.title, call_bookings.title),
    meeting_url          = coalesce(excluded.meeting_url, call_bookings.meeting_url),
    attendee_name        = coalesce(excluded.attendee_name, call_bookings.attendee_name),
    attendee_timezone    = coalesce(excluded.attendee_timezone, call_bookings.attendee_timezone),
    company              = coalesce(excluded.company, call_bookings.company),
    team_size            = coalesce(excluded.team_size, call_bookings.team_size),
    cal_booking_id       = coalesce(excluded.cal_booking_id, call_bookings.cal_booking_id),
    cal_event_type_id    = coalesce(excluded.cal_event_type_id, call_bookings.cal_event_type_id),
    rescheduled_from_uid = coalesce(excluded.rescheduled_from_uid, call_bookings.rescheduled_from_uid),
    rescheduled_at       = coalesce(excluded.rescheduled_at, call_bookings.rescheduled_at),
    cancelled_at         = coalesce(excluded.cancelled_at, call_bookings.cancelled_at),
    cancellation_reason  = coalesce(excluded.cancellation_reason, call_bookings.cancellation_reason),
    responses            = coalesce(excluded.responses, call_bookings.responses),
    raw_payload          = excluded.raw_payload,
    intent_id            = coalesce(call_bookings.intent_id, excluded.intent_id),
    source               = coalesce(call_bookings.source, excluded.source),
    page_path            = coalesce(call_bookings.page_path, excluded.page_path),
    country_code         = coalesce(call_bookings.country_code, excluded.country_code),
    events_count         = call_bookings.events_count + 1,
    crm_sync_status      = case
                             when call_bookings.crm_sync_status in ('syncing', 'skipped')
                               then call_bookings.crm_sync_status
                             else 'pending'
                           end,
    crm_sync_attempts    = 0,
    crm_sync_error       = null,
    updated_at           = now()
  where excluded.last_event_at >= call_bookings.last_event_at
  returning id, (xmax = 0) into v_id, v_new;

  if v_id is null then
    select cb.id into v_id from public.call_bookings cb where cb.cal_uid = p_cal_uid;
    v_applied := false;
    v_new := false;
  else
    v_applied := true;
  end if;

  return query
    select v_id, v_applied, coalesce(v_new, false), cb.events_count, cb.status
    from public.call_bookings cb where cb.id = v_id;
end;
$$;

comment on function public.apply_cal_booking(text, timestamptz, jsonb, text) is
  'Applies one Cal.com webhook event to call_bookings. Cal mints a new uid on reschedule, so p_supersedes migrates the existing row onto the new uid (one row per logical booking, Task and counters preserved) instead of inserting a duplicate. Refuses events older than last_event_at.';

revoke all on function public.apply_cal_booking(text, timestamptz, jsonb, text) from public, anon, authenticated;

-- The 3-argument signature from 0017 is now dead weight and would silently be
-- chosen by any caller that omits p_supersedes.
drop function if exists public.apply_cal_booking(text, timestamptz, jsonb);
