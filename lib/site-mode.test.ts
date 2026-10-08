import { describe, expect, it } from "vitest";
import { portalDecision } from "./site-mode";

const M = "https://growqr.ai";
const d = (p: string, s = "") => portalDecision(p, s, M);

describe("portal-only mode rules", () => {
  it("keeps the main site's home page at /", () => {
    expect(d("/")).toEqual({ action: "next" });
  });
  it("serves every portal page and endpoint", () => {
    for (const p of ["/login", "/signup", "/account/mfa", "/v/ABC123", "/passport/share", "/console/analytics", "/crm/leads/4", "/file/abcdef", "/resume-score", "/go", "/api/t", "/api/cron/portal", "/api/health", "/.well-known/did.json", "/_next/static/x.js", "/internships/some-role", "/study-abroad/usa", "/universities/mit", "/home-options", "/home-options/a"]) {
      expect(d(p).action, p).toBe("next");
    }
  });
  it("serves static files by extension", () => {
    expect(d("/growqr-logo.png").action).toBe("next");
    expect(d("/studio/studio.js").action).toBe("next");
  });
  it("sends marketing pages and the marketing admin to the main site, keeping the query", () => {
    expect(d("/events", "?x=1")).toEqual({ action: "redirect", to: "https://growqr.ai/events?x=1" });
    expect(d("/solutions/students")).toEqual({ action: "redirect", to: "https://growqr.ai/solutions/students" });
    expect(d("/admin/ambassador")).toEqual({ action: "redirect", to: "https://growqr.ai/admin/ambassador" });
  });
  it("does not treat look-alike prefixes as portal pages", () => {
    expect(d("/loginx").action).toBe("redirect");
    expect(d("/vision").action).toBe("redirect"); // marketing /vision must not match the portal /v
    expect(d("/coursesfoo").action).toBe("redirect");
  });
  it("tolerates a trailing slash on the main site address", () => {
    expect(portalDecision("/about", "", "https://growqr.ai/")).toEqual({ action: "redirect", to: "https://growqr.ai/about" });
  });
});
