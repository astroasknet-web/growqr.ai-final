-- Ensure the email column is unique.
-- CREATE UNIQUE INDEX IF NOT EXISTS is valid Postgres syntax (unlike ADD CONSTRAINT IF NOT EXISTS).
create unique index if not exists ambassador_waitlist_email_idx
  on public.ambassador_waitlist (email);
