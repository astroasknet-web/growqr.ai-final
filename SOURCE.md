# test.vidaara.org: source of this copy

- Copied on 2026-10-06 from `D:\GROWQR\GITHUB\newai-main` (git remote `https://github.com/astroasknet-web/newai`).
- Commit `000c917b0dd6e6a7c363396a97dd8b5562cd689e` (2026-10-06). Branches `main`, `dev` and `home-options` were all at this same commit when copied, so it does not matter which one the subdomain deploys.
- This is the GrowQR marketing + admin site (Next.js 15, React 19, MySQL, Razorpay, Zoho).
- Not copied: `.git` (history stays in the original checkout and on GitHub), `node_modules` (reinstall with `npm ci`), `.next` (build output).

## Run it

```
cd "D:\GROWQR\GROWQR FINAL AFTER INTEGRATION\test.vidaara.org"
npm ci
npx next dev -p 3100
```

Open http://localhost:3100 . The six homepage options are at `/home-options` and `/home-options/a` to `/f`.

## What works without the live keys, and what does not

`.env.local` here is the same local-only file as the original: it forces the India experience (`FORCE_COUNTRY`) so the geo-gated sections render. The real Supabase, Resend, Turnstile, Zoho and Razorpay keys are NOT in this copy (they live in the hosting dashboard for the subdomain). Without them the public pages and designs render exactly as on the subdomain, but events, experts, the admin area, forms, payments and the CRM sync need those keys. Copy the values from the hosting dashboard into `.env.local`; `.env.example` lists every variable name.

Never commit `.env.local`.

## Deploy notes (from `vercel.json`)

Region `bom1`. Two daily cron jobs: `/api/cron/crm-sync` (02:00) and `/api/cron/expert-reminders` (02:30).
