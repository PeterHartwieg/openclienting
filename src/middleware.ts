import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, API routes, and auth callback
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Let next-intl handle locale detection & redirects first.
  const intlResponse = intlMiddleware(request);

  // If next-intl issued a redirect or rewrite, return it as-is — Supabase
  // session refresh will run on the next request after the redirect lands.
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  // Otherwise, refresh the Supabase session, seeding the response with the
  // headers next-intl already set (rewrite headers, locale cookie, etc.).
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
