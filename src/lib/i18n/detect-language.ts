import { franc } from "franc-min";
import { LANGUAGE_CODES } from "@/i18n/languages";

/**
 * Server-side source-language detection for user-submitted content.
 *
 * Used at submission time so every piece of content has an explicit
 * `source_language` stamp instead of being silently assumed English.
 * The render path then uses that to decide whether to look up a
 * translation at all (if the requested locale === source language,
 * we short-circuit).
 *
 * Implementation notes:
 *  - `franc-min` returns ISO 639-3 codes. We map back to the 30 ISO
 *    639-1 codes this platform supports. Languages outside that set
 *    fall back to "en" — the site is English-first and anything we
 *    can't route is most useful to moderators in English context.
 *  - Short strings (< ~30 chars of word material) are unreliable for
 *    statistical detection, so we fall back to "en" below a length
 *    threshold. Most real content is well above this.
 *  - `franc`'s `only` option restricts candidates to a specific set,
 *    which both speeds up detection and keeps off-list languages from
 *    producing false positives.
 */

/**
 * Mapping from franc's ISO 639-3 output back to our supported ISO
 * 639-1 codes. Only languages we actually route are included — any
 * detection result outside this map becomes "en".
 */
const ISO_639_3_TO_1: Record<string, string> = {
  eng: "en",
  deu: "de",
  spa: "es",
  fra: "fr",
  cmn: "zh", // Mandarin — franc's output for Chinese
  arb: "ar", // Standard Arabic
  por: "pt",
  rus: "ru",
  jpn: "ja",
  hin: "hi",
  ita: "it",
  nld: "nl",
  pol: "pl",
  tur: "tr",
  kor: "ko",
  swe: "sv",
  dan: "da",
  nob: "no", // Norwegian Bokmål — dominant written form
  nno: "no", // Norwegian Nynorsk — also maps to "no"
  fin: "fi",
  ces: "cs",
  ell: "el",
  heb: "he",
  hun: "hu",
  ron: "ro",
  ukr: "uk",
  vie: "vi",
  ind: "id",
  tha: "th",
  ben: "bn",
  swh: "sw", // Swahili
};

/** Franc needs the ISO 639-3 candidate list for its `only` filter. */
const FRANC_ALLOWLIST = Object.keys(ISO_639_3_TO_1);

/**
 * Minimum meaningful character count for statistical detection.
 * Below this we can't reliably distinguish short phrases like
 * "Test Problem" from any of dozens of languages, so we return "en"
 * rather than guess.
 */
const MIN_CHARS_FOR_DETECTION = 40;

/**
 * Detect the source language of a block of user-submitted text.
 *
 * Concatenate all the text fields you care about (title, description,
 * body, etc.) and pass them in. Returns an ISO 639-1 code from the
 * platform's 30-language allowlist. Falls back to `"en"` when the text
 * is too short to classify, or when detected as a language this
 * platform doesn't route.
 */
export function detectLanguage(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < MIN_CHARS_FOR_DETECTION) {
    return "en";
  }

  const detected = franc(trimmed, { only: FRANC_ALLOWLIST });

  // Franc returns "und" (undetermined) when it can't classify.
  if (detected === "und") {
    return "en";
  }

  const mapped = ISO_639_3_TO_1[detected];
  if (!mapped) {
    return "en";
  }

  // Defensive: ensure the mapped code is still in the platform's active
  // list (in case ISO_639_3_TO_1 is out of sync with LANGUAGE_CODES).
  if (!LANGUAGE_CODES.includes(mapped)) {
    return "en";
  }

  return mapped;
}
