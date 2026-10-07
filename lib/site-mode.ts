/**
 * Portal-only mode (SITE_MODE=portal), used when this codebase is deployed on its own subdomain (for example qrscore.mathstudy.in).
 * The marketing site (home page, events, experts, solutions, blog, ...) stays on growqr.ai, so on the portal host those paths send the
 * visitor there instead of serving a second copy. Pure functions, so they are unit-tested and safe to run in the edge middleware.
 */
export const PORTAL_PREFIXES = [
  "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/verify", "/v", "/account", "/passport", "/studio",
  "/internships", "/applications", "/employer", "/courses", "/my-courses", "/abroad", "/study-abroad", "/universities", "/counselor", "/console",
  "/crm", "/file", "/resume-score", "/qrs-home", "/go", "/privacy-policy", "/refund-policy",
  "/api/t", "/api/studio", "/api/internships", "/api/courses", "/api/colleges", "/api/crm", "/api/lms-webhook", "/api/cron/portal", "/api/health", "/api/razorpay",
  "/.well-known", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/crm-file.js", "/growqr-logo.png",
];

export function isPortalPath(pathname: string): boolean {
  return PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export type Decision = { action: "next" } | { action: "redirect"; to: string } | { action: "rewrite"; to: string };

/** What to do with a request on a portal-only host. `marketing` is the main site, e.g. https://growqr.ai (no trailing slash). */
export function portalDecision(pathname: string, search: string, marketing: string): Decision {
  if (pathname === "/") return { action: "rewrite", to: "/qrs-home" }; // the portal home page, shown at /
  if (isPortalPath(pathname) || /\.[a-z0-9]{2,5}$/i.test(pathname)) return { action: "next" }; // static files (logo, js) are served as they are
  return { action: "redirect", to: `${marketing.replace(/\/+$/, "")}${pathname}${search}` };
}
