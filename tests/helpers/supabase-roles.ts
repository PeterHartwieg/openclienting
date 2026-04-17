/**
 * Test-only helper that mints Supabase-compatible JWTs and returns a
 * configured supabase-js client for each Postgres role.
 *
 * NEVER import this in application code.
 *
 * Requires:
 *   SUPABASE_JWT_SECRET  – the project JWT secret (from Supabase dashboard
 *                          → Settings → API → JWT Secret).
 *   NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY – normal app
 *   vars, also needed here to construct the client.
 *
 * Usage:
 *   import { roleClient } from "@/tests/helpers/supabase-roles";
 *   const client = roleClient("moderator");
 */

import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// Guard: only allow in test environments or when explicitly opted-in.
if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV !== "test" &&
  !process.env.ALLOW_ROLE_MINT
) {
  throw new Error(
    "supabase-roles helper: role-mint only allowed in test env. " +
      "Set NODE_ENV=test or ALLOW_ROLE_MINT=1 if you know what you are doing.",
  );
}

function getJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "SUPABASE_JWT_SECRET is not set. " +
        "Add it to .env.local (Settings → API → JWT Secret in the Supabase dashboard).",
    );
  }
  return secret;
}

export interface MintJwtOptions {
  sub: string;
  role: "anon" | "authenticated" | "moderator" | "admin";
  aud?: string;
  /** extra claims merged into the payload (e.g. app_metadata) */
  extra?: Record<string, unknown>;
}

/**
 * Mint a short-lived JWT signed with the project secret.
 * The `role` claim is what Postgres / RLS sees.
 */
export function mintJwt({ sub, role, aud = "authenticated", extra = {} }: MintJwtOptions): string {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub,
      aud,
      role,
      iss: "supabase",
      iat: now,
      exp: now + 3600, // 1 hour
      ...extra,
    },
    secret,
    { algorithm: "HS256" },
  );
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Stable fake UUIDs for test personas – deterministic so seeded data can
// reference them without querying auth.users.
export const TEST_UUIDS = {
  anon: "00000000-0000-0000-0000-000000000001",
  authenticated: "00000000-0000-0000-0000-000000000002",
  moderator: "00000000-0000-0000-0000-000000000003",
  admin: "00000000-0000-0000-0000-000000000004",
} as const;

/**
 * Return a Supabase client that will send requests as the given Postgres
 * role.  For `anon` the client uses the public anon key without a JWT.
 * For all other roles a signed JWT is minted and injected.
 */
export function roleClient(role: "anon" | "authenticated" | "moderator" | "admin") {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (role === "anon") {
    // Anon key already sets the anon role via Authorization header when no
    // session is present – nothing more needed.
    return client;
  }

  const sub = TEST_UUIDS[role];
  const token = mintJwt({ sub, role });

  // setSession is not an async call in this version of the SDK when called
  // without a refresh_token; it just updates the in-memory session.
  client.auth.setSession({ access_token: token, refresh_token: "" });
  return client;
}
