-- Supports an application-level phone-uniqueness check in
-- app/api/send-ambassador/route.ts. Not a unique constraint: the live
-- table already has legitimate duplicate phone numbers (multiple
-- applicants sharing a number), so a hard DB constraint would need a data
-- cleanup decision first. This index just makes the pre-insert lookup fast.
create index if not exists ambassador_applications_phone_idx
  on public.ambassador_applications (phone);
