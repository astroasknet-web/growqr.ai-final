import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, SESSION_COOKIE } from "@/lib/auth/admin-allowlist";
import { portalDecision } from "@/lib/site-mode";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const portalOnly = process.env.SITE_MODE === "portal-only";
  const noindex = process.env.SITE_NOINDEX === "1";
  // Optional portal-only host: marketing pages are not served here, so send visitors to the main site.
  if (portalOnly) {
    const d = portalDecision(pathname, search, process.env.MARKETING_URL || "https://growqr.ai");
    if (d.action === "redirect") return NextResponse.redirect(d.to.startsWith("/") ? new URL(d.to, request.url) : d.to, 307);
  }
  // Pages other than the marketing admin need nothing here beyond the optional "do not index" header used while the site is being tested.
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    const res = NextResponse.next();
    if (noindex) res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  // The admin area signs in with the portal's staff login. The edge cannot reach the database, so it only turns away requests that
  // carry no session at all; the admin layout and every admin API route check that the account really is an admin.
  const isLoginPage = pathname === "/admin/login";
  if (!isLoginPage && !hasSessionCookie(request.cookies.get(SESSION_COOKIE)?.value)) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
