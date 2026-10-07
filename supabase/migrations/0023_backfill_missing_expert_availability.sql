-- Backfill weekly availability for experts that had no rules at all.
--
-- An expert with zero rows here gets a silently empty booking calendar:
-- getWeeklyAvailability() returns [], generateSlots() short-circuits on
-- `rules.length === 0` (features/experts/services/slots.ts), and the API still
-- answers 200 with `slots: {}`. The modal then renders every date unselectable
-- with no error to explain why. Meenakshi Panghal was reported that way; a
-- cross-check of all 13 experts in features/experts/data/experts-data.ts
-- against this table found three slugs missing entirely.
--
-- Values match the grid every other expert already uses: Mon–Sat 10:00–18:00,
-- 50-min start-to-start spacing (30-min session + 20-min break, see 0004).
-- 2nd & 4th Saturdays stay excluded in application code, not in data.
--
-- chandrika-das is hidden from public listings but is seeded anyway, matching
-- bibin-babu, who is likewise hidden and has rules. `hidden` is what keeps an
-- expert off the site; availability rows alone expose nothing.

insert into public.expert_availability
  (expert_slug, day_of_week, start_time, end_time, slot_duration_min, is_active)
select s.slug, d.dow, time '10:00', time '18:00', 50, true
from (values
  ('meenakshi-panghal'),
  ('jude-francis-weston'),
  ('chandrika-das')
) as s(slug)
cross join generate_series(1, 6) as d(dow)
where not exists (
  select 1 from public.expert_availability ea
  where ea.expert_slug = s.slug and ea.day_of_week = d.dow
);
