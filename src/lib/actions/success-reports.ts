"use server";

import { createClient } from "@/lib/supabase/server";
import { invalidateForMany } from "@/lib/cache/tags";

export async function submitSuccessReport(params: {
  solutionApproachId: string;
  organizationId: string;
  reportSummary: string;
  pilotDateRange?: string;
  deploymentScope?: string;
  kpiSummary?: string;
  evidenceNotes?: string;
  attachmentRefs?: string[];
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in to contribute" };
  if (!params.reportSummary.trim()) return { success: false, error: "Summary is required" };
  if (!params.organizationId) return { success: false, error: "Organization is required" };

  // Verify the user has active membership in the specified verified organization
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("id, organizations!inner(verification_status)")
    .eq("user_id", user.id)
    .eq("organization_id", params.organizationId)
    .eq("membership_status", "active")
    .eq("organizations.verification_status", "verified")
    .maybeSingle();

  if (!membership) {
    return {
      success: false,
      error: "You must be an active member of a verified organization to submit success reports",
    };
  }

  const { error } = await supabase.from("success_reports").insert({
    solution_approach_id: params.solutionApproachId,
    submitted_by_user_id: user.id,
    submitted_by_organization_id: params.organizationId,
    report_summary: params.reportSummary.trim(),
    pilot_date_range: params.pilotDateRange?.trim() || null,
    deployment_scope: params.deploymentScope?.trim() || null,
    kpi_summary: params.kpiSummary?.trim() || null,
    evidence_notes: params.evidenceNotes?.trim() || null,
    optional_attachment_refs: params.attachmentRefs?.length ? params.attachmentRefs : [],
    is_publicly_anonymous: params.isPubliclyAnonymous,
    is_org_anonymous: params.isOrgAnonymous,
    status: "submitted",
    verification_status: "submitted",
  });

  if (error) return { success: false, error: error.message };

  // getPublishedProblemForMarkdown joins success_reports (via solution_approaches)
  // without filtering by child status, so a newly submitted report appears in the
  // cached problem detail. Also bust success_reports for home stats loader.
  invalidateForMany(["success_report", "problem"]);
  return { success: true };
}
