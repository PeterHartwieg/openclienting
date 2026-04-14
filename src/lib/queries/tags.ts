import { createClient } from "@/lib/supabase/server";
import type { TagCategory } from "@/lib/types/database";
import { sortTagsByLocaleLabel } from "@/lib/i18n/tags";

export async function getAllTags() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*");

  if (error) throw error;
  return data;
}

export async function getTagsByCategory(category: TagCategory) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("category", category);

  if (error) throw error;
  return data;
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
