"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(params: {
  name: string;
  website?: string;
  description?: string;
  employeeCount?: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const name = params.name.trim();
  if (!name) return { success: false as const, error: "Organization name is required" };

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      website: params.website?.trim() || null,
      description: params.description?.trim() || null,
      employee_count: params.employeeCount ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false as const, error: "An organization with this name already exists" };
    }
    return { success: false as const, error: error.message };
  }

  // Auto-create membership as admin
  const { error: memberError } = await supabase
    .from("organization_memberships")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "admin",
      membership_status: "active",
    });

  if (memberError) return { success: false as const, error: memberError.message };

  return { success: true as const, organizationId: org.id };
}

export async function requestOrganizationVerification(organizationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  // Check user is the creator and org is unverified
  const { data: org } = await supabase
    .from("organizations")
    .select("id, verification_status, created_by")
    .eq("id", organizationId)
    .single();

  if (!org) return { success: false as const, error: "Organization not found" };
  if (org.created_by !== user.id) {
    return { success: false as const, error: "Only the organization creator can request verification" };
  }
  if (org.verification_status !== "unverified") {
    return { success: false as const, error: "Organization verification already requested or completed" };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ verification_status: "pending" })
    .eq("id", organizationId);

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

export async function requestMembership(organizationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  // Check org exists and is verified
  const { data: org } = await supabase
    .from("organizations")
    .select("id, verification_status")
    .eq("id", organizationId)
    .single();

  if (!org) return { success: false as const, error: "Organization not found" };
  if (org.verification_status !== "verified") {
    return { success: false as const, error: "Can only join verified organizations" };
  }

  // Check not already a member
  const { data: existing } = await supabase
    .from("organization_memberships")
    .select("id, membership_status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (existing && existing.membership_status !== "rejected" && existing.membership_status !== "revoked") {
    return { success: false as const, error: "You already have a pending or active membership" };
  }

  if (existing) {
    // Re-request after rejection/revocation
    const { error } = await supabase
      .from("organization_memberships")
      .update({ membership_status: "pending" })
      .eq("id", existing.id);
    if (error) return { success: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from("organization_memberships")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        role: "member",
        membership_status: "pending",
      });
    if (error) return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function updateOrganization(params: {
  organizationId: string;
  name?: string;
  website?: string;
  description?: string;
  employeeCount?: number | null;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  // Check user is org admin
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("role, membership_status")
    .eq("organization_id", params.organizationId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin" || membership.membership_status !== "active") {
    return { success: false as const, error: "Only organization admins can edit" };
  }

  const updateData: Record<string, unknown> = {};
  if (params.name !== undefined) updateData.name = params.name.trim();
  if (params.website !== undefined) updateData.website = params.website.trim() || null;
  if (params.description !== undefined) updateData.description = params.description.trim() || null;
  if (params.employeeCount !== undefined) updateData.employee_count = params.employeeCount;

  if (Object.keys(updateData).length === 0) {
    return { success: false as const, error: "Nothing to update" };
  }

  const { error } = await supabase
    .from("organizations")
    .update(updateData)
    .eq("id", params.organizationId);

  if (error) return { success: false as const, error: error.message };

  // The public problems list embeds `organizations.name` via a join. Bust the
  // cache if the visible name changed; other fields aren't in the list query.
  if (params.name !== undefined) {
    updateTag("problem_templates");
  }
  return { success: true as const };
}

export async function uploadOrgLogo(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const organizationId = formData.get("organizationId") as string;
  const file = formData.get("file") as File;

  if (!organizationId || !file) {
    return { success: false as const, error: "Organization ID and file are required" };
  }

  // Server-side validation: 512 KB max, images only
  if (file.size > 512 * 1024) {
    return { success: false as const, error: "Logo must be under 512 KB" };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "File must be an image" };
  }

  // Check user is org admin
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("role, membership_status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin" || membership.membership_status !== "active") {
    return { success: false as const, error: "Only organization admins can upload logos" };
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${organizationId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { success: false as const, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("org-logos")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("organizations")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", organizationId);

  if (updateError) return { success: false as const, error: updateError.message };
  return { success: true as const, logoUrl: urlData.publicUrl };
}

export async function leaveOrganization(organizationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  const { error } = await supabase
    .from("organization_memberships")
    .update({ membership_status: "revoked" })
    .eq("organization_id", organizationId)
    .eq("user_id", user.id);

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

// Org admins approve or reject pending membership requests for their own org.
export async function reviewMembership(params: {
  membershipId: string;
  decision: "approved" | "rejected";
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Sign in required" };

  // Resolve the org this membership belongs to
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("id", params.membershipId)
    .single();

  if (!membership) return { success: false as const, error: "Membership not found" };

  // Caller must be an active admin of that org
  const { data: callerMembership } = await supabase
    .from("organization_memberships")
    .select("role, membership_status")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", user.id)
    .single();

  if (!callerMembership || callerMembership.role !== "admin" || callerMembership.membership_status !== "active") {
    return { success: false as const, error: "Only org admins can approve or reject members" };
  }

  const newStatus = params.decision === "approved" ? "active" : "rejected";

  const { error } = await supabase
    .from("organization_memberships")
    .update({ membership_status: newStatus })
    .eq("id", params.membershipId);

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}

