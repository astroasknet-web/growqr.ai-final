import type { ZohoFieldMeta } from "@/lib/crm/zoho-client";

/**
 * Drift detection: derive.ts constants vs the live Zoho Leads module.
 *
 * Zoho matches picklists on display value, and a renamed picklist silently
 * keeps its legacy actual_value — so a UI rename breaks our writes without
 * any API error until a record is rejected or misfiled. This pure comparator
 * (wrapped by scripts/crm-drift-check.ts) makes that failure visible BEFORE
 * it corrupts data. Run it before any picklist edit in Zoho.
 */

export interface FieldExpectations {
  picklists: Record<string, readonly string[]>;
  requiredFields: readonly string[];
}

export interface DriftReport {
  ok: boolean;
  problems: string[];
  checkedFields: number;
  checkedValues: number;
}

export function compareFieldExpectations(
  expected: FieldExpectations,
  liveFields: ZohoFieldMeta[],
): DriftReport {
  const byApiName = new Map(liveFields.map((f) => [f.api_name, f]));
  const problems: string[] = [];
  let checkedFields = 0;
  let checkedValues = 0;

  for (const field of expected.requiredFields) {
    checkedFields += 1;
    if (!byApiName.has(field)) {
      problems.push(`field ${field} is missing from the live Leads module`);
    }
  }

  for (const [field, values] of Object.entries(expected.picklists)) {
    checkedFields += 1;
    const live = byApiName.get(field);
    if (!live) {
      problems.push(`picklist field ${field} is missing from the live Leads module`);
      continue;
    }
    const liveValues = new Set(
      (live.pick_list_values ?? []).map((v) => v.display_value).filter(Boolean),
    );
    if (liveValues.size === 0) {
      problems.push(`field ${field} has no picklist values live (data_type: ${live.data_type})`);
      continue;
    }
    for (const value of values) {
      checkedValues += 1;
      if (!liveValues.has(value)) {
        problems.push(`picklist ${field} is missing display value "${value}"`);
      }
    }
  }

  return { ok: problems.length === 0, problems, checkedFields, checkedValues };
}
