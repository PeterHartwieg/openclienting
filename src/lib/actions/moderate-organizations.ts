"use server";

import { createClient } from "@/lib/supabase/server";
import type { VerificationDecision } from "@/lib/types/database";
import { invalidateFor } from "@/lib/cache/tags";

export async function reviewOrganizationVerification(params: {
  organizationId: string;
  decision: VerificationDecision;
  notes?: string;
}) {
  const supabase = await createClient();

  // Fast-fail auth guard (better error messages than a bare RLS silence)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Single atomic RPC: role check + org update + audit insert in one transaction
  const { error } = await supabase.rpc("review_organization_verification", {
    p_org: params.organizationId,
    p_decision: params.decision,
    p_notes: params.notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  // Invalidate the cached org directory / profile pages
  invalidateFor("organization");

  return { success: true };
}

