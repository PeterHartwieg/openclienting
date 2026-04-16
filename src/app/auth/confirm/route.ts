// PKCE-flow landing for emailed auth links.
//
// When the Supabase email templates use
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={type}
// the confirmation URL points at our own domain instead of the project's
// *.supabase.co host. Gmail / SpamAssassin like this a lot (no domain
// mismatch; no long-consonant hostname), and the user never sees a
// redirect through a second domain.
//
// This route verifies the OTP with supabase.auth.verifyOtp(), which
// establishes a session cookie, then redirects based on the email
// template type. The older OAuth / code-exchange flow still lives in
// /auth/callback — that one stays as-is for Google sign-in.

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

const ALLOWED_TYPES = new Set<EmailOtpType>([
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
  "email",
]);

function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

function resolveLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  return (
    cookieLocale && (locales as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : defaultLocale
  );
}

// Pick where to land the user after a successful verifyOtp based on what
// kind of email they clicked from.
function defaultDestination(type: EmailOtpType, locale: Locale): string {
  switch (type) {
    case "recovery":
      return `/${locale}/auth/reset-password`;
    case "email_change":
    case "email":
      return `/${locale}/dashboard/account`;
    case "invite":
      return `/${locale}/dashboard/account`;
    case "signup":
    case "magiclink":
    default:
      return `/${locale}`;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type") as EmailOtpType | null;
  const nextParam = sanitizeNext(searchParams.get("next"));
  const locale = resolveLocale(request);

  if (!tokenHash || !rawType || !ALLOWED_TYPES.has(rawType)) {
    // Malformed link — send them home on their preferred locale rather
    // than bouncing them to a default-language 404.
    return NextResponse.redirect(`${origin}/${locale}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: rawType,
    token_hash: tokenHash,
  });

  if (error) {
    // Link expired, token already consumed, or malformed. Same safe
    // fallback as the OAuth callback: locale-aware homepage.
    return NextResponse.redirect(`${origin}/${locale}`);
  }

  const destination = nextParam ?? defaultDestination(rawType, locale);
  return NextResponse.redirect(`${origin}${destination}`);
}
