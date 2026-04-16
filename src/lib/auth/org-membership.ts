import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Guard for any contribution action that accepts a client-provided
 * `organizationId`. Returns ok when the organization id is null/unset
 * OR the user has an active membership in that organization.
 *
 * This is the application-layer counterpart to the `is_org_member` RLS
 * helper (migration 027). The action-layer check gives us clearer error
 * messages; the RLS `WITH CHECK` is the defence-in-depth backstop.
 *
 * Note: this intentionally does NOT require the org to be `verified`.
 * Attribution to unverified orgs is a legitimate use case — only the
 * spoofing attack (attributing to an org the user isn't in) is blocked.
 * `submitSuccessReport` still adds the extra verified-org requirement
 * because success reports specifically need verified organizations.
 */
export async function resolveVerifiedMembership(
  supabase: SupabaseClient,
  userId: string,
  orgId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!orgId) return { ok: true };

  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .eq("membership_status", "active")
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not verify organization membership" };
  }

  if (!data) {
    return {
      ok: false,
      error: "You must be an active member of the selected organization",
    };
  }

  return { ok: true };
}
