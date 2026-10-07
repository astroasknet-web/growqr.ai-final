# Running the portal on Hostinger (qrscore.mathstudy.in)

One Node app on Hostinger, built by GitHub, talking to the qrscore Supabase project. The old PHP site is simply detached from the domain.

```
 you push to main ──> GitHub Actions: test + next build ──> branch `deploy` (a ready-to-run server)
                                                              │
 Hostinger Node app (was test.vidaara.org) pulls `deploy`, runs `node server.js`
                                                              │
 qrscore.mathstudy.in ──> that app ──> Supabase (database + private file buckets)
```

Why GitHub builds it: the build needs far more memory than a small Hostinger plan allows (the vidaara.org app has crashed on memory before). Hostinger only has to run the finished server.

## 1. One-time GitHub setup (repo `astroasknet-web/growqr.ai-final`)

1. **Settings -> Secrets and variables -> Actions -> New repository secret**, name `BUILD_ENV`, value = these lines (they are baked into the browser code, so only public values):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<qrscore project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   NEXT_PUBLIC_RAZORPAY_KEY_ID=<rzp key id>
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile site key>
   ```
   Add any other `NEXT_PUBLIC_*` line from `migration/env.example` that you use.
2. **Settings -> Actions -> General -> Workflow permissions:** "Read and write permissions".
3. Push to `main` (or Actions -> "Build portal for Hostinger" -> Run workflow). It type-checks, runs the tests, builds, and force-pushes the result to the `deploy` branch (about 5 minutes, about 110 MB). Never edit `deploy` by hand.

## 2. Hostinger: turn the old test.vidaara.org Node app into the portal

hPanel wording differs a little between plans; the settings you need are these.

| Setting | Value |
|---|---|
| Repository | `astroasknet-web/growqr.ai-final` (Hostinger's GitHub connection must be allowed to read it; this repo is under the `astroasknet-web` account) |
| Branch | `deploy` |
| Framework / preset | Other / Node.js (not "Next.js": the build is already done) |
| Install command | leave empty (everything is inside the folder) |
| Build command | leave empty |
| Start command / entry file | `node server.js` |
| Node version | 20 or 22 |

If Hostinger insists on a build command, use `echo done`.

### Environment variables (Hostinger -> the app -> Environment)

| Name | Value |
|---|---|
| `HOSTNAME` | `0.0.0.0` (the server must listen on all addresses; Hostinger supplies `PORT`) |
| `SITE_MODE` | `portal` (marketing pages redirect to `MARKETING_URL`) |
| `MARKETING_URL` | `https://growqr.ai` |
| `SITE_NOINDEX` | `1` while testing (adds "do not index"); remove at go-live |
| `PORTAL_APP_URL` | `https://qrscore.mathstudy.in` (no trailing path) |
| `DATABASE_URL` | Supabase -> Project settings -> Database -> **Session pooler** (port 5432) or Direct connection string |
| `PORTAL_AUTO_MIGRATE` | `1` (on every start: builds missing tables, loads the course and university catalogues; safe to repeat) |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | for private file storage (buckets `resumes` and `vault`; the app uses the existing ones, create them as **private** if missing) |
| `PASSPORT_SIGNING_SEED` | at least 32 characters; the **same** value the PHP app used, or old passports stop verifying (any value is fine if nothing real exists) |
| `RESEND_API_KEY`, `PORTAL_MAIL_FROM` | outgoing email (verify the sending domain in Resend) |
| `CRON_SECRET` | a long random string (used by the scheduled job below) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` | payments (test keys are fine) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | bot check on signup/login (add `qrscore.mathstudy.in` to the widget's allowed hostnames) |
| `PORTAL_ADMIN_EMAIL`, `CRM_VERIFY_*`, `LMS_WEBHOOK_SECRET`, `COURSES_BASE_URL` | optional, see `migration/env.example` |

Do **not** set `PORTAL_MFA_REQUIRE_STAFF=false` outside a laptop.

## 3. Point qrscore.mathstudy.in at the Node app

1. In hPanel remove (or rename) the `qrscore` subdomain from the PHP website so the name is free. The PHP files can stay on disk as a fallback.
2. Add `qrscore.mathstudy.in` as the domain of the Node app. If `mathstudy.in` DNS is at Hostinger this is automatic; otherwise create the DNS record Hostinger tells you to (A record to the Node app's IP, or the CNAME it shows).
3. Enable the free SSL certificate and wait for it to turn green.
4. Open `https://qrscore.mathstudy.in/api/health`. It should answer `{"ok":true,"database":"ok"}`.

## 4. Scheduled job (email queue, visa reminders, session cleanup)

hPanel -> Advanced -> Cron Jobs, every 10 minutes:

```
*/10 * * * * curl -s -H "Authorization: Bearer <CRON_SECRET>" https://qrscore.mathstudy.in/api/cron/portal > /dev/null
```

## 5. First admin

From your own computer (needs Node and a clone of the repo):

```
DATABASE_URL=<the same Supabase string> npx tsx scripts/portal-create-user.ts you@example.com "Your Name" admin
```

It prints a one-time password; log in at `/login` and set up two-step login when asked.

## 6. Test checklist

1. `/api/health` ok; `/` goes to `/resume-score`; `/events` goes to `https://growqr.ai/events`.
2. Sign up as a student, confirm the email, score a resume at `/passport`, publish and open `/v/CODE`.
3. Log in as the admin: `/console` (queue, colleges, studio, abroad, analytics), `/crm`, `/counselor`.
4. Employer: post a role, approve it in `/console`, apply as a student.
5. `/study-abroad`, upload a document under `/abroad/documents`, verify it as admin.
6. Old link `/v.php?c=CODE` answers 308 to `/v/CODE`.
7. Razorpay test payment in Resume Studio (set the webhook to `https://qrscore.mathstudy.in/api/studio/webhook`).
8. Wait ten minutes: the cron call returns `{"status":"ok",...}` (check in the Hostinger cron log).

## 7. Updating and going back

- **Update:** push to `main`, wait for the green workflow, then press "Redeploy" (or let auto-deploy pull `deploy`).
- **Back to PHP:** detach the domain from the Node app and re-add the `qrscore` subdomain to the PHP site. The database is shared and every portal change is additive, so the PHP app keeps working.
- **Logs:** Hostinger -> the app -> Logs. Start-up prints `[portal] migrations: ...` and `[portal] catalogues: ...`.
- **"Application failed to start":** check that `HOSTNAME=0.0.0.0`, that Node is 20 or 22, and that the branch is `deploy` (not `main`).
- **Memory:** the running server needs roughly 200 to 300 MB. `DATABASE_POOL_MAX=3` lowers the connection use.

## 8. Going live later

Remove `SITE_NOINDEX`, and check the Resend domain, the Razorpay live keys and the real `PASSPORT_SIGNING_SEED`. When you later fold the portal into growqr.ai itself, the domain changes: use the "re-issue passports" button in `/console/analytics?tab=system` and keep this host as a redirect.
