"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getTagLabel } from "@/lib/i18n/tags";

interface TagOption {
  id: string;
  name: string;
  name_de?: string | null;
  slug: string;
  category: string;
}

interface ProblemFiltersProps {
  tagsByCategory: Record<string, TagOption[]>;
  locale: string;
}

export function ProblemFilters({ tagsByCategory, locale }: ProblemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("problemsList");

  const categoryLabels: Record<string, string> = {
    industry: t("filterIndustry"),
    function: t("filterFunction"),
    problem_category: t("filterCategory"),
    company_size: t("filterCompanySize"),
  };

  const toggleFilter = useCallback(
    (category: string, slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(category) === slug) {
        params.delete(category);
      } else {
        params.set(category, slug);
      }
      // Facet change invalidates the current page offset: previous page
      // numbers may exceed the new totalPages and land on an empty slice.
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `/${locale}/problems?${qs}` : `/${locale}/problems`);
    },
    [router, searchParams, locale]
  );

  const clearFilters = useCallback(() => {
    router.push(`/${locale}/problems`);
  }, [router, locale]);

  const hasActiveFilters = ["industry", "function", "problem_category", "company_size", "solution_status"].some(
    (cat) => searchParams.has(cat)
  );

  const solutionStatusOptions = [
    { slug: "unsolved", label: t("statusUnsolved") },
    { slug: "has_approaches", label: t("statusHasApproaches") },
    { slug: "successful_pilot", label: t("statusSuccessfulPilot") },
  ];

  return (
    <aside className="w-full space-y-6">
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          {t("filterClear")}
        </Button>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t("filterSolutionStatus")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {solutionStatusOptions.map((opt) => (
            <Button
              key={opt.slug}
              variant={searchParams.get("solution_status") === opt.slug ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter("solution_status", opt.slug)}
              aria-pressed={searchParams.get("solution_status") === opt.slug}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <Separator className="mt-4" />
      </div>

      {Object.entries(categoryLabels).map(([category, label]) => {
        const tags = tagsByCategory[category] ?? [];
        if (tags.length === 0) return null;
        const activeSlug = searchParams.get(category);

        return (
          <div key={category}>
            <h3 className="mb-2 text-sm font-semibold">{label}</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  variant={activeSlug === tag.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(category, tag.slug)}
                  aria-pressed={activeSlug === tag.slug}
                >
                  {getTagLabel(tag, locale)}
                </Button>
              ))}
            </div>
            <Separator className="mt-4" />
          </div>
        );
      })}
    </aside>
  );
}
