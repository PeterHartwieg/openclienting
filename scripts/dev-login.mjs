/**
 * Dev-only sign-in helper for local moderator/admin testing.
 *
 * Idempotently creates a test moderator user in the linked Supabase project,
 * promotes their profile to role=moderator, and generates a magic-link URL
 * pointing at the LOCAL dev server's /auth/confirm route. Pasting that URL
 * into the dev preview signs you in as the moderator.
 *
 * Usage:
 *   node scripts/dev-login.mjs                        # default moderator user
 *   node scripts/dev-login.mjs --role=admin           # promote to admin
 *   node scripts/dev-login.mjs --port=3100            # custom dev port
 *   node scripts/dev-login.mjs --next=/en/dashboard   # post-login destination
 *   node scripts/dev-login.mjs --email=foo@dev.local  # custom email
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Does NOT add any
 * dev-only routes to the app — Supabase's normal /auth/confirm flow does
 * the cookie work, so there is no production attack surface to worry about.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Load .env.local for SUPABASE_* vars if not already in the environment.
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Argv parsing — minimal, no dependency
// ---------------------------------------------------------------------------
function arg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.split("=").slice(1).join("=") : fallback;
}

const role = arg("role", "moderator");
if (!["contributor", "moderator", "admin"].includes(role)) {
  console.error(`Invalid --role=${role}. Use contributor | moderator | admin.`);
  process.exit(1);
}

const port = arg("port", "3100");
const next = arg("next", "/en/moderate");
const email = arg("email", `${role}@dev.openclienting.local`);
const displayName = arg("name", `Dev ${role[0].toUpperCase() + role.slice(1)}`);

// ---------------------------------------------------------------------------
// Admin client — service role bypasses RLS so we can read/write profiles
// directly without going through user-facing auth.
// ---------------------------------------------------------------------------
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  // listUsers paginates — for a dev project the first page is enough, but
  // walk a few pages defensively in case there are many test accounts.
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === targetEmail);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser() {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: displayName },
  });
  if (error) throw error;
  return data.user;
}

async function ensureProfileRole(userId) {
  // The handle_new_user trigger inserts a profile with role=contributor on
  // user creation; promote to the requested role. Idempotent.
  const { error } = await admin
    .from("profiles")
    .update({ role, display_name: displayName })
    .eq("id", userId);
  if (error) throw error;
}

async function generateLink() {
  const redirectTo = `http://localhost:${port}/auth/confirm?next=${encodeURIComponent(next)}`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  if (error) throw error;

  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) throw new Error("generateLink returned no hashed_token");

  // Build a URL that points directly at OUR /auth/confirm route, skipping
  // the supabase.co hosted /auth/v1/verify hop. Our route calls verifyOtp,
  // which sets the SSR auth cookies the same way a real magic-link click
  // would.
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "magiclink",
    next,
  });
  return `http://localhost:${port}/auth/confirm?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const user = await ensureUser();
await ensureProfileRole(user.id);
const url = await generateLink();

console.log(`User:    ${email} (${user.id})`);
console.log(`Role:    ${role}`);
console.log(`Land on: ${next}`);
console.log("");
console.log("Open this URL in your dev browser to sign in:");
console.log(url);
