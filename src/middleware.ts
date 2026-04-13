import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const defaultLocale = "en";
const locales = [defaultLocale];

function getLocaleFromPath(pathname: string): string | null {
  const segment = pathname.split("/")[1];
  return locales.includes(segment) ? segment : null;
}

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

  // Redirect bare paths to default locale
  const locale = getLocaleFromPath(pathname);
  if (!locale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Refresh Supabase auth session
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
