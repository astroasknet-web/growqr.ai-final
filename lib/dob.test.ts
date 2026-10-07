import { describe, it, expect } from "vitest";
import { dobError, ageOn, maxDobFor, MIN_APPLICANT_AGE } from "./dob";

const TODAY = new Date("2026-08-24T00:00:00");

describe("ageOn", () => {
  it("counts whole years, not elapsed days", () => {
    expect(ageOn(new Date("2000-08-24T00:00:00"), TODAY)).toBe(26);
  });

  it("does not credit a birthday that has not happened yet this year", () => {
    expect(ageOn(new Date("2000-08-25T00:00:00"), TODAY)).toBe(25);
  });
});

describe("dobError", () => {
  it("accepts a normal student date of birth", () => {
    expect(dobError("2004-06-15", TODAY)).toBeNull();
  });

  it("requires a value", () => {
    expect(dobError("", TODAY)).toBe("Date of birth is required");
  });

  it("rejects a future date", () => {
    expect(dobError("2027-01-01", TODAY)).toBe("Date of birth cannot be in the future");
  });

  it("rejects applicants under the age floor", () => {
    expect(dobError("2015-01-01", TODAY)).toBe(`You must be at least ${MIN_APPLICANT_AGE}`);
  });

  it("rejects a typo'd century and malformed input", () => {
    expect(dobError("1899-01-01", TODAY)).toBe("Enter a valid date");
    expect(dobError("15/06/2004", TODAY)).toBe("Enter a valid date");
    expect(dobError("2004-02-30", TODAY)).toBe("Enter a valid date");
  });

  it("accepts someone who turns the minimum age today", () => {
    expect(dobError("2011-08-24", TODAY)).toBeNull();
  });
});

describe("maxDobFor", () => {
  it("is exactly the age floor before today", () => {
    expect(maxDobFor(TODAY)).toBe("2011-08-24");
  });
});
