import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPendingVerifications } from "./organizations";
import { getSourceFields } from "./content-translations";
import type {
  TranslationFields,
  TranslationTargetType,
} from "@/lib/types/database";
import type { ModerationCounts } from "@/lib/nav/config";

const PENDING_STATUSES = ["submitted", "in_review"] as const;

// ---------------------------------------------------------------------------
// Counts — cheap head-only queries used by the workspace sidebar badges and
// the moderation overview cards. Wrapped in React `cache()` so the layout
// (which renders the sidebar) and the overview page (which renders the
// summary tiles) share a single round-trip per request.
// ---------------------------------------------------------------------------

export const getModerationCounts = cache(
  async (): Promise<ModerationCounts> => {
    const supabase = await createClient();

    const headOf = (q: { then: PromiseLike<{ count: number | null }>["then"] }) =>
      (q as unknown as PromiseLike<{ count: number | null }>).then(
        (r) => r.count ?? 0,
      );

    const [
      problems,
      requirements,
      frameworks,
      solutions,
      successReports,
      suggestedEdits,
      organizationVerification,
      liveRevisions,
      knowledgeArticles,
      translations,
    ] = await Promise.all([
      headOf(
        supabase
          .from("problem_templates")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("requirements")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("pilot_frameworks")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("solution_approaches")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("success_reports")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("suggested_edits")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("verification_status", "pending"),
      ),
      headOf(
        supabase
          .from("content_revisions")
          .select("id", { count: "exact", head: true })
          .eq("revision_status", "pending_recheck"),
      ),
      headOf(
        supabase
          .from("knowledge_articles")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
      headOf(
        supabase
          .from("content_translations")
          .select("id", { count: "exact", head: true })
          .in("status", PENDING_STATUSES),
      ),
    ]);

    return {
      problems,
      requirements,
      frameworks,
      solutions,
      successReports,
      suggestedEdits,
      organizationVerification,
      liveRevisions,
      knowledgeArticles,
      translations,
    };
  },
);

// ---------------------------------------------------------------------------
// Per-queue helpers. Each returns the rows the queue page needs plus a
// derived count, so the page can show "N pending" without re-querying.
// Shapes mirror what the old monolithic moderation page selected, so the
// existing review components (ModerationActions, SuccessReportReview, etc.)
// keep working unchanged.
// ---------------------------------------------------------------------------

export async function getProblemsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("problem_templates")
    .select(
      "id, title, status, content_origin, packet_id, created_at, profiles!problem_templates_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getRequirementsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("requirements")
    .select(
      "id, body, status, created_at, problem_id, profiles!requirements_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getFrameworksQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pilot_frameworks")
    .select(
      "id, scope, status, created_at, problem_id, profiles!pilot_frameworks_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getSolutionsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solution_approaches")
    .select(
      "id, title, status, created_at, problem_id, profiles!solution_approaches_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getSuccessReportsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("success_reports")
    .select(
      `
        id, report_summary, pilot_date_range, deployment_scope, kpi_summary, evidence_notes,
        status, verification_status, created_at, solution_approach_id,
        is_publicly_anonymous, is_org_anonymous,
        profiles!success_reports_author_id_fkey (display_name),
        organizations!success_reports_submitted_by_organization_id_fkey (id, name)
      `,
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getSuggestedEditsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggested_edits")
    .select(
      "id, target_type, target_id, diff, status, created_at, profiles!suggested_edits_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getOrganizationVerificationQueue() {
  const items = await getPendingVerifications();
  return { items, count: items.length };
}

export async function getLiveRevisionsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_revisions")
    .select(
      "id, target_type, target_id, diff, created_at, profiles!content_revisions_author_id_fkey(display_name)",
    )
    .eq("revision_status", "pending_recheck")
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export async function getKnowledgeArticlesQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_articles")
    .select(
      "id, slug, locale, kind, title, lede, tags, status, created_at, profiles!knowledge_articles_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];
  return { items, count: items.length };
}

export type TranslationSourceMap = Map<
  string,
  { fields: Record<string, string>; sourceLanguage: string }
>;

export async function getTranslationsQueue() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_translations")
    .select(
      "id, target_type, target_id, language, fields, status, created_at, profiles!content_translations_author_id_fkey(display_name)",
    )
    .in("status", PENDING_STATUSES)
    .order("created_at", { ascending: true });
  const items = data ?? [];

  // Resolve source rows so the review card can show side-by-side EN vs.
  // target. Batched per (target_type, target_id) pair; the queue is small
  // (dozens, not thousands) so per-row cost is negligible.
  const sources: TranslationSourceMap = new Map();
  for (const tr of items) {
    const key = `${tr.target_type}:${tr.target_id}`;
    if (sources.has(key)) continue;
    const src = await getSourceFields(
      tr.target_type as TranslationTargetType,
      tr.target_id,
    );
    if (src) sources.set(key, src);
  }

  return { items, sources, count: items.length };
}

// Re-exported for queue pages that need the field type without pulling in
// the database types module directly.
export type { TranslationFields };
