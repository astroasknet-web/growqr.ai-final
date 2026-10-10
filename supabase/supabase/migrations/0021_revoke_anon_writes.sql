-- 0021 — remove the last anonymous write paths into the database
--
-- ⚠️  ORDERING: APPLY THIS *AFTER* THE CODE THAT ACCOMPANIES IT IS DEPLOYED.
--
--     Unlike 0020 (which only removed policies nothing was using), this one
--     removes policies the PREVIOUSLY DEPLOYED code depends on. Applying it
--     against the old build breaks four live forms instantly. The matching code
--     change moves every one of these writes onto the service role:
--
--       app/api/seeker-waitlist/route.ts     anon client → createAdminClient
--       app/api/ambassador-waitlist/route.ts anon client → createAdminClient
--       app/api/send-ambassador/route.ts     anon client → createAdminClient
--
--     Deploy first, smoke-test those three forms, then run this.
--
--     support_queries needs no code change: its only writer was the old Gemini
--     chatbot (components/chat/Chatbot.tsx), which has been deleted now that
--     Zoho SalesIQ is the live assistant. The 266 existing rows are kept as
--     history; nothing writes the table any more.
--
-- WHY: every policy below granted INSERT to `anon`. The anon key is published in
-- the browser bundle, so each one was an open write endpoint on PostgREST that
-- completely bypassed the Turnstile verification and rate limiting the API
-- routes enforce — a bot could skip the form and post straight to the database.
-- Routing these writes through the service role means the API route is the only
-- way in, and the bot checks are no longer optional.
--
-- After this migration the only remaining non-service-role policy in `public` is
-- the deliberate public read of active events.

begin;

drop policy if exists "anon insert"       on public.seeker_waitlist;
drop policy if exists "anon insert"       on public.ambassador_waitlist;
drop policy if exists "anon_insert_only"  on public.ambassador_applications;
drop policy if exists "Anyone can submit support queries" on public.support_queries;

commit;

-- Verify (expect ONLY the events read + the admin_activity_logs service_role
-- insert to remain):
--
--   select c.relname, p.polname, p.polcmd,
--          (select array_agg(rolname) from pg_roles where oid = any(p.polroles))
--   from pg_policy p
--   join pg_class c on c.oid = p.polrelid
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public';
--
-- RLS stays ENABLED on every table. With no policy present, the anon and
-- authenticated roles are denied by default — which is the intent. The service
-- role bypasses RLS entirely, so all server-side reads and writes are unaffected.
