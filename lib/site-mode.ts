/**
 * Optional portal-only mode (SITE_MODE=portal-only), for a host that must serve ONLY the portal and send every other path to the main site.
 * Not used by default: with SITE_MODE unset or "portal" the whole site (home, community, blog, events, experts, solutions and the portal apps)
 * is served from this host, so every navigation link opens a page on the same host. Pure functions, unit-tested, safe for the edge middleware.
 */
export const PORTAL_PREFIXES = [
  "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/verify", "/v", "/account", "/passport", "/studio",
  "/internships", "/applications", "/employer", "/courses", "/exam-prep", "/learn", "/exam", "/study", "/my-courses", "/abroad", "/study-abroad", "/universities", "/counselor", "/console",
  "/crm", "/file", "/resume-score", "/home-options", "/go", "/privacy-policy", "/refund-policy",
  "/api/t", "/api/studio", "/api/internships", "/api/courses", "/api/colleges", "/api/crm", "/api/lms-webhook", "/api/cron/portal", "/api/health", "/api/razorpay",
  "/.well-known", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/crm-file.js", "/growqr-logo.png",
];

export function isPortalPath(pathname: string): boolean {
  return PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export type Decision = { action: "next" } | { action: "redirect"; to: string };

/** What to do with a request on a portal-only host. `marketing` is the main site, e.g. https://growqr.ai (no trailing slash). */
export function portalDecision(pathname: string, search: string, marketing: string): Decision {
  if (pathname === "/") return { action: "next" }; // the main site's home page
  if (isPortalPath(pathname) || /\.[a-z0-9]{2,5}$/i.test(pathname)) return { action: "next" }; // static files (logo, js) are served as they are
  return { action: "redirect", to: `${marketing.replace(/\/+$/, "")}${pathname}${search}` };
}
