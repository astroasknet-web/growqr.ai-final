import { describe, expect, it } from "vitest";
import { compareFieldExpectations } from "@/lib/crm/drift";
import { CRM_FIELD_EXPECTATIONS } from "@/lib/crm/derive";
import type { ZohoFieldMeta } from "@/lib/crm/zoho-client";

const picklist = (api_name: string, values: string[]): ZohoFieldMeta => ({
  api_name,
  data_type: "picklist",
  pick_list_values: values.map((display_value) => ({ display_value })),
});

const text = (api_name: string): ZohoFieldMeta => ({ api_name, data_type: "text" });

/** A live-org fixture that satisfies every expectation. */
function healthyOrg(): ZohoFieldMeta[] {
  return [
    ...CRM_FIELD_EXPECTATIONS.requiredFields.map(text),
    ...Object.entries(CRM_FIELD_EXPECTATIONS.picklists).map(([field, values]) =>
      picklist(field, [...values, "-None-", "Some Extra Value"]),
    ),
  ];
}

describe("compareFieldExpectations", () => {
  it("passes against a live org containing every expected field and value", () => {
    const report = compareFieldExpectations(CRM_FIELD_EXPECTATIONS, healthyOrg());
    expect(report.ok).toBe(true);
    expect(report.problems).toEqual([]);
    expect(report.checkedValues).toBeGreaterThan(50); // country map + picklists
  });

  it("extra live values are fine — we only require what we emit", () => {
    const report = compareFieldExpectations(
      { picklists: { Segment: ["B2B"] }, requiredFields: [] },
      [picklist("Segment", ["B2B", "B2C", "Enterprise"])],
    );
    expect(report.ok).toBe(true);
  });

  it("test-the-tester: a deliberately wrong constant MUST fail", () => {
    // Simulates a typo'd/renamed display value in derive.ts (or a Zoho-side
    // rename): "Payd Ads" does not exist live.
    const report = compareFieldExpectations(
      { picklists: { Lead_Source: ["Website", "Payd Ads"] }, requiredFields: [] },
      [picklist("Lead_Source", ["Website", "Paid Ads"])],
    );
    expect(report.ok).toBe(false);
    expect(report.problems).toEqual(['picklist Lead_Source is missing display value "Payd Ads"']);
  });

  it("flags a missing field and a field that lost its picklist", () => {
    const report = compareFieldExpectations(
      { picklists: { Region: ["India"] }, requiredFields: ["UTM_Source"] },
      [{ api_name: "Region", data_type: "text" }],
    );
    expect(report.ok).toBe(false);
    expect(report.problems).toContain("field UTM_Source is missing from the live Leads module");
    expect(report.problems).toContain("field Region has no picklist values live (data_type: text)");
  });
});
