-- 0020 — RLS hardening (pre-UAT security audit, 2026-08-06)
--
-- Closes two classes of broken access control found by auditing the LIVE
-- policies against how the code actually reads and writes each table:
--
--   1. PUBLIC READ OF PII. `newsletter_subscribers` (126 rows incl. email) and
--      `waitlist` (88 rows) had SELECT policies granted to PUBLIC/anon. The
--      anon key ships in the browser bundle, so both tables were effectively
--      world-readable. Neither policy was used by any code path.
--
--   2. RLS IGNORED THE ADMIN ALLOWLIST. Several policies granted access to the
--      `authenticated` role, which is ANY signed-in Supabase account. The app's
--      admin gate is `app_metadata.is_admin` (lib/auth/admin-allowlist.ts), but
--      RLS never checked it — so any account could bypass the allowlist
--      entirely by going straight to PostgREST and read 1,124 ambassador
--      applications, 1,714 admin activity logs, 266 support queries and every
--      contact message.
--
-- SAFETY: every admin read/write in this repo goes through the SERVICE ROLE
-- (`createAdminClient`, lib/supabase-server.ts), which bypasses RLS entirely.
-- The browser client is used only for login/logout auth. Verified by
-- enumerating every `.from(...)` call site before writing this. Dropping these
-- policies therefore removes reachable attack surface and changes no feature.
--
-- The anon INSERT policies that ARE load-bearing are deliberately KEPT and
-- documented at the bottom of this file.

begin;

-- ── 1. Public read of PII ───────────────────────────────────────────────────

-- 126 rows, 25 columns including email. Nothing reads this from the client;
-- app/api/send-newsletter-subscribe/route.ts writes with the service role.
drop policy if exists "Public can count subscribers" on public.newsletter_subscribers;

-- `using (true)` — the entire table, 88 rows. The table is not referenced by
-- any code at all (legacy); no `.from("waitlist")` call site exists.
drop policy if exists "Public can check status" on public.waitlist;
drop policy if exists "Anyone can join waitlist" on public.waitlist;

-- ── 2. Policies granting access to ANY signed-in user ───────────────────────

-- `for all using (true) with check (true)` on 1,124 applications — read AND
-- update AND delete. Admin pages and /api/admin/applications use the service
-- role. The anon INSERT policy below is what the public apply form needs.
drop policy if exists "authenticated_full_access" on public.ambassador_applications;

-- app/api/send-contact and the admin surfaces both use the service role.
drop policy if exists "Allow authenticated reads"   on public.contact_messages;
drop policy if exists "Allow authenticated updates" on public.contact_messages;
drop policy if exists "Allow anonymous inserts"     on public.contact_messages;

-- /api/admin/logs reads with the service role behind getAdminUser().
drop policy if exists "Allow authenticated users to view logs" on public.admin_activity_logs;

-- Nothing reads support_queries from the client. (The INSERT policy is kept —
-- components/chat/Chatbot.tsx writes with the browser anon client.)
drop policy if exists "Authenticated users can view all support queries" on public.support_queries;

-- Anyone could update any subscriber row; no unsubscribe flow uses the anon
-- key, and the subscribe route writes with the service role.
drop policy if exists "Users can unsubscribe"           on public.newsletter_subscribers;
drop policy if exists "Anyone can subscribe to newsletter" on public.newsletter_subscribers;

-- ── 3. Dead tables — no code references them at all ─────────────────────────

drop policy if exists "Admin view only"          on public.growqrgroup;
drop policy if exists "Enable insert for everyone" on public.mentorship_requests;

-- ── 4. The unauthenticated SECURITY DEFINER write path ──────────────────────
--
-- handle_form_submission() inserts into growqrgroup as its owner, bypassing
-- RLS, and was callable by `anon` over /rest/v1/rpc/ — an unauthenticated write
-- endpoint with no Turnstile and no rate limit. It appears nowhere in the
-- codebase except the generated types.
revoke execute on function public.handle_form_submission(text, text, text, text, text, text)
  from anon, authenticated, public;

-- ── 5. Pin search_path on SECURITY DEFINER / trigger functions ──────────────
--
-- A mutable search_path lets a caller who can create objects in an earlier
-- schema shadow the tables these functions reference. Bodies are unchanged.
-- Only handle_form_submission is SECURITY DEFINER; the rest are INVOKER, where
-- a pinned search_path is defence in depth rather than a live hole. Signatures
-- are spelled out in full because both bot functions are overload-shaped.
alter function public.handle_form_submission(text, text, text, text, text, text)
  set search_path = public, pg_temp;
alter function public.update_updated_at_column() set search_path = public, pg_temp;
alter function public.set_events_updated_at()    set search_path = public, pg_temp;
alter function public.touch_bot_visitor(text, text, text, text, text)
  set search_path = public, pg_temp;
alter function public.resolve_bot_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text
) set search_path = public, pg_temp;

commit;

-- ── DELIBERATELY KEPT ───────────────────────────────────────────────────────
--
-- These anon policies are load-bearing. Each one backs a code path that writes
-- with the anon key rather than the service role; revoking any of them breaks a
-- live form. Listed here so a future audit does not "clean them up".
--
--   seeker_waitlist          "anon insert"
--     app/api/seeker-waitlist/route.ts uses createAnonServerClient() on purpose.
--
--   ambassador_waitlist      "anon insert"
--     app/api/ambassador-waitlist/route.ts builds a client from the anon key.
--
--   ambassador_applications  "anon_insert_only"
--     app/api/send-ambassador/route.ts builds a client from the anon key.
--
--   support_queries          "Anyone can submit support queries"
--     components/chat/Chatbot.tsx inserts from the BROWSER via lib/supabase.ts.
--
--   events                   "Active events are readable by anyone"
--     Public event pages read active events directly.
--
--   admin_activity_logs      "Allow service role to insert logs"
--     service_role only; not reachable with the anon key.
--
-- All of these are INSERT-only (or a scoped public read), so none of them can
-- disclose stored data. The API routes in front of them still enforce Turnstile
-- and rate limiting; the policies mean a determined spammer could bypass those
-- by posting straight to PostgREST, which is accepted at current volume and
-- tracked as a P1 follow-up rather than fixed here (fixing it means moving
-- those four writes onto the service role, a behaviour change, not a policy
-- change).
