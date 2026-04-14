// Single source of truth for supported locales.
// Add a new locale: add it here, drop messages/<locale>.json, translate name in
// the language switcher, optionally backfill tag translations in the DB.

export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

// BCP-47 tags for Intl.DateTimeFormat / Intl.NumberFormat.
export const localeTags: Record<Locale, string> = {
  en: "en-US",
  de: "de-DE",
};
