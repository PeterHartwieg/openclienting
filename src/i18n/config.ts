// Single source of truth for supported locales. The full list lives in
// `./languages.ts` so the language-switcher, the open-source translation
// feature, and next-intl routing can all share it.
//
// Adding a new locale: append it to LANGUAGES in ./languages.ts. URLs like
// /<code>/... start working immediately. UI chrome falls back to English
// when no messages/<code>.json exists (see ./request.ts). Content renders
// in the new language once moderators approve content_translations rows.

import { LANGUAGE_CODES, LANGUAGES, findLanguage } from "./languages";

export const locales = LANGUAGE_CODES;
export type Locale = string;

export const defaultLocale: Locale = "en";

export const localeNames: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.endonym]),
);

// BCP-47 tags for Intl.DateTimeFormat / Intl.NumberFormat.
export const localeTags: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.bcp47]),
);

export function getLocaleTag(locale: string): string {
  return findLanguage(locale)?.bcp47 ?? "en-US";
}
