/**
 * CRM drift check — read-only comparison of derive.ts constants against the
 * live Zoho Leads module. Run BEFORE any picklist edit in Zoho, and any time
 * sync rows start failing with INVALID_DATA.
 *
 *   npm run crm:drift
 *
 * Exit 0 = no drift; exit 1 = drift found (details printed).
 */
import { loadEnvConfig } from "@next/env";
import { CRM_FIELD_EXPECTATIONS } from "../lib/crm/derive";
import { compareFieldExpectations } from "../lib/crm/drift";
import { getLeadFields } from "../lib/crm/zoho-client";

loadEnvConfig(process.cwd());

async function main() {
  console.log("CRM drift check — derive.ts constants vs live Zoho Leads fields\n");

  const liveFields = await getLeadFields();
  const report = compareFieldExpectations(CRM_FIELD_EXPECTATIONS, liveFields);

  console.log(
    `Checked ${report.checkedFields} fields and ${report.checkedValues} picklist values ` +
      `against ${liveFields.length} live fields.`,
  );

  if (report.ok) {
    console.log("\n✓ NO DRIFT — every constant matches the live org.");
    return;
  }

  console.error(`\n✗ DRIFT DETECTED (${report.problems.length} problem(s)):`);
  for (const problem of report.problems) console.error(`  - ${problem}`);
  console.error(
    "\nFix by aligning derive.ts with the Zoho org (or reverting the Zoho edit). " +
      "Until then, affected records will be rejected or misfiled.",
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(`\n✗ DRIFT CHECK FAILED TO RUN: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
