-- Adds the applicant's current semester to ambassador_applications.
--
-- Nullable for the same reason as every field migration 0027 added: the table
-- already holds 1,124 real historical rows that can't be backfilled. New
-- submissions are made required at the API layer instead.
--
-- Stored as text rather than an integer to match passing_year and
-- graduation_year, which are also digit-strings. 1 to 10 covers the range of
-- Indian undergraduate programs: 6 for a typical B.Sc/B.Com/BA, 8 for B.Tech,
-- 10 for MBBS and integrated degrees.

alter table public.ambassador_applications
  add column if not exists semester text;

alter table public.ambassador_applications
  add constraint ambassador_applications_semester_check
    check (semester is null or semester = any (array[
      '1','2','3','4','5','6','7','8','9','10'
    ]));
