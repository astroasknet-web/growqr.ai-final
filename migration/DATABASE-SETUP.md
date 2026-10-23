# Database setup (courses, LMS, internships, Resume Studio, study abroad)

## The short answer

The portal needs **PostgreSQL**. It does **not** use MySQL, and nothing has to be created in Hostinger's MySQL.

- The code talks to Postgres through the `pg` driver (`lib/portal/db.ts`) and uses Postgres features (`pg_trgm`, `ILIKE`, `RETURNING`, `jsonb`), so a MySQL or MariaDB database cannot run it.
- The database you already had is **Supabase**, which is hosted Postgres. Keep using it. The Hostinger Node app only has to be given its connection string.
- Hostinger's shared plans offer MySQL only. If you ever want the database on Hostinger itself, it needs a VPS with PostgreSQL installed. Supabase is simpler.

## What does and does not need the database

| Works with no database | Needs the database |
|---|---|
| Blog, home page, exam prep (`/exam-prep`), JEE, NEET, AP (`/learn`), mock exams (`/exam`), CAT/SAT/GRE/SSC/CTET (`/study`), school Class 1 to 12 (`/school`), Maths Olympiad (`/olympiad`), IELTS (`/ielts`), Vedic Maths (`/vedic-math`), the course catalogue list and course detail pages | Log in and sign up, enrol in a course and save progress (`/my-courses`), the lesson player for the native courses (`/courses/<course>/learn`), teachers, classes and parents, Resume Studio, Skill Passport, internships, study abroad, admin console |

## Set it up (Supabase)

1. In Supabase, open the project, then **Project settings, Database, Connection string**, choose **Session pooler** (port 5432) and copy it. Replace `[YOUR-PASSWORD]` with the database password.
2. In the Hostinger Node app, add these variables, then **Redeploy**:

```
DATABASE_URL=postgresql://postgres.<project>:<password>@<host>.pooler.supabase.com:5432/postgres
PORTAL_AUTO_MIGRATE=1
PORTAL_APP_URL=https://qrscore.mathstudy.in
PASSPORT_SIGNING_SEED=<32 or more random characters>
HOSTNAME=0.0.0.0
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

3. If Hostinger does not pass the dashboard variables to the app (the app starts but `/api/health` says the database is not configured), create a file named `.env.production` next to `server.js` (File Manager) with the same lines, one `NAME=value` per line, and restart. A redeploy can wipe that folder, so keep a copy. `HOSTINGER.md` section 9 has the details.
4. Open `https://qrscore.mathstudy.in/api/health`. It should answer `{"ok":true,"database":"ok"}`.

On the first start the app creates every table and loads the 121 courses and the university catalogue (`PORTAL_AUTO_MIGRATE=1`). It is safe to repeat. Start-up prints `[portal] migrations: ...` and `[portal] catalogues: ...` in the Hostinger log.

## Requirements

| Item | Requirement |
|---|---|
| Engine | PostgreSQL 14 or newer (Supabase) |
| Extension | `pg_trgm` (Supabase has it) |
| Size | Under 500 MB for the first year, apart from uploaded files |
| Connections | `DATABASE_POOL_MAX=3` is enough on small plans. Use the pooler string |
| SSL | On by default. `DATABASE_SSL=disable` only for a local database |
| Storage | Optional: private Supabase Storage buckets `resumes` and `vault`. Without `SUPABASE_SERVICE_ROLE_KEY`, uploads go to the `./storage` folder on the server |

Other settings, each for one feature: `RESEND_API_KEY` and `PORTAL_MAIL_FROM` (emails), `CRON_SECRET` (the 10-minute job), `RAZORPAY_*` (Resume Studio Pro), `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` (internships from the web), `TURNSTILE_SECRET_KEY` (bot check).

## Test it on your own computer

A throwaway Postgres-compatible database is enough to check the whole portal:

```bash
npm i --no-save @electric-sql/pglite @electric-sql/pglite-socket
npx pglite-server --db=./.pgdata --port=5544 --max-connections=10
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5544/postgres DATABASE_SSL=disable npm run portal:migrate
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5544/postgres DATABASE_SSL=disable npx tsx scripts/courses-sync.ts
PORTAL_TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5544/postgres DATABASE_SSL=disable npx vitest run
```
