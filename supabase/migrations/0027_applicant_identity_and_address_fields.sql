-- Adds Aadhaar number, gender, home town, current address, and college
-- location to both applicant tables. Nullable on ambassador_applications
-- because it already holds 1,124 real historical rows that can't be
-- backfilled with real values (same tradeoff as the phone-uniqueness
-- decision in migration 0026), required-ness for new submissions is
-- enforced at the API layer instead. internship_applications is
-- effectively empty (2 test rows) but kept nullable too, for symmetry
-- with ambassador and to allow future non-form inserts.
--
-- UNIQUE(aadhaar_number) is safe to add even with existing NULL rows:
-- Postgres does not treat NULL as equal to NULL in unique constraints.

alter table public.ambassador_applications
  add column if not exists aadhaar_number  text,
  add column if not exists gender          text,
  add column if not exists home_town       text,
  add column if not exists current_address text,
  add column if not exists college_location text;

alter table public.ambassador_applications
  add constraint ambassador_applications_aadhaar_number_key unique (aadhaar_number),
  add constraint ambassador_applications_aadhaar_number_check
    check (aadhaar_number is null or aadhaar_number ~ '^\d{12}$'),
  add constraint ambassador_applications_gender_check
    check (gender is null or gender = any (array['male','female'])),
  add constraint ambassador_applications_home_town_check
    check (home_town is null or char_length(trim(both from home_town)) between 2 and 200),
  add constraint ambassador_applications_current_address_check
    check (current_address is null or char_length(trim(both from current_address)) between 5 and 500),
  add constraint ambassador_applications_college_location_check
    check (college_location is null or char_length(trim(both from college_location)) between 2 and 200);

alter table public.internship_applications
  add column if not exists aadhaar_number  text,
  add column if not exists gender          text,
  add column if not exists home_town       text,
  add column if not exists current_address text,
  add column if not exists college_location text;

alter table public.internship_applications
  add constraint internship_applications_aadhaar_number_key unique (aadhaar_number),
  add constraint internship_applications_aadhaar_number_check
    check (aadhaar_number is null or aadhaar_number ~ '^\d{12}$'),
  add constraint internship_applications_gender_check
    check (gender is null or gender = any (array['male','female'])),
  add constraint internship_applications_home_town_check
    check (home_town is null or char_length(trim(both from home_town)) between 2 and 200),
  add constraint internship_applications_current_address_check
    check (current_address is null or char_length(trim(both from current_address)) between 5 and 500),
  add constraint internship_applications_college_location_check
    check (college_location is null or char_length(trim(both from college_location)) between 2 and 200);
