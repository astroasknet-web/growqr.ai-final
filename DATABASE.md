# Database: MySQL

The portal and the marketing site keep **all** of their data in one MySQL (or MariaDB) database: accounts, Skill Passport, Resume Studio, internships, courses and the LMS, study abroad, the Overseas CRM, the admin console, and the marketing tables (events, expert bookings, internship and ambassador applications, waitlists, B2B leads, contact messages, newsletter, the chat bot and the admin activity log). Supabase is no longer used.

Step by step set-up on Hostinger: [`migration/DATABASE-SETUP.md`](migration/DATABASE-SETUP.md).

## Where things are

| What | Where |
|---|---|
| Connection and query helpers (`all`, `one`, `val`, `run`, `tx`) | `lib/portal/db.ts` |
| Schema files, applied in order and recorded in `schema_meta` | `db/migrations/2026*.sql` |
| Migration runner (`npm run portal:migrate`, or on start with `PORTAL_AUTO_MIGRATE=1`) | `lib/portal/migrate.ts` |
| Marketing data layer (query builder and database functions used by the forms, admin, bookings and bot) | `lib/data/` |
| Uploaded files (resumes, documents, event photos) and signed links | `lib/market/storage.ts`, `lib/data/storage.ts`, `app/api/files/` |
| Admin sign-in | the portal's staff login (account role `admin`), `lib/auth/admin.ts` |

## Notes for developers

- SQL is written with `$1, $2` placeholders; `translate()` in `lib/portal/db.ts` turns each statement into MySQL (placeholders, `ILIKE`, `ANY`, `INTERVAL`, `RETURNING id`, `ON CONFLICT`, `COUNT(*) FILTER`, casts). Write new queries in plain portable SQL and avoid JSON operators (`->`, `->>`), `RETURNING` on `UPDATE`, `DISTINCT ON`, and `NULLS LAST`.
- Times are stored as `DATETIME` in UTC. The marketing data layer turns them into ISO strings; the portal code reads them as `YYYY-MM-DD HH:MM:SS` text.
- JSON is kept in `LONGTEXT` columns. The marketing layer marks them with the column comment `json` and parses and writes them for you.
- Tests that need a database skip themselves unless `PORTAL_TEST_DATABASE_URL` is set; see the end of `migration/DATABASE-SETUP.md`.
