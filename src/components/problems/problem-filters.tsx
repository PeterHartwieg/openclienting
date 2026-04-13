"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TagOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface ProblemFiltersProps {
  tagsByCategory: Record<string, TagOption[]>;
  locale: string;
}

const categoryLabels: Record<string, string> = {
  industry: "Industry",
  function: "Function",
  problem_category: "Problem Category",
  company_size: "Company Size",
};

export function ProblemFilters({ tagsByCategory, locale }: ProblemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleFilter = useCallback(
    (category: string, slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(category) === slug) {
        params.delete(category);
      } else {
        params.set(category, slug);
      }
      router.push(`/${locale}/problems?${params.toString()}`);
    },
    [router, searchParams, locale]
  );

  const clearFilters = useCallback(() => {
    router.push(`/${locale}/problems`);
  }, [router, locale]);

  const hasActiveFilters = ["industry", "function", "problem_category", "company_size"].some(
    (cat) => searchParams.has(cat)
  );

  return (
    <aside className="w-full space-y-6">
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear all filters
        </Button>
      )}

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
                  {tag.name}
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
