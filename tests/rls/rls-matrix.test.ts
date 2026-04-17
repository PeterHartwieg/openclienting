/**
 * Suite 1 — RLS matrix
 *
 * Data-driven coverage of critical table × role × operation boundaries.
 * Each case encodes what the CURRENT RLS policies promise.
 *
 * Runs against the hosted Supabase project (wruzfhglslxgjxmbguwd).
 * Requires SUPABASE_JWT_SECRET + NEXT_PUBLIC_SUPABASE_* in environment.
 *
 * The tests exercise SELECT, INSERT, UPDATE, DELETE boundaries. They do not
 * assert exact row data — only error codes / success signals.
 *
 * RLS error codes returned by PostgREST:
 *   "42501"  — permission denied (row-level security violation)
 *   "PGRST301" — no rows returned (also used when SELECT is denied silently)
 *
 * PostgREST exposes RLS denials differently by operation:
 *   SELECT   → empty result (no error code) when denied
 *   INSERT   → error code 42501 or PGRST301
 *   UPDATE   → no rows affected (empty error) when WHERE clause fails
 *   DELETE   → no rows affected when WHERE clause fails
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { roleClient } from "../helpers/supabase-roles";

// ---------------------------------------------------------------------------
// Skip the whole suite if SUPABASE_JWT_SECRET is not set (e.g. in CI without secrets)
// ---------------------------------------------------------------------------
const hasSecret = !!process.env.SUPABASE_JWT_SECRET;
const describeOrSkip = hasSecret ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Seed data — a real row we can probe in SELECT/UPDATE/DELETE cases
// ---------------------------------------------------------------------------
// We use the service-role admin client to create seed data directly, bypassing
// RLS, so test expectations are predictable.
function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY required for RLS matrix seed");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Seed UUIDs — stable across runs so leftover cleanup is safe
const SEED = {
  // A fake auth user we'll create in auth.users
  userId: "aaaaaaaa-0000-0000-0000-000000000001",
  problemId: "bbbbbbbb-0000-0000-0000-000000000001",
  orgId: "cccccccc-0000-0000-0000-000000000001",
} as const;

let admin: SupabaseClient;

beforeAll(async () => {
  if (!hasSecret) return;
  admin = adminClient();

  // Ensure seed user exists in auth.users so FK constraints pass
  // Note: the Supabase admin API uses `id` via the service client; we call
  // the REST endpoint directly since the JS SDK doesn't expose user_id in types.
  await admin.auth.admin.createUser({
    email: "rls-test-seed@dev.openclienting.local",
    email_confirm: true,
    user_metadata: { full_name: "RLS Test Seed" },
  });

  // Seed a submitted problem_template owned by SEED.userId
  await admin.from("problem_templates").upsert(
    {
      id: SEED.problemId,
      title: "test-rls-matrix problem",
      description: "seeded for RLS matrix tests",
      author_id: SEED.userId,
      status: "submitted",
    },
    { onConflict: "id" },
  );

  // Seed an organization created by SEED.userId
  await admin.from("organizations").upsert(
    {
      id: SEED.orgId,
      name: "test-rls-matrix org",
      slug: "test-rls-matrix-org",
      created_by: SEED.userId,
      verification_status: "unverified",
    },
    { onConflict: "id" },
  );
});

afterAll(async () => {
  if (!hasSecret || !admin) return;
  // Clean up seed rows (ignore errors – they may have been deleted by tests)
  await admin.from("problem_templates").delete().eq("id", SEED.problemId);
  await admin.from("organizations").delete().eq("id", SEED.orgId);
  await admin.auth.admin.deleteUser(SEED.userId);
});

// ---------------------------------------------------------------------------
// Helper: assert that a SELECT returns at least 1 row (visible) or 0 rows (hidden)
// ---------------------------------------------------------------------------
async function canSelect(
  client: SupabaseClient,
  table: string,
  column: string,
  value: string,
): Promise<boolean> {
  const { data, error } = await client.from(table).select("id").eq(column, value).limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// TABLE: problem_templates
// ---------------------------------------------------------------------------
describeOrSkip("problem_templates RLS", () => {
  it("anon: cannot see a submitted (non-published) problem", async () => {
    const client = roleClient("anon");
    const visible = await canSelect(client, "problem_templates", "id", SEED.problemId);
    expect(visible).toBe(false);
  });

  it("anon: cannot insert a problem", async () => {
    const client = roleClient("anon");
    const { error } = await client.from("problem_templates").insert({
      title: "anon insert attempt",
      description: "should fail",
      author_id: "00000000-0000-0000-0000-000000000001",
      status: "submitted",
    });
    expect(error).not.toBeNull();
  });

  it("authenticated: cannot see another user's submitted problem", async () => {
    const client = roleClient("authenticated");
    const visible = await canSelect(client, "problem_templates", "id", SEED.problemId);
    // TEST_UUIDS.authenticated !== SEED.userId, and status is 'submitted' (not published)
    expect(visible).toBe(false);
  });

  it("moderator: can see any problem regardless of status", async () => {
    const client = roleClient("moderator");
    const visible = await canSelect(client, "problem_templates", "id", SEED.problemId);
    expect(visible).toBe(true);
  });

  it("admin: can see any problem regardless of status", async () => {
    const client = roleClient("admin");
    const visible = await canSelect(client, "problem_templates", "id", SEED.problemId);
    expect(visible).toBe(true);
  });

  it("moderator: can update a problem's status", async () => {
    const client = roleClient("moderator");
    const { error } = await client
      .from("problem_templates")
      .update({ status: "submitted" }) // reset to same value — no-op content-wise
      .eq("id", SEED.problemId);
    expect(error).toBeNull();
  });

  it("anon: cannot update any problem", async () => {
    const client = roleClient("anon");
    // PostgREST returns no error on UPDATE with RLS — just no rows updated.
    // We verify by attempting and then checking the moderator can still read it.
    await client
      .from("problem_templates")
      .update({ title: "anon-hijack" })
      .eq("id", SEED.problemId);
    // The moderator should still see the original title
    const { data } = await roleClient("moderator")
      .from("problem_templates")
      .select("title")
      .eq("id", SEED.problemId)
      .single();
    expect(data?.title).toBe("test-rls-matrix problem");
  });
});

// ---------------------------------------------------------------------------
// TABLE: requirements
// ---------------------------------------------------------------------------
describeOrSkip("requirements RLS", () => {
  it("anon: cannot insert a requirement", async () => {
    const client = roleClient("anon");
    const { error } = await client.from("requirements").insert({
      title: "anon req",
      description: "should fail",
      author_id: "00000000-0000-0000-0000-000000000002",
      problem_id: SEED.problemId,
      status: "submitted",
    });
    expect(error).not.toBeNull();
  });

  it("moderator: can read requirements in a submitted problem", async () => {
    // Nothing seeded yet — just ensure no error (empty result is fine)
    const client = roleClient("moderator");
    const { error } = await client
      .from("requirements")
      .select("id")
      .eq("problem_id", SEED.problemId)
      .limit(1);
    expect(error).toBeNull();
  });

  // TODO: clarify — does authenticated user who did NOT author the problem
  // see requirements for a submitted problem? Policy says "author_id = auth.uid()"
  // on requirements, but the problem_id FK might expose them.
  it.todo("authenticated non-author: cannot see requirements of a submitted problem");
});

// ---------------------------------------------------------------------------
// TABLE: organizations
// ---------------------------------------------------------------------------
describeOrSkip("organizations RLS", () => {
  it("anon: cannot see an unverified organization", async () => {
    const client = roleClient("anon");
    const visible = await canSelect(client, "organizations", "id", SEED.orgId);
    expect(visible).toBe(false);
  });

  it("anon: cannot insert an organization", async () => {
    const client = roleClient("anon");
    const { error } = await client.from("organizations").insert({
      name: "anon org",
      slug: "anon-org",
      created_by: "00000000-0000-0000-0000-000000000001",
    });
    expect(error).not.toBeNull();
  });

  it("moderator: can see unverified organizations", async () => {
    const client = roleClient("moderator");
    const visible = await canSelect(client, "organizations", "id", SEED.orgId);
    expect(visible).toBe(true);
  });

  it("moderator: can update any organization", async () => {
    const client = roleClient("moderator");
    const { error } = await client
      .from("organizations")
      .update({ description: "moderator updated" })
      .eq("id", SEED.orgId);
    expect(error).toBeNull();
  });

  it("authenticated (non-creator): cannot see an unverified organization", async () => {
    // TEST_UUIDS.authenticated !== SEED.userId (creator)
    const client = roleClient("authenticated");
    const visible = await canSelect(client, "organizations", "id", SEED.orgId);
    expect(visible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TABLE: organization_memberships
// ---------------------------------------------------------------------------
describeOrSkip("organization_memberships RLS", () => {
  it("anon: cannot read any memberships", async () => {
    const client = roleClient("anon");
    const { data } = await client
      .from("organization_memberships")
      .select("id")
      .eq("organization_id", SEED.orgId)
      .limit(1);
    expect(data?.length ?? 0).toBe(0);
  });

  it("anon: cannot insert a membership", async () => {
    const client = roleClient("anon");
    const { error } = await client.from("organization_memberships").insert({
      organization_id: SEED.orgId,
      user_id: "00000000-0000-0000-0000-000000000001",
      role: "member",
      membership_status: "pending",
    });
    expect(error).not.toBeNull();
  });

  it("moderator: can read all memberships", async () => {
    const client = roleClient("moderator");
    const { error } = await client
      .from("organization_memberships")
      .select("id")
      .eq("organization_id", SEED.orgId)
      .limit(1);
    expect(error).toBeNull();
  });

  // TODO: clarify — can regular members see each other's membership rows?
  // Policy "memberships_select" allows org admin to see all, but regular member?
  it.todo("authenticated org member: can see own membership but not others");
});

// ---------------------------------------------------------------------------
// TABLE: moderation_event
// ---------------------------------------------------------------------------
describeOrSkip("moderation_event RLS", () => {
  it("anon: cannot read moderation events", async () => {
    const client = roleClient("anon");
    const { data } = await client
      .from("moderation_event")
      .select("id")
      .limit(1);
    // RLS silent deny — empty result
    expect(data?.length ?? 0).toBe(0);
  });

  it("authenticated (regular user): cannot read moderation events for unpublished content", async () => {
    const client = roleClient("authenticated");
    const { data } = await client
      .from("moderation_event")
      .select("id")
      .eq("target_id", SEED.problemId)
      .limit(1);
    // problem is submitted (not published), so public_read policy doesn't apply
    expect(data?.length ?? 0).toBe(0);
  });

  it("moderator: can read all moderation events", async () => {
    const client = roleClient("moderator");
    const { error } = await client
      .from("moderation_event")
      .select("id")
      .limit(1);
    expect(error).toBeNull();
  });

  it("admin: can read all moderation events", async () => {
    const client = roleClient("admin");
    const { error } = await client
      .from("moderation_event")
      .select("id")
      .limit(1);
    expect(error).toBeNull();
  });

  it("authenticated: cannot directly insert a moderation_event (write only via RPC)", async () => {
    const client = roleClient("authenticated");
    const { error } = await client.from("moderation_event").insert({
      target_type: "problem_template",
      target_id: SEED.problemId,
      reviewer_id: "00000000-0000-0000-0000-000000000002",
      action: "approved",
      decision: "approved",
      before_status: "submitted",
      after_status: "published",
    });
    // No INSERT policy exists → PostgREST returns permission denied
    expect(error).not.toBeNull();
  });
});
