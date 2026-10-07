-- Links an internship application to the applicant's GrowQR platform profile.
--
-- Every internship applicant must be a GrowQR user, so the profile link is
-- required at the API layer for new submissions. The columns stay nullable
-- because internship_applications already holds a couple of test rows, and
-- because a future non-form insert (an imported referral, say) shouldn't be
-- blocked by a NOT NULL it can't satisfy. Same tradeoff migration 0027 made
-- for the identity fields.
--
-- On growqr_user_id: the UUID in a public profile link (app.growqr.ai/p/<id>)
-- is not a separate "profile id", it IS the GrowQR user-service user id. The
-- profile page's own avatar_url resolves to
--   api.growqr.ai/users/api/v1/users/<same-uuid>/photo
-- which returns the image for a real id and 404s for an unknown one. So this
-- one column is the applicant's GrowQR identity, and storing it a second time
-- under a "profile id" name would just be the same value twice.
--
-- Not to be confused with the Clerk user id, which is what user-service's
-- get_profile identity gateway keys on. That one isn't exposed publicly and
-- needs a signed sign-in handoff to obtain.
--
-- What is deliberately NOT stored: the profile's own fields. Name, college,
-- skills and so on are prefilled into the normal form columns, where they
-- become the candidate's submitted answers and can be edited before submit.
-- The GrowQR app stays the source of truth for the live profile, this table
-- stays the source of truth for the application.

alter table public.internship_applications
  -- The GrowQR user id, taken from the /p/<id> link. See note above.
  add column if not exists growqr_user_id          uuid,
  add column if not exists growqr_profile_url      text,
  -- Immutable capture at submit time. The live profile answers "who are they
  -- now"; this answers "what did they claim when they applied", which HR
  -- needs once the candidate edits their profile afterwards.
  add column if not exists growqr_profile_snapshot jsonb,
  -- Denormalised out of the snapshot purely so the admin list can sort and
  -- filter on it without unpacking jsonb on every row.
  add column if not exists growqr_rq_score         numeric;

alter table public.internship_applications
  add constraint internship_applications_growqr_profile_url_check
    check (growqr_profile_url is null or growqr_profile_url ~* '^https?://'),
  add constraint internship_applications_growqr_rq_score_check
    check (growqr_rq_score is null or growqr_rq_score between 0 and 100);

-- One application per GrowQR user, matching the existing email/phone/aadhaar
-- uniqueness. NULLs are not equal to each other in Postgres unique
-- constraints, so the existing rows with no profile are unaffected.
alter table public.internship_applications
  add constraint internship_applications_growqr_user_id_key
    unique (growqr_user_id);

create index if not exists internship_applications_growqr_rq_score_idx
  on public.internship_applications (growqr_rq_score desc nulls last);
