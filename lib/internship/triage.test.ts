import { describe, it, expect } from "vitest";
import { triageFor, isTriageBand, RQ_SHORTLIST_THRESHOLD, TRIAGE_CONFIG } from "./triage";

describe("triageFor", () => {
  it("shortlists exactly at the threshold", () => {
    // The bar is "50 and up", so 50 itself must pass. An off-by-one here
    // silently parks every borderline candidate.
    expect(triageFor(RQ_SHORTLIST_THRESHOLD)).toBe("auto_shortlist");
  });

  it("holds one point below the threshold", () => {
    expect(triageFor(RQ_SHORTLIST_THRESHOLD - 1)).toBe("on_hold");
  });

  it("shortlists a high score", () => {
    expect(triageFor(88)).toBe("auto_shortlist");
  });

  it("holds a zero score rather than treating it as missing", () => {
    // 0 is falsy. A truthiness check here would band a real zero as
    // "unscored", telling HR we have no data when we have a bad score.
    expect(triageFor(0)).toBe("on_hold");
  });

  it("returns unscored when GrowQR gave us nothing", () => {
    expect(triageFor(null)).toBe("unscored");
    expect(triageFor(undefined)).toBe("unscored");
  });

  it("returns unscored for a non-finite value", () => {
    expect(triageFor(NaN)).toBe("unscored");
  });
});

describe("isTriageBand", () => {
  it("accepts the three bands", () => {
    expect(isTriageBand("auto_shortlist")).toBe(true);
    expect(isTriageBand("on_hold")).toBe(true);
    expect(isTriageBand("unscored")).toBe(true);
  });

  it("rejects anything else, including a status value", () => {
    expect(isTriageBand("shortlisted")).toBe(false);
    expect(isTriageBand("")).toBe(false);
  });
});

describe("TRIAGE_CONFIG", () => {
  it("never describes the on-hold band as a rejection", () => {
    // This band exists precisely because "below the bar" is not "rejected".
    // If the copy ever drifts into rejection language, HR will treat it as one.
    expect(TRIAGE_CONFIG.on_hold.label.toLowerCase()).not.toContain("reject");
    expect(TRIAGE_CONFIG.on_hold.hint).toMatch(/not rejected/i);
  });
});
