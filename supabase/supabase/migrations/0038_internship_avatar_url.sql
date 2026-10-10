-- The applicant's profile photo URL, denormalised out of the snapshot.
--
-- The admin list rendered avatars from a URL derived off growqr_user_id:
--   api.growqr.ai/users/api/v1/users/<id>/photo
-- That works only for users whose photo the user-service itself hosts. A user
-- who signed in with Google keeps a Clerk-hosted image instead
-- (img.clerk.com/...), and the derived URL 404s for them, so a real photo
-- silently degraded to initials.
--
-- The correct URL is already in growqr_profile_snapshot.avatar_url. This
-- copies it into its own column for exactly the reason 0028 gave for
-- growqr_rq_score: so the list query can read it without unpacking jsonb on
-- every row.
--
-- Nullable, and the UI still falls back to the derived URL and then to
-- initials, so an older row or a candidate with no photo renders fine.

alter table public.internship_applications
  add column if not exists growqr_avatar_url text;

alter table public.internship_applications
  drop constraint if exists internship_applications_growqr_avatar_url_check;

alter table public.internship_applications
  add constraint internship_applications_growqr_avatar_url_check
    check (growqr_avatar_url is null or growqr_avatar_url ~* '^https?://');

update public.internship_applications
   set growqr_avatar_url = growqr_profile_snapshot->>'avatar_url'
 where growqr_avatar_url is null
   and growqr_profile_snapshot->>'avatar_url' ~* '^https?://';
