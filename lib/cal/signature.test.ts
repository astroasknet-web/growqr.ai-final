import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { verifyCalSignature } from "@/lib/cal/signature";

const SECRET = "test-secret-value";
const BODY = '{"triggerEvent":"BOOKING_CREATED","createdAt":"2026-08-04T10:00:00.000Z"}';
const sign = (body: string, secret = SECRET) =>
  createHmac("sha256", secret).update(body, "utf8").digest("hex");

describe("verifyCalSignature", () => {
  it("accepts a correct hex HMAC-SHA256 of the raw body", () => {
    expect(verifyCalSignature(BODY, sign(BODY), SECRET)).toEqual({ ok: true });
  });

  it("fails closed when no secret is configured", () => {
    // The dangerous alternative is skipping the check when unset, which turns a
    // misconfigured deploy into an unauthenticated write endpoint.
    expect(verifyCalSignature(BODY, sign(BODY), undefined)).toEqual({
      ok: false,
      reason: "no_secret_configured",
    });
  });

  it("rejects a missing signature header", () => {
    expect(verifyCalSignature(BODY, null, SECRET)).toEqual({
      ok: false,
      reason: "no_signature_header",
    });
  });

  it("rejects a body tampered with after signing", () => {
    const signature = sign(BODY);
    const tampered = BODY.replace("BOOKING_CREATED", "BOOKING_CANCELLED");
    expect(verifyCalSignature(tampered, signature, SECRET).ok).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    expect(verifyCalSignature(BODY, sign(BODY, "other-secret"), SECRET).ok).toBe(false);
  });

  it("rejects a wrong-length signature without throwing", () => {
    // timingSafeEqual throws on length mismatch; the length pre-check is what
    // turns that into a clean rejection.
    expect(() => verifyCalSignature(BODY, "abc123", SECRET)).not.toThrow();
    expect(verifyCalSignature(BODY, "abc123", SECRET).ok).toBe(false);
  });

  it("is whitespace sensitive — re-serialised JSON must not verify", () => {
    // The single most common integration bug: parsing then re-stringifying the
    // body changes key order/whitespace and silently breaks every signature.
    const reserialised = JSON.stringify(JSON.parse(BODY), null, 2);
    expect(verifyCalSignature(reserialised, sign(BODY), SECRET).ok).toBe(false);
  });
});
