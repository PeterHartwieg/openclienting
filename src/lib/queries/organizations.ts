import { createClient } from "@/lib/supabase/server";

export async function getUserOrganizations(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      role,
      membership_status,
      organizations (
        id,
        name,
        slug,
        website,
        description,
        logo_url,
        employee_count,
        verification_status,
        created_by
      )
    `)
    .eq("user_id", userId)
    .in("membership_status", ["pending", "active"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOrganizationWithMembers(organizationId: string) {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (orgError) throw orgError;

  const { data: members, error: memError } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      user_id,
      role,
      membership_status,
      created_at,
      profiles (display_name)
    `)
    .eq("organization_id", organizationId)
    .in("membership_status", ["pending", "active"])
    .order("created_at", { ascending: true });

  if (memError) throw memError;

  return { org, members: members ?? [] };
}

export async function getPendingVerifications() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      website,
      description,
      verification_status,
      created_at,
      profiles (display_name, email)
    `)
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPendingVerifications error:", error);
    return [];
  }
  return data ?? [];
}

export async function getPendingMemberships() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      user_id,
      role,
      membership_status,
      created_at,
      profiles (display_name),
      organizations (id, name, slug)
    `)
    .eq("membership_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPendingMemberships error:", error);
    return [];
  }
  return data ?? [];
}

export async function getVerifiedOrganizations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, website, description")
    .eq("verification_status", "verified")
    .order("name", { ascending: true });

  if (error) {
    console.error("getVerifiedOrganizations error:", error);
    return [];
  }
  return data ?? [];
}

// Returns orgs where the current user has active membership AND the org is verified.
// Used to gate success report submission.
export async function getUserVerifiedMemberships(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      role,
      organizations!inner (
        id,
        name
      )
    `)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .eq("organizations.verification_status", "verified");

  if (error) {
    console.error("getUserVerifiedMemberships error:", error);
    return [];
  }

  return (data ?? []).map((m) => {
    const org = m.organizations as unknown as { id: string; name: string };
    return { membershipId: m.id, role: m.role, orgId: org.id, orgName: org.name };
  });
}
