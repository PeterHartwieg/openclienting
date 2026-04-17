"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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

  const setFilter = useCallback(
    (category: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value) {
        params.delete(category);
      } else {
        params.set(category, value);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `/${locale}/problems?${qs}` : `/${locale}/problems`);
    },
    [router, searchParams, locale],
  );

  const solutionStatusOptions = [
    { slug: "unsolved", label: t("statusUnsolved") },
    { slug: "has_approaches", label: t("statusHasApproaches") },
    { slug: "successful_pilot", label: t("statusSuccessfulPilot") },
  ];

  const tagCategories = [
    { key: "industry" as const, label: t("filterIndustry") },
    { key: "function" as const, label: t("filterFunction") },
    { key: "problem_category" as const, label: t("filterCategory") },
    { key: "company_size" as const, label: t("filterCompanySize") },
  ];

  const activeStatus = searchParams.get("solution_status");
  const activeStatusLabel = solutionStatusOptions.find((o) => o.slug === activeStatus)?.label;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Solution Status */}
      <Select
        value={activeStatus ?? ""}
        onValueChange={(val) => setFilter("solution_status", val ?? "")}
      >
        <SelectTrigger className="min-w-[9rem]">
          <span
            data-slot="select-value"
            className={cn("flex flex-1 text-left", !activeStatus && "text-muted-foreground")}
          >
            {activeStatusLabel ?? t("filterSolutionStatus")}
          </span>
        </SelectTrigger>
        <SelectContent align="start">
          {solutionStatusOptions.map((opt) => (
            <SelectItem key={opt.slug} value={opt.slug}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tag-based filters */}
      {tagCategories.map(({ key, label }) => {
        const tags = tagsByCategory[key] ?? [];
        if (tags.length === 0) return null;
        const activeSlug = searchParams.get(key);
        const activeTag = tags.find((tg) => tg.slug === activeSlug);
        const activeLabel = activeTag ? getTagLabel(activeTag, locale) : null;
        return (
          <Select
            key={key}
            value={activeSlug ?? ""}
            onValueChange={(val) => setFilter(key, val ?? "")}
          >
            <SelectTrigger className="min-w-[8rem]">
              <span
                data-slot="select-value"
                className={cn("flex flex-1 text-left", !activeSlug && "text-muted-foreground")}
              >
                {activeLabel ?? label}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.slug}>
                  {getTagLabel(tag, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}
