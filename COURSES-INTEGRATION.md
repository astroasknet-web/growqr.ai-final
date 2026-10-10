# Courses, practice tests and LMS (Vidaara integration)

Branch `courses-vidaara-integration`. Built as patches on the existing portal: the catalogue, enrolments, My courses and sessions are reused, nothing is duplicated.

## What was added

| Area | Where | Notes |
|---|---|---|
| Native lessons (4 courses) | `lib/market/lessons.ts`, `lib/market/data/lessons/*.json`, `app/courses/[slug]/learn/**` | Digital Literacy, Data Science, Data Analytics, HTML-CSS. A module quiz pass ticks the existing checkpoint. Rebuild the JSON with `scripts/build-lessons.mjs <vidaara data dir>`. |
| Accessibility + read-aloud | `components/a11y/A11yPanel.tsx`, `lib/a11y/read-aloud.ts`, `app/globals.css` | Browser speech only, settings kept on the device. On `/courses/**` and `/practice-tests/**`. |
| IELTS Reading / Listening | `lib/tests/ielts.ts`, `lib/tests/data/ielts-*`, `app/practice-tests/**` | 30 tests each, graded on the server. Bands are indicative. |
| GRE Quant | `lib/tests/gre.ts`, `lib/tests/data/gre-quant.json` | 30 mocks x 27 questions, no repeats. Scaled score is an estimate. Rebuild with `scripts/build-gre-bank.mjs <sql>`. |
| Teacher / parent roles | `lib/lms/*`, `app/(portal)/{teacher,parent,my-classes}` | Classes by join code, assignments, gradebook + CSV, learner code for parents. |
| SEO | `app/sitemap.ts`, per-page metadata and JSON-LD | Result pages (`?a=`) are noindex and not in the sitemap. |

## Database

Two new idempotent migrations (applied automatically when `PORTAL_AUTO_MIGRATE=1`, or `npm run portal:migrate`):

- `20261010000001_test_attempts.sql`
- `20261011000001_lms.sql` (also widens `users.role` to add `teacher` and `parent`)

After pulling, load the four new catalogue rows: `npx tsx scripts/courses-sync.ts` (the catalogue is now 120 courses).

## Testing against a real database

Tests that need Postgres skip unless `PORTAL_TEST_DATABASE_URL` is set. A throwaway local one works:

```bash
npm i --no-save @electric-sql/pglite @electric-sql/pglite-socket
npx pglite-server --db=./.pgdata --port=5544 --max-connections=10
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5544/postgres DATABASE_SSL=disable npm run portal:migrate
DATABASE_URL=... DATABASE_SSL=disable npx tsx scripts/courses-sync.ts
PORTAL_TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5544/postgres DATABASE_SSL=disable npx vitest run
```

## Known limits

- Listening audio and read-aloud use the visitor's browser voices; quality varies and a device with no English voice gets a message instead of audio.
- The Listening runner ships the spoken script to the browser (it is the audio source).
- HTML-CSS live playground widgets were not ported.
- No completion certificates for native courses or tests yet; native completions count as "self-reported".
- IELTS Writing / Speaking are not auto-marked (no invented scores).
- Teacher and parent sign-up are open; consider admin approval for teachers before launch.
- Site-wide footer and navbar colour contrast (axe) was already failing before this work and was left alone.
