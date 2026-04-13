import { createClient } from "@/lib/supabase/server";
import type { TagCategory } from "@/lib/types/database";

export async function getAllTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getTagsByCategory(category: TagCategory) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("category", category)
    .order("name");

  if (error) throw error;
  return data;
}

export async function getTagsGroupedByCategory() {
  const tags = await getAllTags();
  const grouped: Record<string, typeof tags> = {};
  for (const tag of tags) {
    if (!grouped[tag.category]) grouped[tag.category] = [];
    grouped[tag.category].push(tag);
  }
  return grouped;
}
