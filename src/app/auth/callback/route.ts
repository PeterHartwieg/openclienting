import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

// Sanitize the `next` parameter so we only ever redirect to a same-origin
// path. Anything that doesn't start with a single "/" (or that begins with
// "//" / "/\" which would be a protocol-relative URL) is rejected.
function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

function localeHomepage(locale: string): string {
  return `/${locale}`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  // Determine the post-auth destination, in priority order:
  // 1. Password-recovery flow → force redirect to the reset page
  // 2. ?next=… passed by the LoginDialog (locale-prefixed source path)
  // 3. NEXT_LOCALE cookie set by next-intl middleware
  // 4. defaultLocale homepage
  const nextParam = sanitizeNext(searchParams.get("next"));
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const fallbackLocale = (
    cookieLocale && (locales as readonly string[]).includes(cookieLocale)
      ? cookieLocale
      : defaultLocale
  ) as Locale;
  const recoveryDestination = `/${fallbackLocale}/auth/reset-password`;
  const destination =
    type === "recovery"
      ? recoveryDestination
      : nextParam ?? localeHomepage(fallbackLocale);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Auth error — bounce back to the same locale's homepage so we don't
  // strand a German visitor on the English landing page.
  return NextResponse.redirect(`${origin}${localeHomepage(fallbackLocale)}`);
}
