import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminUser } from "@/lib/auth/admin-allowlist";
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars aren't set (e.g. during build or misconfigured deploy),
  // don't crash the whole site — just let the request through.
  if (!url || !anon) {
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    // Authorization, not just authentication: the user's Supabase account
    // must be flagged as admin (app_metadata.is_admin, set via service role).
    const isAdmin = isAdminUser(user);

    const isLoginPage = request.nextUrl.pathname === "/admin/login";

    if (!isAdmin && !isLoginPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/login";
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdmin && isLoginPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/admin/ambassador";
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  } catch {
    // Never let a middleware crash propagate to the main site.
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
