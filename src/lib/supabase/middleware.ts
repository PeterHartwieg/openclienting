import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refresh the Supabase auth session and copy any auth Set-Cookie headers onto
 * the seed response object. The seed lets the caller (e.g. next-intl middleware)
 * own response headers/rewrites; we just attach cookies to it.
 *
 * If `seedResponse` is omitted, behaves like the previous version.
 */
export async function updateSession(
  request: NextRequest,
  seedResponse?: NextResponse,
) {
  let supabaseResponse = seedResponse ?? NextResponse.next({ request });

  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Re-create the response so request cookies take effect, but preserve
          // any headers already set on the seed response (e.g. next-intl rewrites).
          const previousHeaders = supabaseResponse.headers;
          supabaseResponse = NextResponse.next({ request });
          previousHeaders.forEach((value, key) => {
            // Skip headers Next will manage on its own.
            if (key === "content-length" || key === "content-type") return;
            supabaseResponse.headers.set(key, value);
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return supabaseResponse;
}
