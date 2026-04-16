import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  DEFAULT_PROBLEMS_PAGE_SIZE,
  getPublishedProblemsPage,
} from "@/lib/queries/problems";
import { getTagsGroupedByCategory } from "@/lib/queries/tags";
import { ProblemCard } from "@/components/problems/problem-card";
import { ProblemFilters } from "@/components/problems/problem-filters";
import { ProblemsPagination } from "@/components/problems/pagination";
import { SearchBar } from "@/components/layout/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getLanguageAlternates } from "@/lib/site";
import { problemsCollectionSchema } from "@/lib/seo/schema";
import { getSchemaSiteContext } from "@/lib/seo/site-context";
import { localeTags, type Locale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "problemsList" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getLanguageAlternates(locale, "/problems"),
  };
}

export default async function BrowseProblemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("problemsList");
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const industry = typeof sp.industry === "string" ? sp.industry : undefined;
  const func = typeof sp.function === "string" ? sp.function : undefined;
  const problemCategory =
    typeof sp.problem_category === "string" ? sp.problem_category : undefined;
  const companySize =
    typeof sp.company_size === "string" ? sp.company_size : undefined;
  const solutionStatus =
    typeof sp.solution_status === "string" ? sp.solution_status : undefined;

  const rawPage = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [problemsPage, tagsByCategory] = await Promise.all([
    getPublishedProblemsPage({
      filters: {
        q,
        industry,
        function: func,
        problem_category: problemCategory,
        company_size: companySize,
        solution_status: solutionStatus,
      },
      page,
      pageSize: DEFAULT_PROBLEMS_PAGE_SIZE,
    }),
    getTagsGroupedByCategory(locale),
  ]);

  // If the requested page is past the end of the result set, redirect to the
  // last valid page instead of showing the empty state (which hides the
  // pagination control and strands the user). Only fires when total > 0; an
  // empty result set legitimately renders the empty state.
  const totalPages = Math.max(
    1,
    Math.ceil(problemsPage.total / problemsPage.pageSize),
  );
  if (problemsPage.total > 0 && page > totalPages) {
    const clampParams = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) clampParams.append(key, v);
      } else {
        clampParams.set(key, value);
      }
    }
    if (totalPages <= 1) {
      clampParams.delete("page");
    } else {
      clampParams.set("page", String(totalPages));
    }
    const qs = clampParams.toString();
    redirect(qs ? `/${locale}/problems?${qs}` : `/${locale}/problems`);
  }

  const problems = problemsPage.rows;

  // Build breadcrumbs and CollectionPage schema. ItemList is capped at the
  // first 50 rendered problems so the JSON-LD payload stays under a sensible
  // size even if filters return a large set. Schema reflects the currently
  // visible list — not "all problems" — matching Google's "visible on page"
  // rule.
  const bt = await getTranslations({ locale, namespace: "breadcrumbs" });
  const siteCtx = getSchemaSiteContext();
  const problemsPath = `/${locale}/problems`;
  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: bt("problems"), url: problemsPath },
  ];
  const collectionSchema = problemsCollectionSchema({
    inLanguageTag: localeTags[locale as Locale],
    pageName: t("metaTitle"),
    pageDescription: t("metaDescription"),
    pageUrl: `${siteCtx.siteUrl}${problemsPath}`,
    items: problems.slice(0, 50).map((p) => ({
      id: p.id,
      title: p.title,
      url: `${siteCtx.siteUrl}/${locale}/problems/${p.id}`,
    })),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={collectionSchema} />
      <Breadcrumbs items={breadcrumbItems} className="mb-4 text-sm text-muted-foreground" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-4 max-w-xl">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <SearchBar locale={locale} initialQuery={q} />
          </Suspense>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar filters */}
        <div className="w-full shrink-0 lg:w-64">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ProblemFilters tagsByCategory={tagsByCategory} locale={locale} />
          </Suspense>
        </div>

        {/* Problem grid */}
        <div className="flex-1">
          {problems.length === 0 ? (
            <EmptyState state="match" message={t("noResults")} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {problems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    id={problem.id}
                    title={problem.title}
                    description={problem.description}
                    is_publicly_anonymous={problem.is_publicly_anonymous}
                    is_org_anonymous={problem.is_org_anonymous}
                    author={problem.profiles}
                    organization={problem.organizations as { id: string; name: string } | null}
                    problemTags={problem.problem_tags ?? []}
                    solutionStatus={problem.solution_status ?? undefined}
                    locale={locale}
                  />
                ))}
              </div>
              <ProblemsPagination
                page={problemsPage.page}
                total={problemsPage.total}
                pageSize={problemsPage.pageSize}
                basePath={problemsPath}
                searchParams={sp}
                labels={{
                  previous: t("paginationPrevious"),
                  next: t("paginationNext"),
                  page: t("paginationPage"),
                  of: t("paginationOf"),
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
