-- Per-role AI interview type. The interview topic is already driven by the
-- applicant's role (the role string passed to the interview service); this adds
-- the type (warm_up | behavioral | technical) per role, so Technology can run a
-- technical round while the rest run behavioral, all set from one settings page.
--
-- A jsonb map { "<role label>": "<round type>" } rather than five columns, so
-- adding or renaming a role is data, not a schema change. Unknown keys and
-- invalid values are ignored on read (see lib/internship/settings.ts), and any
-- role missing from the map falls back to interview_round_type.

alter table public.internship_settings
  add column if not exists interview_round_by_role jsonb not null default '{}'::jsonb;

-- Seed the shipped per-role defaults onto the existing row so the settings page
-- opens populated rather than all-behavioral.
update public.internship_settings
  set interview_round_by_role = '{"Technology":"technical","UI/UX":"behavioral","Social Media":"behavioral","Sales & Marketing":"behavioral","Community":"behavioral"}'::jsonb
  where id = true and interview_round_by_role = '{}'::jsonb;
