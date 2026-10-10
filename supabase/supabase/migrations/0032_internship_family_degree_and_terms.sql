-- Meeting outcome (2026-08-24), internship form only. The ambassador form is
-- deliberately untouched.
--
-- Adds parents' names, date of birth and degree specialization, plus the
-- internship terms discussed: mode, duration and languages.
--
-- Nullable throughout, matching 0027 and 0030: required-ness for new
-- submissions is enforced at the API layer so the existing rows don't block
-- the migration.
--
-- `semester` is deliberately NOT dropped. The same meeting removed it from the
-- form, so nothing writes it any more, but dropping a column is irreversible
-- and its existing values (all NULL) cost nothing to keep. Drop it in a later
-- migration once the removal has stuck.

alter table public.internship_applications
  add column if not exists father_name           text,
  add column if not exists mother_name           text,
  add column if not exists dob                   date,
  add column if not exists degree_specialization text;

alter table public.internship_applications
  drop constraint if exists internship_applications_father_name_check,
  drop constraint if exists internship_applications_mother_name_check,
  drop constraint if exists internship_applications_dob_check,
  drop constraint if exists internship_applications_degree_specialization_check;

alter table public.internship_applications
  add constraint internship_applications_father_name_check
    check (father_name is null or char_length(trim(both from father_name)) between 2 and 200),
  add constraint internship_applications_mother_name_check
    check (mother_name is null or char_length(trim(both from mother_name)) between 2 and 200),
  -- Floor of 1900 catches typo'd centuries; the 15-year ceiling is the
  -- youngest plausible undergraduate applicant. Mirrors lib/dob.ts.
  add constraint internship_applications_dob_check
    check (dob is null or (dob > date '1900-01-01' and dob <= (current_date - interval '15 years'))),
  add constraint internship_applications_degree_specialization_check
    check (degree_specialization is null or char_length(trim(both from degree_specialization)) between 2 and 200);

-- Mode and duration are closed sets, so they get the same picklist treatment
-- as `availability` in 0025. Languages stays free text: applicants list
-- several, and a fixed vocabulary would push people into the wrong bucket.
alter table public.internship_applications
  add column if not exists mode      text,
  add column if not exists duration  text,
  add column if not exists languages text;

alter table public.internship_applications
  drop constraint if exists internship_applications_mode_check,
  drop constraint if exists internship_applications_duration_check,
  drop constraint if exists internship_applications_languages_check;

alter table public.internship_applications
  add constraint internship_applications_mode_check
    check (mode is null or mode = any (array['remote','hybrid'])),
  add constraint internship_applications_duration_check
    check (duration is null or duration = any (array['3_months','6_months'])),
  add constraint internship_applications_languages_check
    check (languages is null or char_length(trim(both from languages)) between 2 and 300);

-- Self-reported career profile score. Deliberately NOT required on the form,
-- and the label carries no "optional" marker, so it stays nullable here with
-- no API-layer requirement either. Distinct from growqr_rq_score, which is
-- pulled from the linked GrowQR profile rather than typed by the applicant.
alter table public.internship_applications
  add column if not exists career_profile_score integer;

alter table public.internship_applications
  drop constraint if exists internship_applications_career_profile_score_check;

alter table public.internship_applications
  add constraint internship_applications_career_profile_score_check
    check (career_profile_score is null or career_profile_score between 0 and 100);

-- Admin filters on these two the way it already filters preferred_role.
create index if not exists internship_applications_mode_idx
  on public.internship_applications (mode);
create index if not exists internship_applications_duration_idx
  on public.internship_applications (duration);
