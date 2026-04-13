"use client";

import { Badge } from "@/components/ui/badge";

interface TagOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

const categoryLabels: Record<string, string> = {
  industry: "Industry",
  function: "Function",
  problem_category: "Problem Category",
  company_size: "Company Size",
  technology: "Technology",
};

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
                    {tag.name}
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
