// PRIVILEGED — service-role Supabase client. Only import from server-only
// code paths that have already verified the caller's session (server
// actions, Route Handlers). Never import from a client component or any
// module that could end up in a client bundle. The service role bypasses
// RLS; misusing it leaks every row in every table.
//
// Kept in its own file (not alongside client.ts / server.ts) so the name
// and location flag this as dangerous during review.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
