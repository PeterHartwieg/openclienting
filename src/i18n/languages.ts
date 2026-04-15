/**
 * Full set of languages the platform accepts for crowd-sourced content
 * translations and for URL-level locale routing.
 *
 * This is the canonical list. The `code` field is the ISO 639-1 two-letter
 * code used everywhere (URL prefix, content_translations.language,
 * messages/<code>.json filename). `endonym` is the name in its own language
 * — always show the endonym in the language switcher so a visitor can find
 * their language without reading another one first.
 *
 * The order below is intentional: the "big ones" (by roughly combined
 * first-language + second-language speaker counts and by EU business
 * relevance) come first. The language picker preserves this order so users
 * contributing translations see the most useful options at the top.
 *
 * Adding a language here makes `/<code>/...` URLs work immediately — UI
 * chrome falls back to English when `messages/<code>.json` is missing
 * (see src/i18n/request.ts). Content renders in the target language when
 * an approved `content_translations` row exists for it, else falls back
 * to the source English row.
 */

export interface LanguageDefinition {
  /** ISO 639-1 two-letter code. Lowercase. */
  code: string;
  /** English name, for moderator UI and fallbacks. */
  englishName: string;
  /** Endonym — name of the language in its own language. */
  endonym: string;
  /** BCP-47 tag for Intl.DateTimeFormat / Intl.NumberFormat. */
  bcp47: string;
}

export const LANGUAGES: readonly LanguageDefinition[] = [
  // Tier 1 — most common site visitors / business languages
  { code: "en", englishName: "English", endonym: "English", bcp47: "en-US" },
  { code: "de", englishName: "German", endonym: "Deutsch", bcp47: "de-DE" },
  { code: "es", englishName: "Spanish", endonym: "Español", bcp47: "es-ES" },
  { code: "fr", englishName: "French", endonym: "Français", bcp47: "fr-FR" },
  { code: "zh", englishName: "Chinese", endonym: "中文", bcp47: "zh-CN" },
  { code: "ar", englishName: "Arabic", endonym: "العربية", bcp47: "ar" },
  { code: "pt", englishName: "Portuguese", endonym: "Português", bcp47: "pt-PT" },
  { code: "ru", englishName: "Russian", endonym: "Русский", bcp47: "ru-RU" },
  { code: "ja", englishName: "Japanese", endonym: "日本語", bcp47: "ja-JP" },
  { code: "hi", englishName: "Hindi", endonym: "हिन्दी", bcp47: "hi-IN" },

  // Tier 2 — regional European and industrial economies
  { code: "it", englishName: "Italian", endonym: "Italiano", bcp47: "it-IT" },
  { code: "nl", englishName: "Dutch", endonym: "Nederlands", bcp47: "nl-NL" },
  { code: "pl", englishName: "Polish", endonym: "Polski", bcp47: "pl-PL" },
  { code: "tr", englishName: "Turkish", endonym: "Türkçe", bcp47: "tr-TR" },
  { code: "ko", englishName: "Korean", endonym: "한국어", bcp47: "ko-KR" },
  { code: "sv", englishName: "Swedish", endonym: "Svenska", bcp47: "sv-SE" },
  { code: "da", englishName: "Danish", endonym: "Dansk", bcp47: "da-DK" },
  { code: "no", englishName: "Norwegian", endonym: "Norsk", bcp47: "nb-NO" },
  { code: "fi", englishName: "Finnish", endonym: "Suomi", bcp47: "fi-FI" },
  { code: "cs", englishName: "Czech", endonym: "Čeština", bcp47: "cs-CZ" },

  // Tier 3 — broader reach
  { code: "el", englishName: "Greek", endonym: "Ελληνικά", bcp47: "el-GR" },
  { code: "he", englishName: "Hebrew", endonym: "עברית", bcp47: "he-IL" },
  { code: "hu", englishName: "Hungarian", endonym: "Magyar", bcp47: "hu-HU" },
  { code: "ro", englishName: "Romanian", endonym: "Română", bcp47: "ro-RO" },
  { code: "uk", englishName: "Ukrainian", endonym: "Українська", bcp47: "uk-UA" },
  { code: "vi", englishName: "Vietnamese", endonym: "Tiếng Việt", bcp47: "vi-VN" },
  { code: "id", englishName: "Indonesian", endonym: "Bahasa Indonesia", bcp47: "id-ID" },
  { code: "th", englishName: "Thai", endonym: "ไทย", bcp47: "th-TH" },
  { code: "bn", englishName: "Bengali", endonym: "বাংলা", bcp47: "bn-IN" },
  { code: "sw", englishName: "Swahili", endonym: "Kiswahili", bcp47: "sw" },
] as const;

/** Codes only, in priority order. Feeds next-intl routing config. */
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as readonly string[];

/** Right-to-left languages — used by <html dir> and text alignment. */
const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);

export function isRtl(code: string): boolean {
  return RTL_LANGUAGES.has(code);
}

export function findLanguage(code: string): LanguageDefinition | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

/**
 * Friendly display label for a language code. Prefers the endonym so the
 * user sees their language in their own script. Falls back to the raw code
 * for unknown values (shouldn't happen in normal flow).
 */
export function getLanguageLabel(code: string): string {
  return findLanguage(code)?.endonym ?? code.toUpperCase();
}
