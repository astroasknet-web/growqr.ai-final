# Database: Supabase only

The portal (accounts, Skill Passport, Resume Studio, internships, courses, study abroad, Overseas CRM, admin) keeps **all** of its data in Postgres on Supabase. There is no MySQL, no Hostinger database and no other store. The application connects with one setting, `DATABASE_URL`, and keeps files in two private Supabase Storage buckets.

The schema is the same one the qrscore app runs on Supabase (`qrscore.mathstudy.in` format): table and column names are unchanged, so existing rows are valid as they are.

## What lives where

| What | Where |
|---|---|
| Marketing site tables (events, experts, internship applications, ambassadors, ...) | `supabase/migrations/0001_...` to `0045_...` (Supabase CLI) |
| Portal tables (56) | `supabase/migrations/2026*.sql`, applied by `npm run portal:migrate` |
| Uploaded files | Storage buckets `resumes` and `vault` (private) |
| Sessions | table `portal_sessions` |
| Secrets stored in the database | `schema_meta.app_secret` (signs document links), `passport_keys` (signing key, if not taken from `PASSPORT_SIGNING_SEED`) |

The two migration families have no table names in common, and every portal migration is idempotent (`CREATE ... IF NOT EXISTS`), so running them against a project that already holds the qrscore tables changes nothing.

## One Supabase project

Use the project that growqr.ai already runs on. Steps, in order:

1. **Schema.** `DATABASE_URL=<target> npm run portal:migrate -- --status`, then without `--status`. A fresh database gets all 56 tables; a database that already has them just records the migrations.
2. **Data** (only if the qrscore data lives in a *different* Supabase project):
   ```
   SOURCE_DATABASE_URL=<qrscore project> DATABASE_URL=<target> npm run portal:copy-data -- --dry-run
   SOURCE_DATABASE_URL=<qrscore project> DATABASE_URL=<target> npm run portal:copy-data
   ```
   It copies only portal tables, parents before children, in one transaction (all or nothing). A target table that already has rows is skipped, never overwritten (`--truncate-target` empties the portal tables first, on purpose). Sessions and rate-limit counters are not copied, so everyone logs in once. Counters are moved past the largest copied id. Tested: 13,977 rows, 56 tables, zero count mismatches, next insert gets the next id.
3. **Files.** In the target project create two **private** buckets, `resumes` and `vault`. Copy the objects across from the source project (Supabase dashboard, or `supabase storage cp`); the file names are the names stored in the tables, so nothing else changes. Skip this step when both apps already use the same project.
4. **Environment.** `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (storage), `PASSPORT_SIGNING_SEED` (the same seed the qrscore app used, or every issued passport stops verifying), and the rest of `migration/env.example`.

### Connection string

Use the **direct connection** or the **session-mode pooler** (port 5432). The portal sets the session time zone once per connection, which a transaction-mode pooler (port 6543) does not preserve. `DATABASE_POOL_MAX` (default 5) keeps Vercel's many short-lived instances under the project's connection limit.

### Row level security

Every portal table has RLS switched on and **no policies**, so the public REST and GraphQL APIs can read and write nothing. The server connects as the database owner, which is not subject to RLS. Do not add `anon` or `authenticated` policies to these tables.

## Checking a database is ready

```
npm run portal:migrate -- --status      # everything "applied"
PORTAL_TEST_DATABASE_URL=<a scratch database> npm test
```

The test suite builds its own users and cleans up after itself, but run it against a scratch database, not production. It passes on a database created from the migrations alone (verified on an empty Postgres: 1,163 tests).
