-- 0017_apply_cal_booking.sql
-- One function, no schema changes.
--
-- WHY A FUNCTION AND NOT TWO supabase-js CALLS
--
-- Applying a webhook event to call_bookings has to do three things atomically:
--
--   1. insert-or-update keyed on cal_uid (the same booking can arrive three
--      times: created, rescheduled, cancelled),
--   2. REFUSE anything older than what the row already has, and
--   3. increment events_count.
--
-- (1) and (2) are expressible from the client, but (3) is column arithmetic —
-- supabase-js would need a read-then-write, and two deliveries racing on the
-- same booking would then both read the same count and both write count+1,
-- losing an event. Since the counter is what gates notifications and Notes,
-- losing one means a cancellation that never reaches anybody. So the whole
-- thing is one statement in the database, the same reasoning that put
-- resolve_bot_lead() in migration 0012.
--
-- ORDERING (2) IS NOT THEORETICAL. Cal retries a failed delivery on a delay,
-- so BOOKING_CREATED can physically arrive after the BOOKING_CANCELLED that
-- logically followed it. Without the guard, a retry would resurrect a
-- cancelled call and put a dead meeting back on the team's radar. The
-- `where excluded.last_event_at >= call_bookings.last_event_at` on the DO
-- UPDATE is what prevents it: an older event simply matches no row and falls
-- through to the "not applied" branch.
--
-- WHAT DELIBERATELY DOES NOT CHANGE ON UPDATE
--
--   email        the CRM key. lib/crm/zoho-client.ts upsertLead matches on
--                Email, so changing it here would create a SECOND Zoho Lead
--                and strand the first — the exact failure changeLeadEmail()
--                exists to work around. Cal keeps the same attendee across a
--                reschedule anyway.
--   booked_at    the ORIGINAL booking time. Overwriting it on reschedule would
--                destroy every time-to-book measurement.
--   attribution  first touch wins: intent_id, source, utm_*, page_path,
--                landing_page, referrer, gclid, country_code all stay as
--                captured at the first event.
--   is_disposable_email, created_at, and the notification/Note counters.

create or replace function public.apply_cal_booking(
  p_cal_uid  text,
  p_event_at timestamptz,
  p_booking  jsonb
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
    p_booking ->> 'rescheduled_from_uid',
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
    -- A disposable address never enters the CRM queue at all: 'skipped' is the
    -- existing "excluded by rule" state, so no sweep will ever pick it up.
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
    -- coalesce, never blank: a cancellation payload may omit the booking
    -- questions, and losing the company on the way out would be silly.
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
    events_count         = call_bookings.events_count + 1,
    -- Re-queue for CRM so the new time/status reaches Zoho, but never stomp a
    -- claim another process is holding ('syncing'), and never drag a
    -- deliberately excluded row ('skipped') back into the queue.
    crm_sync_status      = case
                             when call_bookings.crm_sync_status in ('syncing', 'skipped')
                               then call_bookings.crm_sync_status
                             else 'pending'
                           end,
    -- A genuinely new event deserves a fresh retry budget: a row that gave up
    -- five times on a stale payload should not stay dead for the new one.
    crm_sync_attempts    = 0,
    crm_sync_error       = null,
    updated_at           = now()
  where excluded.last_event_at >= call_bookings.last_event_at
  returning id, (xmax = 0) into v_id, v_new;

  if v_id is null then
    -- Either the ordering guard rejected this event, or (impossible today, but
    -- cheap to be honest about) the row vanished between statements. Report the
    -- existing row without claiming anything was applied.
    select cb.id into v_id from public.call_bookings cb where cb.cal_uid = p_cal_uid;
    v_applied := false;
    v_new := false;
  else
    v_applied := true;
  end if;

  return query
    select v_id,
           v_applied,
           coalesce(v_new, false),
           cb.events_count,
           cb.status
    from public.call_bookings cb
    where cb.id = v_id;
end;
$$;

comment on function public.apply_cal_booking(text, timestamptz, jsonb) is
  'Applies one Cal.com webhook event to call_bookings: insert-or-update on cal_uid, refusing events older than last_event_at, incrementing events_count atomically. Returns whether the event was applied and the resulting counters.';

-- Callable only by the service role (the webhook route uses the admin client).
revoke all on function public.apply_cal_booking(text, timestamptz, jsonb) from public, anon, authenticated;
