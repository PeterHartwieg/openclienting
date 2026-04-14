import { unstable_cache } from "next/cache";
import type { TagCategory } from "@/lib/types/database";
import { sortTagsByLocaleLabel } from "@/lib/i18n/tags";
import { createPublicClient } from "@/lib/supabase/public";

const getAllTagsCached = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("tags").select("*");

    if (error) throw error;
    return data;
  },
  ["tags:all"],
  { revalidate: 3600, tags: ["tags"] },
);

export async function getAllTags() {
  return getAllTagsCached();
}

export async function getTagsByCategory(category: TagCategory) {
  const tags = await getAllTagsCached();
  return tags.filter((tag) => tag.category === category);
}

/**
 * Returns tags grouped by category, sorted by their localized label.
 * Sorting happens in JS so German labels collate correctly without
 * requiring a `de_DE` collation in Postgres.
 */
export async function getTagsGroupedByCategory(locale: string) {
  const tags = await getAllTags();
  const grouped: Record<string, typeof tags> = {};
  for (const tag of tags) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }
  for (const category of Object.keys(grouped)) {
    grouped[category] = sortTagsByLocaleLabel(grouped[category], locale);
  }
  return grouped;
}
