import "server-only";
import { getTranslations } from "next-intl/server";
import { getTagLabel } from "@/lib/i18n/tags";
import { firstSentence } from "@/lib/seo/derive";

/**
 * Server-only helper that derives the fields rendered by
 * <ProblemAnswerSummary>. Kept separate from `schema.ts` because it needs
 * `getTranslations()` — schema builders stay translation-free so they can be
 * called from route handlers.
 */

interface Tag {
  id: string;
  name: string;
  name_de?: string | null;
  slug: string;
  category: string;
}

interface Requirement {
  status: string;
  body: string;
  upvote_count: number;
}

interface SuccessReport {
  status: string;
  verification_status?: string;
}

interface SolutionApproach {
  status: string;
  success_reports?: SuccessReport[] | null;
}

interface ProblemLike {
  description: string;
  solution_status: string | null;
  requirements?: Requirement[] | null;
  solution_approaches?: SolutionApproach[] | null;
  problem_tags?: Array<{ tags: Tag | null }> | null;
}

export interface AnswerSummaryFields {
  summary: string;
  whoThisAffectsLabel: string;
  whoThisAffects: string | null;
  knownRequirementsLabel: string;
  knownRequirements: string;
  pilotEvidenceLabel: string;
  pilotEvidence: string;
  solutionStatus: string;
  summaryLabel: string;
}

// Categories considered "audience" signals surfaced in "Who this affects".
const AUDIENCE_CATEGORIES = new Set(["industry", "company_size", "function"]);

export async function answerSummaryFields(
  problem: ProblemLike,
  locale: string,
): Promise<AnswerSummaryFields> {
  const t = await getTranslations({
    locale,
    namespace: "problemDetail.answerSummary",
  });

  const summary = firstSentence(problem.description);

  // Audience tags from industry / company_size / function.
  const audienceTags = (problem.problem_tags ?? [])
    .map((pt) => pt.tags)
    .filter((tag): tag is Tag => !!tag && AUDIENCE_CATEGORIES.has(tag.category))
    .map((tag) => getTagLabel(tag, locale));

  const whoThisAffects = audienceTags.length > 0 ? audienceTags.join(" · ") : null;

  // Requirements: count + top-voted requirement body (truncated).
  const publishedRequirements = (problem.requirements ?? [])
    .filter((r) => r.status === "published")
    .sort((a, b) => b.upvote_count - a.upvote_count);
  const reqCount = publishedRequirements.length;
  const topReqBody = publishedRequirements[0]?.body ?? null;

  let knownRequirements: string;
  if (reqCount === 0) {
    knownRequirements = t("requirementsEmpty");
  } else {
    const truncatedTop = topReqBody
      ? topReqBody.length > 120
        ? `${topReqBody.slice(0, 120).trimEnd()}…`
        : topReqBody
      : "";
    knownRequirements = truncatedTop
      ? t("requirementsFilled", { count: reqCount, top: truncatedTop })
      : t("requirementsCount", { count: reqCount });
  }

  // Pilot evidence: count of verified success reports across all approaches.
  const verifiedReports = (problem.solution_approaches ?? [])
    .filter((sa) => sa.status === "published")
    .flatMap((sa) => sa.success_reports ?? [])
    .filter((r) => r.status === "published" && r.verification_status === "verified");
  const pilotEvidence =
    verifiedReports.length === 0
      ? t("pilotEvidenceEmpty")
      : t("pilotEvidenceFilled", { count: verifiedReports.length });

  // Solution status label.
  const statusKey = problem.solution_status ?? "unsolved";
  const solutionStatus = t(`status.${statusKey}`);

  return {
    summaryLabel: t("summaryLabel"),
    summary,
    whoThisAffectsLabel: t("whoThisAffects"),
    whoThisAffects,
    knownRequirementsLabel: t("knownRequirements"),
    knownRequirements,
    pilotEvidenceLabel: t("pilotEvidence"),
    pilotEvidence,
    solutionStatus,
  };
}
