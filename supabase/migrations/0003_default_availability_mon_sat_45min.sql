-- Default expert availability → Mon–Sat, 10:00–18:00, 45-min session/interval.
-- 2nd & 4th Saturdays are excluded in application code (features/experts/services/slots.ts),
-- not in data, so weekly rules stay simple (one row per working weekday).

-- 1. Align all active weekly rules to the 10:00–18:00 window, 45-min interval.
update public.expert_availability
set slot_duration_min = 45,
    start_time = time '10:00',
    end_time   = time '18:00'
where is_active = true;

-- 2. Ensure every live expert has a Saturday (day_of_week = 6) rule.
insert into public.expert_availability (expert_slug, day_of_week, start_time, end_time, slot_duration_min)
select s.slug, 6, time '10:00', time '18:00', 45
from (values
  ('ruchi-sharma'),
  ('amandeep-singh-bhateja'),
  ('bibin-babu'),
  ('kanika-mishra'),
  ('sahil-andhare')
) as s(slug)
where not exists (
  select 1 from public.expert_availability ea
  where ea.expert_slug = s.slug and ea.day_of_week = 6
);
