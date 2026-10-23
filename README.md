# GrowQR Website

Next.js marketing site for GrowQR — an AI-powered Skill Identity & Readiness
platform. Built with the App Router, React 19, Tailwind, MySQL, and Razorpay.

> **New to this codebase? Start with the handover doc** —
> [`HANDOVER.html`](HANDOVER.html) (browser) ·
> [`HANDOVER.pdf`](HANDOVER.pdf) (print) ·
> [`HANDOVER.docx`](HANDOVER.docx) (Word).
> All three carry the same content: every feature with its current status, where
> its data lives, how to change it, and the open blockers. Sections 01 to 03 are
> the day-one read.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + Framer Motion for UI/animation
- **MySQL** (Hostinger) for accounts, events, expert bookings, applications, and admin data
- **Resend** (transactional email), **Razorpay** (payments — currently disabled, see below)
- **Cloudflare Turnstile** (form bot protection), **OpenAI** (SalesIQ chat fallback)

## Getting started

```bash
npm install
cp migration/env.example .env.local   # then fill in real values
npm run dev
```

Open http://localhost:3000.

See [`migration/env.example`](migration/env.example) for every variable the app needs. Without
a DATABASE_URL the site still runs, but sign-in, events, forms and bookings won't work.

## Branches & deployment

| Branch | Purpose |
|--------|---------|
| **`main`** | Production. Serves **www.growqr.ai** (the apex 308-redirects to it) — **pushing to `main` deploys live.** Treat it carefully. |
| **`dev`** | Team integration branch. We track in-progress builds and feature work here before anything is promoted to `main`. |

### Demo / preview links

We don't have a Vercel team (premium) plan, so there are no automatic per-PR
preview URLs. To share a temporary demo:

1. Install the Vercel CLI: `npm i -g vercel`
2. Log in with **your own personal Vercel account**: `vercel login`
3. From the project root, run `vercel` to deploy the current code as-is to a
   throwaway project under your account — it prints a temporary preview URL you
   can share. Use `vercel --prod` only on your personal project, never the
   production one.

These personal previews are disposable; the source of truth is always the
`main` / `dev` branches in this repo.

## Feature status

This is an early product — some areas are intentionally MVP / quick builds.

- **`/experts`** — Expert profiles are mostly **local static data**
  (`features/experts/data/experts-data.ts`). Booking **availability and slots**
  are managed in the **database** (`features/experts/services/*`, plus the
  `expert_submissions` intake table). Payments are wired but **disabled**
  (`PAYMENTS_ENABLED = false` in `app/api/experts/book/route.ts`) — bookings are
  currently free until a decision is made on charging. This whole flow is still
  MVP-grade.
- **`/events`** — Fully **database-backed** (events, registrations, assets).
  Services live in `features/events/services/*`.
- **Admin dashboard (`/admin`)** — Gated on the portal login: an
  account whose role is `admin` (see `lib/auth/admin.ts` and `middleware.ts`). There is no `ADMIN_EMAILS`
  variable. Provides:
  - **Ambassadors** management (`/admin/ambassador`)
  - **Events** management (`/admin/events`, create/edit)
  - **Registrations** per event (`/admin/registrations/[eventId]`)
  - **Internship** hiring pipeline (`/admin/internship`, plus `/settings`)
  - **Logs** (`/admin/logs`)

Database schema lives in `db/migrations/`.

## Project structure

```
app/            Routes (App Router) + API route handlers
components/      Shared UI + homepage sections
features/        Domain features (experts, events) — UI, services, data
lib/            Cross-cutting helpers (auth, payments, database, email…)
public/         Static assets
db/             Database migrations (MySQL)
```

## Portal (merged from the qrscore app)

Student and staff accounts, Skill Passport, Resume Studio, internships and courses marketplace, study abroad, Overseas CRM, admin console and counselor pages now live in this codebase (`app/(portal)/`, `app/internships`, `app/courses`, `app/study-abroad`, `app/file/[token]`, `app/resume-score`, `lib/portal`, `lib/market`, `lib/abroad`, `lib/crm`, `lib/studio`, `lib/admin`, `lib/qrscore`).

- **Database:** MySQL / MariaDB only. See [`DATABASE.md`](DATABASE.md) and [`migration/DATABASE-SETUP.md`](migration/DATABASE-SETUP.md).
- **Going live:** see [`migration/CUTOVER.md`](migration/CUTOVER.md); history and decisions in [`migration/MIGRATION-PLAN.md`](migration/MIGRATION-PLAN.md).
- **Commands:** `npm run portal:migrate`, `npm run portal:copy-data`, `npm test` (set `PORTAL_TEST_DATABASE_URL` to a scratch database to include the database tests).
- **Old PHP addresses** are redirected by `legacy-redirects.ts`.
