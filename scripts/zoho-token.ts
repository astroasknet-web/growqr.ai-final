/**
 * Zoho self-client token minter — widens the CRM credential beyond Leads.
 *
 * Phase 0 minted a refresh token scoped to `ZohoCRM.modules.leads.ALL` +
 * `ZohoCRM.settings.fields.READ`, which is all the form-sync pipeline needs.
 * Working on Contacts / Deals / Accounts needs a broader token, and refresh
 * tokens carry the scopes they were born with — there is no "add a scope
 * later" call, you mint a new one.
 *
 * Two-step, because a self-client has no redirect URI:
 *
 *   1. npm run zoho:token           → prints the scope string + instructions
 *   2. npm run zoho:token -- <code> → exchanges the grant code, prints env,
 *                                     and probes every module the scopes claim
 *
 * The grant code from the console expires in ~10 minutes; the refresh token it
 * returns is permanent until revoked. Nothing here writes to .env.local — copy
 * the printed block yourself so the rotation is deliberate.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

/**
 * Full CRM surface: records + metadata across every module, plus the read-only
 * org/user/query scopes the admin scripts use. `modules.ALL` covers Leads,
 * Contacts, Deals, Accounts and their attachments in one grant — per-module
 * scopes are only worth it when a credential should stay narrow (the runtime
 * sync one already is).
 */
const SCOPES = [
  "ZohoCRM.modules.ALL", // records: read/create/update/delete, all modules
  "ZohoCRM.settings.ALL", // fields, layouts, picklists, custom modules
  "ZohoCRM.users.ALL", // owner assignment
  "ZohoCRM.org.ALL", // org profile
  "ZohoCRM.coql.READ", // COQL queries
  "ZohoCRM.bulk.ALL", // bulk read/write jobs
  "ZohoCRM.notifications.ALL", // webhooks / change notifications
];

/** Modules probed after the exchange to prove the token actually works. */
const PROBE_MODULES = ["Leads", "Contacts", "Deals", "Accounts"];

const accountsBase = process.env.ZOHO_ACCOUNTS_BASE ?? "https://accounts.zoho.in";
const apiBase = process.env.ZOHO_API_BASE ?? "https://www.zohoapis.in";
const consoleUrl = accountsBase.replace("accounts.zoho", "api-console.zoho");

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function printInstructions(): void {
  console.log(`Zoho self-client — mint a full-CRM refresh token

1. Open ${consoleUrl} → your self-client app → "Generate Code" tab.
2. Paste this scope string:

${SCOPES.join(",")}

3. Time duration: 10 minutes. Scope description: anything. → CREATE.
4. Pick the portal/org (${apiBase.includes(".in") ? "the .in / India org" : apiBase}) and copy the code.
5. Within 10 minutes, run:

   npm run zoho:token -- <paste-the-code>

Optional extras — add to the list above only if you need them:
   ZohoSearch.securesearch.READ   global search API
   ZohoFiles.files.ALL            file-store uploads (attachments are already
                                  covered by ZohoCRM.modules.ALL)
`);
}

async function exchange(code: string): Promise<void> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    fail("ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET missing from .env.local");
  }

  const res = await fetch(`${accountsBase}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  // Zoho answers 200 with an `error` body for an expired or reused code.
  const body = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    error?: string;
  };

  if (body.error === "invalid_code") {
    fail("Grant code expired or already used — generate a fresh one (step 1-4).");
  }
  if (!body.refresh_token || !body.access_token) {
    fail(`Token exchange failed: ${body.error ?? JSON.stringify(body)}`);
  }

  console.log("✓ Refresh token minted. Put this in .env.local AND Vercel:\n");
  console.log(`ZOHO_CLIENT_ID=${clientId}`);
  console.log("ZOHO_CLIENT_SECRET=<unchanged>");
  console.log(`ZOHO_REFRESH_TOKEN=${body.refresh_token}`);
  console.log(`ZOHO_ACCOUNTS_BASE=${accountsBase}`);
  console.log(`ZOHO_API_BASE=${apiBase}\n`);
  console.log(`Granted scopes: ${body.scope ?? "(not reported)"}\n`);

  // Prove the scopes rather than trusting the string: one metadata read per
  // module we intend to write to.
  console.log("Probing module access:");
  let failures = 0;
  for (const module of PROBE_MODULES) {
    const probe = await fetch(`${apiBase}/crm/v8/settings/fields?module=${module}`, {
      headers: { Authorization: `Zoho-oauthtoken ${body.access_token}` },
    });
    const ok = probe.ok;
    console.log(`${ok ? "✓" : "✗"} ${module} — ${probe.status}`);
    if (!ok) failures += 1;
  }

  if (failures > 0) fail(`${failures} module(s) unreachable — re-check the scope string.`);
  console.log("\n✓ All probed modules reachable. Old refresh token stays valid until revoked.");
}

const code = process.argv[2];
if (!code) {
  printInstructions();
} else {
  exchange(code).catch((error) => fail(error instanceof Error ? error.message : String(error)));
}
