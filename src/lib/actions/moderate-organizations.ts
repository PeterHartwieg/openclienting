"use server";

import { createClient } from "@/lib/supabase/server";
import type { VerificationDecision } from "@/lib/types/database";

export async function reviewOrganizationVerification(params: {
  organizationId: string;
  decision: VerificationDecision;
  notes?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden" };
  }

  const newStatus = params.decision === "approved" ? "verified" : "rejected";

  const { error } = await supabase
    .from("organizations")
    .update({ verification_status: newStatus })
    .eq("id", params.organizationId);

  if (error) return { success: false, error: error.message };

  // Log the review
  const { error: reviewError } = await supabase
    .from("verification_reviews")
    .insert({
      target_type: "organization",
      target_id: params.organizationId,
      reviewer_id: user.id,
      decision: params.decision,
      notes: params.notes?.trim() || null,
    });

  if (reviewError) return { success: false, error: reviewError.message };

  return { success: true };
}

export async function reviewMembership(params: {
  membershipId: string;
  decision: VerificationDecision;
  notes?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { success: false, error: "Forbidden" };
  }

  const newStatus = params.decision === "approved" ? "active" : "rejected";

  const { error } = await supabase
    .from("organization_memberships")
    .update({ membership_status: newStatus })
    .eq("id", params.membershipId);

  if (error) return { success: false, error: error.message };

  // Log the review
  const { error: reviewError } = await supabase
    .from("verification_reviews")
    .insert({
      target_type: "membership",
      target_id: params.membershipId,
      reviewer_id: user.id,
      decision: params.decision,
      notes: params.notes?.trim() || null,
    });

  if (reviewError) return { success: false, error: reviewError.message };

  return { success: true };
}
