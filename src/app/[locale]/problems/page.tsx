import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPublishedProblems } from "@/lib/queries/problems";
import { getTagsGroupedByCategory } from "@/lib/queries/tags";
import { ProblemCard } from "@/components/problems/problem-card";
import { ProblemFilters } from "@/components/problems/problem-filters";
import { SearchBar } from "@/components/layout/search-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getLanguageAlternates } from "@/lib/site";

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

  const [problems, tagsByCategory] = await Promise.all([
    getPublishedProblems({
      q,
      industry,
      function: func,
      problem_category: problemCategory,
      company_size: companySize,
      solution_status: solutionStatus,
    }),
    getTagsGroupedByCategory(locale),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground">{t("noResults")}</p>
            </div>
          ) : (
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
                  solutionStatus={problem.solution_status}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
