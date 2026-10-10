-- Records the candidate's GrowQR ACCOUNT email, resolved from the interview
-- service, separate from the address they typed on our form.
--
-- Migration 0037 assumed the join key was simply the email we already hold.
-- The interview-assignment contract corrects that: assignments are matched on
-- the account email, which is NOT internship_applications.email (the form
-- address) and NOT the profile endpoint's public_email (a resume/LinkedIn
-- address, often null). Assigning against the wrong one returns success with a
-- real assignment_id, and the candidate never sees the interview, with no
-- error raised. So the account email is resolved once, through
--   GET /users/api/v1/users/by-id/{growqr_user_id}/clerk-id
--   GET /users/api/v1/users/by-clerk-id/{clerk_id}
-- and cached here, keyed off the profile UUID we already store in
-- growqr_user_id. Null until an assignment is first attempted.
alter table public.internship_applications
  add column if not exists growqr_account_email text;

comment on column public.internship_applications.growqr_account_email is
  'GrowQR account email resolved via the user-service, used for interview '
  'assignment. Distinct from email (form address) and the public profile '
  'public_email. Null until first resolved.';
