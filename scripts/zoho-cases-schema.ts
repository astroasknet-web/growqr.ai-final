/**
 * Read-only dump of the Zoho CRM Cases module schema — the ticketing surface
 * the current credential already reaches (Desk is 403/SCOPE_MISMATCH; Cases is
 * 200 under the held ZohoCRM.modules.ALL). Prints required fields, picklist
 * values, and lookups so an integration payload can be designed against the
 * live org rather than guesswork.
 *
 *   npm run zoho:cases
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const accountsBase = process.env.ZOHO_ACCOUNTS_BASE ?? "https://accounts.zoho.in";
const apiBase = process.env.ZOHO_API_BASE ?? "https://www.zohoapis.in";

interface ZohoField {
  api_name: string;
  field_label: string;
  data_type: string;
  system_mandatory: boolean;
  read_only: boolean;
  length?: number;
  pick_list_values?: Array<{ display_value: string; actual_value: string }>;
  lookup?: { module?: { api_name?: string } };
}

async function accessToken(): Promise<string> {
  const res = await fetch(`${accountsBase}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    }),
  });
  const body = (await res.json()) as { access_token?: string; error?: string };
  if (!body.access_token) throw new Error(`token refresh failed: ${body.error}`);
  return body.access_token;
}

async function main() {
  const token = await accessToken();
  const auth = { Authorization: `Zoho-oauthtoken ${token}` };

  const res = await fetch(`${apiBase}/crm/v8/settings/fields?module=Cases`, { headers: auth });
  const { fields } = (await res.json()) as { fields: ZohoField[] };

  const writable = fields.filter((f) => !f.read_only);

  console.log(`Cases module — ${fields.length} fields (${writable.length} writable)\n`);

  console.log("=== MANDATORY ===");
  for (const f of fields.filter((f) => f.system_mandatory)) {
    console.log(`  ${f.api_name} (${f.data_type})${f.lookup?.module?.api_name ? ` → ${f.lookup.module.api_name}` : ""}`);
  }

  console.log("\n=== LOOKUPS ===");
  for (const f of fields.filter((f) => f.data_type === "lookup")) {
    console.log(`  ${f.api_name} → ${f.lookup?.module?.api_name ?? "?"}${f.system_mandatory ? "  [REQUIRED]" : ""}`);
  }

  console.log("\n=== PICKLISTS ===");
  for (const f of fields.filter((f) => f.pick_list_values?.length)) {
    const vals = f.pick_list_values!.map((v) => v.display_value).filter((v) => v !== "-None-");
    console.log(`  ${f.api_name}: ${vals.join(" | ")}`);
  }

  console.log("\n=== OTHER WRITABLE ===");
  for (const f of writable.filter((f) => !f.pick_list_values?.length && f.data_type !== "lookup")) {
    console.log(`  ${f.api_name} (${f.data_type}${f.length ? `, max ${f.length}` : ""})`);
  }

  // Is anyone actually using it yet?
  const count = await fetch(`${apiBase}/crm/v8/Cases?fields=id&per_page=1`, { headers: auth });
  console.log(`\n=== EXISTING RECORDS ===\n  GET /Cases → ${count.status}${count.status === 204 ? " (empty module)" : ""}`);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
