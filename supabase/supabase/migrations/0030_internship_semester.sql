-- Adds the applicant's current semester to internship_applications, mirroring
-- migration 0029 for ambassador_applications.
--
-- Capped at 8 rather than ambassador's 10: internship hiring targets
-- engineering and similar undergraduate programs, where 8 is the full span.
--
-- Nullable for consistency with 0027/0028 and so the two existing test rows
-- don't block the migration. New submissions are made required at the API
-- layer instead.

alter table public.internship_applications
  add column if not exists semester text;

alter table public.internship_applications
  add constraint internship_applications_semester_check
    check (semester is null or semester = any (array[
      '1','2','3','4','5','6','7','8'
    ]));
