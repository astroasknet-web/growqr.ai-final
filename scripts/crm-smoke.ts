/**
 * CRM smoke test — the ONLY Phase 4 artifact that touches live Zoho.
 *
 * Creates ONE clearly-marked test Lead through the real payload builder and
 * client, upserts it TWICE to prove idempotency (insert → update, same id),
 * reads the record back and diffs every derived field. Deliberately bypasses
 * the CRM_SYNC_ENABLED kill switch by calling the client directly — the
 * production sync pipeline stays dark.
 *
 *   npm run crm:smoke
 *
 * Afterwards, delete the Lead in the Zoho UI (search "ZZZ Smoke").
 */
import { loadEnvConfig } from "@next/env";
import type { Tables } from "../types/database";
import { buildB2bLeadPayload, type ZohoLeadRecord } from "../lib/crm/payload";
import { getLead, upsertLead } from "../lib/crm/zoho-client";

loadEnvConfig(process.cwd());

const SMOKE_EMAIL = "crm-smoke-test@growqr.ai";

/** A realistic b2b_leads row exercising every derivation path. */
const smokeRow: Tables<"b2b_leads"> = {
  id: 0,
  name: "ZZZ Smoke Test",
  email: SMOKE_EMAIL,
  company: "ZZZ CRM Smoke Test (delete me)",
  team_size: "51–200",
  message: "Automated smoke test record — safe to delete.",
  agent: null,
  solution: "GrowQR Enterprise",
  page_path: "/enterprise",
  created_at: new Date().toISOString(),
  country_code: "IN",
  utm_source: "crm-smoke",
  utm_medium: "cpc",
  utm_campaign: "smoke-campaign",
  utm_term: null,
  utm_content: null,
  gclid: null,
  landing_page: "/enterprise?utm_source=crm-smoke&utm_medium=cpc",
  referrer: "https://www.google.com/",
  zoho_lead_id: null,
  crm_sync_status: "pending",
  crm_synced_at: null,
  crm_sync_error: null,
  crm_sync_attempts: 0,
};

function fail(message: string): never {
  console.error(`\n✗ SMOKE FAILED: ${message}`);
  process.exit(1);
}

async function main() {
  console.log("CRM smoke test — live Zoho org, one marked test Lead\n");

  const payload = buildB2bLeadPayload(smokeRow);
  if (!payload) fail("payload builder returned null for the smoke row");
  console.log("Payload:", JSON.stringify(payload, null, 2), "\n");

  // 1. First upsert — creates the Lead (or updates a leftover from a
  //    previous run that was not deleted; reported either way).
  const first = await upsertLead({ ...payload });
  console.log(`Upsert #1 → action=${first.action} id=${first.id}`);
  if (first.action === "update") {
    console.log("  (a Lead with this email already existed — previous run not deleted?)");
  }

  // 2. Second upsert — MUST update the same record, never create a second.
  const second = await upsertLead({ ...payload });
  console.log(`Upsert #2 → action=${second.action} id=${second.id}`);
  if (second.action !== "update") fail("second upsert did not report action=update");
  if (second.id !== first.id) fail(`second upsert hit a different record (${second.id})`);
  console.log("✓ Upsert-on-Email idempotency proven (one record, insert → update)\n");

  // 3. Read back and diff every field we sent.
  const fields = Object.keys(payload) as Array<keyof ZohoLeadRecord>;
  const stored = await getLead(first.id, fields);

  let mismatches = 0;
  for (const field of fields) {
    const sent = payload[field];
    const got = stored[field];
    // Zoho returns picklists/text verbatim; numbers stay numbers.
    const ok = String(got) === String(sent);
    console.log(`${ok ? "✓" : "✗"} ${field}: sent=${JSON.stringify(sent)} stored=${JSON.stringify(got)}`);
    if (!ok) mismatches += 1;
  }

  if (mismatches > 0) fail(`${mismatches} field(s) did not round-trip`);

  console.log(
    `\n✓ SMOKE PASSED — all ${fields.length} fields round-tripped.` +
      `\n→ Now delete the test Lead in the Zoho UI: search "ZZZ Smoke" (id ${first.id}).`,
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
