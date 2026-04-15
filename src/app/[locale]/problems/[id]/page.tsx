import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  AlignLeft,
  FileText,
  Beaker,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { getProblemById } from "@/lib/queries/problems";
import { getUserVerifiedMemberships } from "@/lib/queries/organizations";
import { createClient } from "@/lib/supabase/server";
import { RequirementList } from "@/components/problems/requirement-list";
import { PilotFrameworkList } from "@/components/problems/pilot-framework-list";
import { AddRequirementForm } from "@/components/problems/add-requirement-form";
import { AddPilotFrameworkForm } from "@/components/problems/add-pilot-framework-form";
import { SolutionApproachList } from "@/components/problems/solution-approach-list";
import { AddSolutionApproachForm } from "@/components/problems/add-solution-approach-form";
import { CommentThread } from "@/components/comments/comment-thread";
import { CommentForm } from "@/components/comments/comment-form";
import { EditProblemForm } from "@/components/problems/edit-problem-form";
import { SuggestEditForm } from "@/components/problems/suggest-edit-form";
import { ProblemHero } from "@/components/problems/problem-hero";
import { ProblemSection } from "@/components/problems/problem-section";
import { ProblemTocSidebar } from "@/components/problems/problem-toc-sidebar";
import { ProblemAnswerSummary } from "@/components/problems/problem-answer-summary";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { firstSentence } from "@/lib/seo/derive";
import { problemArticleSchema } from "@/lib/seo/schema";
import { getSchemaSiteContext } from "@/lib/seo/site-context";
import { getTagLabel } from "@/lib/i18n/tags";
import { localeTags, type Locale } from "@/i18n/config";
import { generateProblemMetadata } from "./page.metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  return generateProblemMetadata(locale, id);
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("problemDetail");

  let problem;
  try {
    problem = await getProblemById(id);
  } catch {
    notFound();
  }

  if (!problem) notFound();

  // Get current user's votes for this problem's content
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVotedRequirements = new Set<string>();
  let userVotedFrameworks = new Set<string>();
  let userVotedApproaches = new Set<string>();
  let verifiedOrgs: { membershipId: string; role: string; orgId: string; orgName: string }[] = [];

  if (user) {
    verifiedOrgs = await getUserVerifiedMemberships(user.id);
    const reqIds = (problem.requirements ?? []).map((r: { id: string }) => r.id);
    const fwIds = (problem.pilot_frameworks ?? []).map((f: { id: string }) => f.id);
    const saIds = (problem.solution_approaches ?? []).map((s: { id: string }) => s.id);

    if (reqIds.length > 0) {
      const { data: reqVotes } = await supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "requirement")
        .in("target_id", reqIds);
      userVotedRequirements = new Set(reqVotes?.map((v) => v.target_id) ?? []);
    }

    if (fwIds.length > 0) {
      const { data: fwVotes } = await supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "pilot_framework")
        .in("target_id", fwIds);
      userVotedFrameworks = new Set(fwVotes?.map((v) => v.target_id) ?? []);
    }

    if (saIds.length > 0) {
      const { data: saVotes } = await supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "solution_approach")
        .in("target_id", saIds);
      userVotedApproaches = new Set(saVotes?.map((v) => v.target_id) ?? []);
    }
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from("comments")
    .select("id, body, is_publicly_anonymous, is_org_anonymous, parent_comment_id, created_at, profiles!comments_author_id_fkey(display_name), organizations!comments_author_organization_id_fkey(id, name)")
    .eq("target_type", "problem_template")
    .eq("target_id", id)
    .order("created_at", { ascending: true });

  const tags = (problem.problem_tags ?? [])
    .map(
      (pt: {
        tags: {
          id: string;
          name: string;
          name_de?: string | null;
          slug: string;
          category: string;
        } | null;
      }) => pt.tags,
    )
    .filter(Boolean);

  const publishedRequirements = (problem.requirements ?? [])
    .filter((r: { status: string }) => r.status === "published")
    .sort((a: { upvote_count: number }, b: { upvote_count: number }) => b.upvote_count - a.upvote_count);

  const publishedFrameworks = (problem.pilot_frameworks ?? [])
    .filter((f: { status: string }) => f.status === "published")
    .sort((a: { upvote_count: number }, b: { upvote_count: number }) => b.upvote_count - a.upvote_count);

  const publishedApproaches = (problem.solution_approaches ?? [])
    .filter((s: { status: string }) => s.status === "published")
    .sort((a: { upvote_count: number }, b: { upvote_count: number }) => b.upvote_count - a.upvote_count);

  // Normalize comments for the thread component
  const normalizedComments = (comments ?? []).map((c) => ({
    ...c,
    profiles: c.profiles as unknown as { display_name: string | null } | null,
    organizations: c.organizations as unknown as { id: string; name: string } | null,
  }));

  // Counts for hero stats + sidebar TOC
  const requirementCount = publishedRequirements.length;
  const frameworkCount = publishedFrameworks.length;
  const approachCount = publishedApproaches.length;
  const topLevelCommentCount = normalizedComments.filter((c) => !c.parent_comment_id).length;

  // Successful pilots = count of published, verified success_reports across approaches
  const successfulPilotCount = publishedApproaches.reduce(
    (sum: number, a: { success_reports?: { status: string; verification_status: string }[] }) =>
      sum +
      (a.success_reports ?? []).filter(
        (r) => r.status === "published" && r.verification_status === "verified"
      ).length,
    0
  );

  // Build contributor list (problem author first, then aggregated from contributions).
  // Keyed by stable identity (author_id + org_id) so that:
  //  - Two distinct anonymous users don't collapse into one "Anonymous" bucket.
  //  - Two distinct members who happen to share a display name aren't merged.
  // The display label ("Anonymous" / real name) is still derived per the
  // submission's anonymity flags — anon and named contributions from the same
  // author stay in separate buckets so we never re-attribute anonymous work.
  type ContribRow = { name: string; org: string | null; count: number };
  const contributorMap = new Map<string, ContribRow>();

  const addContributor = (
    authorId: string | null | undefined,
    isPublicAnon: boolean,
    isOrgAnon: boolean,
    profile: { display_name: string | null } | null | undefined,
    org: { id: string; name: string } | null | undefined,
  ) => {
    const displayName = isPublicAnon ? t("anonymous") : profile?.display_name ?? t("unknown");
    const orgIdShown = isOrgAnon ? null : org?.id ?? null;
    const orgNameShown = isOrgAnon ? null : org?.name ?? null;
    const stableAuthor = authorId ?? "unknown";
    // Prefix discriminates anon vs named so an author who chose anonymity for
    // some contributions doesn't end up displayed under their real name.
    const prefix = isPublicAnon ? "anon" : "named";
    const key = `${prefix}:${stableAuthor}|${orgIdShown ?? ""}`;
    const existing = contributorMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      contributorMap.set(key, { name: displayName, org: orgNameShown, count: 1 });
    }
  };

  // Problem author goes first
  addContributor(
    problem.author_id,
    problem.is_publicly_anonymous,
    problem.is_org_anonymous,
    problem.profiles,
    problem.organizations as { id: string; name: string } | null,
  );

  for (const r of publishedRequirements as Array<{
    author_id: string | null;
    is_publicly_anonymous: boolean;
    is_org_anonymous?: boolean;
    profiles?: { display_name: string | null } | null;
    organizations?: { id: string; name: string } | null;
  }>) {
    addContributor(r.author_id, r.is_publicly_anonymous, r.is_org_anonymous ?? false, r.profiles, r.organizations);
  }
  for (const f of publishedFrameworks as Array<{
    author_id: string | null;
    is_publicly_anonymous: boolean;
    is_org_anonymous?: boolean;
    profiles?: { display_name: string | null } | null;
    organizations?: { id: string; name: string } | null;
  }>) {
    addContributor(f.author_id, f.is_publicly_anonymous, f.is_org_anonymous ?? false, f.profiles, f.organizations);
  }
  for (const a of publishedApproaches as Array<{
    author_id: string | null;
    is_publicly_anonymous: boolean;
    is_org_anonymous?: boolean;
    profiles?: { display_name: string | null } | null;
    organizations?: { id: string; name: string } | null;
  }>) {
    addContributor(a.author_id, a.is_publicly_anonymous, a.is_org_anonymous ?? false, a.profiles, a.organizations);
  }

  const contributors = Array.from(contributorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const tocItems = [
    { id: "description", label: t("description"), icon: AlignLeft },
    { id: "requirements", label: t("requirements"), icon: FileText, count: requirementCount },
    { id: "pilot-frameworks", label: t("pilotFrameworks"), icon: Beaker, count: frameworkCount },
    { id: "solution-approaches", label: t("approaches"), icon: Lightbulb, count: approachCount },
    { id: "discussion", label: t("discussion"), icon: MessageCircle, count: topLevelCommentCount },
  ];

  const heroAuthorName = problem.is_publicly_anonymous
    ? t("anonymous")
    : problem.profiles?.display_name ?? t("unknown");
  const heroOrgName = problem.is_org_anonymous
    ? null
    : (problem.organizations as { id: string; name: string } | null)?.name ?? null;

  // Breadcrumbs + Article JSON-LD.
  const bt = await getTranslations({ locale, namespace: "breadcrumbs" });
  const siteCtx = getSchemaSiteContext();
  const canonicalPath = `/${locale}/problems/${id}`;
  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: bt("problems"), url: `/${locale}/problems` },
    { name: problem.title, url: canonicalPath },
  ];

  const articleSchema = problemArticleSchema(
    siteCtx,
    {
      id: problem.id,
      title: problem.title,
      description: firstSentence(problem.description),
      createdAt: problem.created_at,
      updatedAt: problem.updated_at ?? null,
      locale,
      canonicalUrl: `${siteCtx.siteUrl}${canonicalPath}`,
      keywords: (tags as Array<{ name: string; name_de?: string | null }>).map(
        (tag) => getTagLabel(tag, locale),
      ),
      authorName: heroAuthorName,
      orgName: heroOrgName,
    },
    localeTags[locale as Locale],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={articleSchema} />
      <Breadcrumbs items={breadcrumbItems} className="mb-4 text-sm text-muted-foreground" />

      <ProblemAnswerSummary problem={problem} locale={locale} />

      <ProblemHero
        title={problem.title}
        status={problem.solution_status ?? "unsolved"}
        authorName={heroAuthorName}
        orgName={heroOrgName}
        createdAt={problem.created_at}
        updatedAt={problem.updated_at ?? null}
        tags={tags}
        locale={locale}
        stats={{
          requirements: requirementCount,
          frameworks: frameworkCount,
          approaches: approachCount,
          successfulPilots: successfulPilotCount,
          discussions: topLevelCommentCount,
        }}
      />

      <div className="mt-8 flex gap-8">
        <div className="min-w-0 flex-1 space-y-6">
          <ProblemSection
            id="description"
            icon={AlignLeft}
            title={t("description")}
            accent="primary"
          >
            <p className="whitespace-pre-wrap text-base leading-relaxed">
              {problem.description}
            </p>
            {user && user.id === problem.author_id && problem.status === "published" && (
              <div className="mt-4">
                <EditProblemForm
                  problemId={problem.id}
                  currentTitle={problem.title}
                  currentDescription={problem.description}
                />
              </div>
            )}
            {user && user.id !== problem.author_id && problem.status === "published" && (
              <div className="mt-4">
                <SuggestEditForm
                  targetType="problem_template"
                  targetId={problem.id}
                  fields={[
                    { key: "title", label: t("fieldTitle"), value: problem.title },
                    { key: "description", label: t("fieldDescription"), value: problem.description, multiline: true },
                  ]}
                />
              </div>
            )}
          </ProblemSection>

          <ProblemSection
            id="requirements"
            icon={FileText}
            title={t("requirements")}
            count={requirementCount}
            accent="blue"
          >
            <RequirementList
              requirements={publishedRequirements}
              userVotes={userVotedRequirements}
              currentUserId={user?.id}
            />
            {user && (
              <div className="mt-4">
                <AddRequirementForm problemId={problem.id} verifiedOrgs={verifiedOrgs} />
              </div>
            )}
          </ProblemSection>

          <ProblemSection
            id="pilot-frameworks"
            icon={Beaker}
            title={t("pilotFrameworks")}
            count={frameworkCount}
            accent="violet"
          >
            <PilotFrameworkList
              frameworks={publishedFrameworks}
              userVotes={userVotedFrameworks}
              currentUserId={user?.id}
            />
            {user && (
              <div className="mt-4">
                <AddPilotFrameworkForm problemId={problem.id} verifiedOrgs={verifiedOrgs} />
              </div>
            )}
          </ProblemSection>

          <ProblemSection
            id="solution-approaches"
            icon={Lightbulb}
            title={t("approaches")}
            count={approachCount}
            accent="amber"
          >
            {successfulPilotCount > 0 && (
              // Dedicated anchor for AI answer engines citing verified outcomes.
              // The section is not visually restructured — verified reports still
              // live per-approach — but crawlers can link directly to this id.
              <span
                id="verified-outcomes"
                aria-label={t("verifiedOutcomesHeading")}
                className="sr-only"
              >
                {t("verifiedOutcomesHeading")}
              </span>
            )}
            <SolutionApproachList
              approaches={publishedApproaches}
              userVotes={userVotedApproaches}
              isAuthenticated={!!user}
              currentUserId={user?.id}
              verifiedOrgs={verifiedOrgs}
            />
            {user && (
              <div className="mt-4">
                <AddSolutionApproachForm problemId={problem.id} verifiedOrgs={verifiedOrgs} />
              </div>
            )}
          </ProblemSection>

          <ProblemSection
            id="discussion"
            icon={MessageCircle}
            title={t("discussion")}
            count={topLevelCommentCount}
            accent="slate"
          >
            <CommentThread comments={normalizedComments} />
            {user && (
              <div className="mt-4">
                <CommentForm targetId={problem.id} verifiedOrgs={verifiedOrgs} />
              </div>
            )}
          </ProblemSection>
        </div>

        <ProblemTocSidebar items={tocItems} contributors={contributors} locale={locale} />
      </div>
    </div>
  );
}
