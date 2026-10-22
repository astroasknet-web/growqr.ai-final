# Database setup for the portal (courses, LMS, internships, Resume Studio, study abroad)

The portal pages need one PostgreSQL database. Nothing else has to be created by hand: the app builds its own tables and loads the course and university catalogues when it starts.

## What to create

| Item | Requirement |
|---|---|
| Engine | PostgreSQL 14 or newer. Supabase is what the project is built for (the pooler "Session mode" string, port 5432, or the direct connection string). |
| Extension | `pg_trgm` (`create extension if not exists pg_trgm;`). Supabase has it; on a plain Postgres, run it once as a superuser. |
| Size | Small. Under 500 MB for the first year, apart from uploaded resumes and documents. |
| Connections | Pool of 3 to 5 (`DATABASE_POOL_MAX`). The pooler string is best on shared hosting. |
| SSL | On by default. Use `DATABASE_SSL=disable` only for a local database. |
| Time zone | UTC (default). `DB_TIMEZONE` only if you already have data in another zone. |
| Storage | Two **private** buckets named `resumes` and `vault` (Supabase Storage) for uploaded files. Without the Supabase keys, files go to the `./storage` folder on the server. |

## Environment variables (on the Node app, then Redeploy)

Required for the database features to work:

```
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/postgres
PORTAL_AUTO_MIGRATE=1
PORTAL_APP_URL=https://qrscore.mathstudy.in
PASSPORT_SIGNING_SEED=<32 or more random characters>
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Needed for specific features: `RESEND_API_KEY` and `PORTAL_MAIL_FROM` (emails), `CRON_SECRET` (scheduled jobs), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Resume Studio Pro), `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` (internships from the web), `LMS_WEBHOOK_SECRET` (completion callbacks), `TURNSTILE_SECRET_KEY` (bot check).

If Hostinger does not pass dashboard variables to the app, put the same lines in a file named `.env.production` next to `server.js`, and restart.

## What happens on start

1. The app connects with `DATABASE_URL`.
2. `PORTAL_AUTO_MIGRATE=1` applies the portal migrations (`supabase/migrations/2026*.sql`) that the database has not seen, then loads the 121 courses and the university catalogue. It is safe to repeat.
3. The Hostinger log shows `[portal] migrations: ...` and `[portal] catalogues: ...`.

Tables created include: users, student_profiles, passports, resumes, studio_* (Resume Studio), courses, course_categories, course_enrolments, classes, class_members, assignments, parent_links, learner_codes, test_attempts, internships, internship_applications, companies, saved_internships, external_internships, sa_* (study abroad), crm_* and mail_outbox.

## Check it works

Open `https://<your domain>/api/health`. A healthy server answers `{"ok":true,"database":"ok"}`. Then `/courses` shows the full catalogue with search and enrolment, and `/internships` stops saying "not available".

## Vidaara content

The free courses and exam-prep hubs from vidaara.org (JEE, NEET, UPSC, SSC CGL, CAT, SAT, GRE, GMAT, IELTS, AP Calculus, IMO and the rest) are listed at `/exam-prep` from `lib/market/data/vidaara-exams.json`. That list needs no database. The lessons and question banks themselves stay on Vidaara. To bring the lessons into GrowQR's own player, export Vidaara's content tables (JSON or SQL) and import them with the lesson build scripts (`scripts/build-lessons.mjs`, `scripts/build-gre-bank.mjs`).
