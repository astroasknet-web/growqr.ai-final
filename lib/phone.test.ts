import { describe, it, expect } from "vitest";
import { normalizePhone, isValidIndianMobile, phoneError, sanitizePhoneInput } from "./phone";

describe("normalizePhone", () => {
  it("strips formatting", () => {
    expect(normalizePhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizePhone("(987) 654-3210")).toBe("9876543210");
  });

  it("strips the 91 country code and the 0 trunk prefix", () => {
    expect(normalizePhone("919876543210")).toBe("9876543210");
    expect(normalizePhone("09876543210")).toBe("9876543210");
  });

  it("leaves a bare 10-digit number alone", () => {
    expect(normalizePhone("9876543210")).toBe("9876543210");
  });
});

describe("isValidIndianMobile", () => {
  it("accepts 6-9 leading 10-digit numbers in any format", () => {
    for (const n of ["9876543210", "+91 98765 43210", "8123456789", "7000000000", "6000000000"]) {
      expect(isValidIndianMobile(n)).toBe(true);
    }
  });

  it("rejects what the old length >= 10 check let through", () => {
    expect(isValidIndianMobile("0000000000")).toBe(false); // all zeroes
    expect(isValidIndianMobile("1234567890")).toBe(false); // starts below 6
    expect(isValidIndianMobile("98765432109999")).toBe(false); // too long
    expect(isValidIndianMobile("5551234567")).toBe(false); // landline-ish
  });

  it("rejects short and empty input", () => {
    expect(isValidIndianMobile("")).toBe(false);
    expect(isValidIndianMobile("98765")).toBe(false);
  });
});

describe("phoneError", () => {
  it("returns null for a valid number", () => {
    expect(phoneError("+91 98765 43210")).toBeNull();
  });

  it("names the field when empty", () => {
    expect(phoneError("", "WhatsApp number")).toBe("WhatsApp number is required");
  });

  it("distinguishes too-short, too-long and bad-prefix", () => {
    expect(phoneError("98765")).toBe("Enter a 10-digit mobile number");
    expect(phoneError("98765432101234")).toBe("That looks too long for a mobile number");
    expect(phoneError("1234567890")).toBe("Indian mobile numbers start with 6, 7, 8 or 9");
  });
});

describe("sanitizePhoneInput", () => {
  it("drops letters but keeps typed formatting", () => {
    expect(sanitizePhoneInput("+91 (987) 654-3210")).toBe("+91 (987) 654-3210");
    expect(sanitizePhoneInput("98abc76543210")).toBe("9876543210");
  });

  it("caps length at the column limit", () => {
    expect(sanitizePhoneInput("9".repeat(40))).toHaveLength(25);
  });
});
