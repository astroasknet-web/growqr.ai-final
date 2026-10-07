/**
 * Read-only capability probe: what does the current Zoho credential actually
 * reach? Prints granted scopes + endpoint status codes. Never prints secrets.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const accountsBase = process.env.ZOHO_ACCOUNTS_BASE ?? "https://accounts.zoho.in";
const apiBase = process.env.ZOHO_API_BASE ?? "https://www.zohoapis.in";
const deskBase = "https://desk.zoho.in";

async function main() {
  const clientId = process.env.ZOHO_CLIENT_ID!;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET!;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN!;

  const res = await fetch(`${accountsBase}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  const body = (await res.json()) as {
    access_token?: string;
    scope?: string;
    error?: string;
  };

  if (!body.access_token) {
    console.error("✗ token refresh failed:", body.error ?? JSON.stringify(body));
    process.exit(1);
  }

  console.log("=== GRANTED SCOPES ===");
  for (const s of (body.scope ?? "(none reported)").split(/[ ,]+/).filter(Boolean)) {
    console.log("  " + s);
  }

  const auth = { Authorization: `Zoho-oauthtoken ${body.access_token}` };

  const probes: Array<[string, string]> = [
    ["CRM  Leads fields", `${apiBase}/crm/v8/settings/fields?module=Leads`],
    ["CRM  Contacts fields", `${apiBase}/crm/v8/settings/fields?module=Contacts`],
    ["CRM  Cases fields", `${apiBase}/crm/v8/settings/fields?module=Cases`],
    ["CRM  Solutions fields", `${apiBase}/crm/v8/settings/fields?module=Solutions`],
    ["CRM  modules list", `${apiBase}/crm/v8/settings/modules`],
    ["CRM  users", `${apiBase}/crm/v8/users?type=ActiveUsers`],
    ["DESK organizations", `${deskBase}/api/v1/organizations`],
    ["DESK departments", `${deskBase}/api/v1/departments`],
    ["DESK tickets", `${deskBase}/api/v1/tickets?limit=1`],
    ["DESK agents", `${deskBase}/api/v1/agents?limit=1`],
  ];

  console.log("\n=== ENDPOINT PROBES ===");
  for (const [label, url] of probes) {
    try {
      const r = await fetch(url, { headers: auth });
      const text = await r.text();
      let note = "";
      if (!r.ok) {
        note = " " + text.slice(0, 160).replace(/\s+/g, " ");
      } else if (label.startsWith("DESK")) {
        note = " " + text.slice(0, 400).replace(/\s+/g, " ");
      } else if (label === "CRM  modules list") {
        try {
          const j = JSON.parse(text) as { modules?: Array<{ api_name: string; generated_type: string }> };
          const names = (j.modules ?? []).map((m) => m.api_name);
          note = ` (${names.length} modules) Cases=${names.includes("Cases")} Solutions=${names.includes("Solutions")}`;
        } catch { /* ignore */ }
      }
      console.log(`${r.ok ? "✓" : "✗"} ${label} — ${r.status}${note}`);
    } catch (e) {
      console.log(`✗ ${label} — network error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

main();
