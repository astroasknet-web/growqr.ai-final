-- Add UTM attribution columns to ambassador_applications.
-- Captures which ambassador referral link each application came through.
-- utm_medium holds the ambassador identifier (e.g. "aakarsh_bibhaw"),
-- utm_source is "campusambassadors", utm_campaign is "gaigcp".
-- All nullable so existing rows and any non-UTM submissions are unaffected.
alter table public.ambassador_applications
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;
