-- Narrow Dr. Ruchi Sharma's bookable window to 10:00–17:00 IST (was 10:00–18:00).
--
-- Scoped to this one expert on purpose: 0003 aligned EVERY active rule to the
-- shared 10:00–18:00 window, so a bare `where is_active = true` here would drag
-- the whole roster along with her. The filter is the slug.
--
-- Session length comes from experts-data.ts (`sessionDuration: "30 min"`), not
-- from this table; slot_duration_min (50) is the START-to-START step. The
-- generator in features/experts/services/slots.ts emits a slot only while
-- `t + sessionMin <= end_time`, so dropping end_time to 17:00 removes the
-- 16:40 and 17:30 starts and leaves eight: 10:00, 10:50, 11:40, 12:30, 13:20,
-- 14:10, 15:00, 15:50 (last one ends 16:20).
--
-- Existing bookings are NOT touched. This table only controls what the booking
-- UI offers next; already-confirmed sessions outside the new window keep their
-- rows and their calendar invites. Checked at time of writing: her only
-- upcoming booking is 2026-09-09 10:00 IST, inside the new window.

update public.expert_availability
set end_time = time '17:00'
where expert_slug = 'ruchi-sharma'
  and is_active = true;
