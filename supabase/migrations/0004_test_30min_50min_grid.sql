-- Slot grid: 30-min sessions with a 20-min break between them.
--
-- The session LENGTH (30 min) comes from components/pages/experts-data.ts
-- (sessionDuration "30 min"). Here `slot_duration_min` is the START-to-START
-- spacing used by features/experts/services/slots.ts, so:
--     50 = 30-min session + 20-min break
-- Two back-to-back bookings therefore always leave the expert a 20-min gap.
--
-- Availability days/hours are intentionally NOT changed (still Mon–Sat 10:00–18:00).
-- REVERT (after testing): set slot_duration_min back to 45 where is_active = true.

update public.expert_availability
set slot_duration_min = 50
where is_active = true;
