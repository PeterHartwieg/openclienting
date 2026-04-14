"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { getTagLabel } from "@/lib/i18n/tags";

interface TagOption {
  id: string;
  name: string;
  name_de?: string | null;
  slug: string;
  category: string;
}

interface TagSelectorProps {
  tagsByCategory: Record<string, TagOption[]>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({
  tagsByCategory,
  selectedIds,
  onChange,
}: TagSelectorProps) {
  const locale = useLocale();
  const tTags = useTranslations("tags");
  const categoryLabels: Record<string, string> = {
    industry: tTags("categoryIndustry"),
    function: tTags("categoryFunction"),
    problem_category: tTags("categoryProblemCategory"),
    company_size: tTags("categoryCompanySize"),
    technology: tTags("categoryTechnology"),
  };
  function toggle(tagId: string) {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(tagsByCategory).map(([category, tags]) => {
        if (tags.length === 0) return null;
        return (
          <div key={category}>
            <p className="mb-2 text-sm font-medium">
              {categoryLabels[category] ?? category}
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedIds.includes(tag.id);
                return (
                  <Badge
                    key={tag.id}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => toggle(tag.id)}
                  >
                    {getTagLabel(tag, locale)}
                  </Badge>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
