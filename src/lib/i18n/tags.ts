import type { Locale } from "@/i18n/config";

// Minimal shape — accepts any object that has at least name + name_de.
export type LocalizableTag = {
  name: string;
  name_de?: string | null;
};

/**
 * Returns the localized display label for a tag. Falls back to English
 * (`tag.name`) whenever a translation is missing, so the UI never renders
 * blank for an un-backfilled tag.
 */
export function getTagLabel(tag: LocalizableTag, locale: string): string {
  if (locale === ("de" satisfies Locale)) {
    return tag.name_de?.trim() || tag.name;
  }
  return tag.name;
}

/**
 * Sort an array of tags by their localized label using the locale's
 * collation rules. Postgres default collation does not sort German
 * correctly without a `de_DE` collation that may not be installed, so we
 * fetch unsorted from the DB and sort here.
 */
export function sortTagsByLocaleLabel<T extends LocalizableTag>(
  tags: T[],
  locale: string,
): T[] {
  return [...tags].sort((a, b) =>
    getTagLabel(a, locale).localeCompare(getTagLabel(b, locale), locale),
  );
}
