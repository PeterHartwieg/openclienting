import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TranslationTargetType, TranslationFields } from "@/lib/types/database";
import {
  TRANSLATABLE_FIELDS,
  mergeTranslation,
} from "@/lib/content-translations/fields";

/**
 * Query + merge helpers for the `content_translations` table.
 *
 * The render path is: page component calls `translateProblem(problem, locale)`
 * after fetching from `getProblemById`, which does a single batched lookup
 * for every translatable row on that page and merges the matching fields
 * back onto the rows. Components stay locale-agnostic.
 *
 * Cached at the React request level (same request → one query) via
 * `cache()` because problem detail pages fetch once per request anyway
 * and we don't want to hit Supabase twice for metadata + page body.
 */

/** Lookup key used by the in-request cache — includes language for per-language storage. */
type LookupKey = string; // `${targetType}:${targetId}:${language}`

function keyOf(
  targetType: TranslationTargetType,
  targetId: string,
  language: string,
): LookupKey {
  return `${targetType}:${targetId}:${language}`;
}

/**
 * Fetch published translations for a batch of (target_type, target_id)
 * pairs across one or more languages in a single round-trip. Returns a
 * Map keyed by `${type}:${id}:${language}` so callers can look up
 * per-row, per-language translations in O(1).
 *
 * Accepts multiple languages so a single query can fetch both the
 * requested locale AND English — needed for the fallback chain on rows
 * whose source language is neither of those.
 *
 * Empty inputs short-circuit to an empty map — no query.
 */
export const getPublishedTranslations = cache(async function (
  targets: readonly { targetType: TranslationTargetType; targetId: string }[],
  languages: readonly string[],
): Promise<Map<LookupKey, TranslationFields>> {
  if (targets.length === 0 || languages.length === 0) return new Map();

  // Build parallel arrays for the IN clauses. Supabase / PostgREST
  // supports filtering by multiple columns via .in() per column, which
  // over-fetches slightly (cross product) but is acceptable here because
  // the `idx_content_translations_lookup` index covers the filter set.
  const targetTypes = Array.from(new Set(targets.map((t) => t.targetType)));
  const targetIds = targets.map((t) => t.targetId);
  const uniqueLanguages = Array.from(new Set(languages));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_translations")
    .select("target_type, target_id, language, fields")
    .in("target_type", targetTypes)
    .in("target_id", targetIds)
    .in("language", uniqueLanguages)
    .eq("status", "published");

  if (error || !data) return new Map();

  // Post-filter out any cross-product rows that didn't belong to a
  // requested pair. In practice (target_type, target_id, language) is
  // unique per published row so this is mostly a safety net.
  const requested = new Set(
    targets.flatMap((t) =>
      uniqueLanguages.map((l) => keyOf(t.targetType, t.targetId, l)),
    ),
  );
  const result = new Map<LookupKey, TranslationFields>();
  for (const row of data) {
    const key = keyOf(
      row.target_type as TranslationTargetType,
      row.target_id,
      row.language as string,
    );
    if (requested.has(key)) {
      result.set(key, row.fields as TranslationFields);
    }
  }
  return result;
});

/**
 * Enumerate every (targetType, targetId) pair inside a problem's joined
 * tree so `getPublishedTranslations` can fetch them all in one query.
 * Extensible: when we add a new child relation to the problem join, list
 * it here and the translations path picks it up automatically.
 */
interface ProblemChildShape {
  id: string;
  source_language?: string | null;
}
interface ProblemLikeShape {
  id: string;
  source_language?: string | null;
  requirements?: readonly ProblemChildShape[] | null;
  pilot_frameworks?: readonly ProblemChildShape[] | null;
  solution_approaches?: readonly ProblemChildShape[] | null;
}

function collectTargets(problem: ProblemLikeShape) {
  const targets: { targetType: TranslationTargetType; targetId: string }[] = [
    { targetType: "problem_template", targetId: problem.id },
  ];
  for (const r of problem.requirements ?? []) {
    targets.push({ targetType: "requirement", targetId: r.id });
  }
  for (const f of problem.pilot_frameworks ?? []) {
    targets.push({ targetType: "pilot_framework", targetId: f.id });
  }
  for (const s of problem.solution_approaches ?? []) {
    targets.push({ targetType: "solution_approach", targetId: s.id });
  }
  return targets;
}

/**
 * Per-row fallback resolver. Returns the best (language, fields) we have
 * for a given row, given its own source language and the requested locale:
 *
 *  1. If `locale === row.source_language` → no translation needed, use source
 *  2. Else try `(row, locale)` translation → use if present
 *  3. Else if `source_language !== 'en'` → try `(row, 'en')` translation
 *  4. Else leave row as-is (source is the only thing we have)
 *
 * This keeps an English problem readable when a user visits `/de/...` with
 * no German translation yet, AND keeps a German-source problem readable for
 * an Italian visitor (who gets English as a second-choice language the
 * rest of the world tends to understand).
 */
function resolveRowTranslation(
  targetType: TranslationTargetType,
  targetId: string,
  sourceLanguage: string,
  locale: string,
  translations: Map<LookupKey, TranslationFields>,
): TranslationFields | null {
  if (locale === sourceLanguage) return null;
  const direct = translations.get(keyOf(targetType, targetId, locale));
  if (direct) return direct;
  if (sourceLanguage !== "en") {
    const englishFallback = translations.get(keyOf(targetType, targetId, "en"));
    if (englishFallback) return englishFallback;
  }
  return null;
}

/**
 * Apply translation fallback to a problem + its joined children. Returns
 * a new object tree with translated fields merged in. Rows respect their
 * own `source_language`, so a problem written in German stays German when
 * the visitor is German and falls back to its English translation (if any)
 * for every other locale.
 *
 * Shape-preserving: the same object layout goes in and comes out, so
 * page components that expect `problem.title`, `problem.requirements[i].body`
 * etc. don't need to know translations exist.
 */
export async function translateProblem<T extends ProblemLikeShape>(
  problem: T,
  locale: string,
): Promise<T> {
  const targets = collectTargets(problem);

  // We need both the requested locale AND English to cover the fallback
  // chain for non-English-source rows. One query, two languages.
  const languages =
    locale === "en" ? ["en"] : Array.from(new Set([locale, "en"]));
  const translations = await getPublishedTranslations(targets, languages);

  // Early exit only if NOTHING is translated anywhere AND the problem's
  // own source matches the locale — otherwise we still need the walk to
  // pick up child rows whose source language differs from the parent.
  if (translations.size === 0 && (problem.source_language ?? "en") === locale) {
    return problem;
  }

  const translated: T = { ...problem };

  const problemSource = problem.source_language ?? "en";
  const problemFields = resolveRowTranslation(
    "problem_template",
    problem.id,
    problemSource,
    locale,
    translations,
  );
  if (problemFields) {
    Object.assign(
      translated,
      mergeTranslation(
        problem as unknown as Record<string, unknown>,
        "problem_template",
        problemFields,
      ),
    );
  }

  if (translated.requirements) {
    (translated as ProblemLikeShape).requirements = translated.requirements.map((r) => {
      const src = r.source_language ?? "en";
      const fields = resolveRowTranslation("requirement", r.id, src, locale, translations);
      return fields
        ? (mergeTranslation(r as unknown as Record<string, unknown>, "requirement", fields) as unknown as ProblemChildShape)
        : r;
    });
  }
  if (translated.pilot_frameworks) {
    (translated as ProblemLikeShape).pilot_frameworks = translated.pilot_frameworks.map((f) => {
      const src = f.source_language ?? "en";
      const fields = resolveRowTranslation("pilot_framework", f.id, src, locale, translations);
      return fields
        ? (mergeTranslation(f as unknown as Record<string, unknown>, "pilot_framework", fields) as unknown as ProblemChildShape)
        : f;
    });
  }
  if (translated.solution_approaches) {
    (translated as ProblemLikeShape).solution_approaches = translated.solution_approaches.map((s) => {
      const src = s.source_language ?? "en";
      const fields = resolveRowTranslation("solution_approach", s.id, src, locale, translations);
      return fields
        ? (mergeTranslation(s as unknown as Record<string, unknown>, "solution_approach", fields) as unknown as ProblemChildShape)
        : s;
    });
  }

  return translated;
}

/**
 * Fetch a single row's current published translations for all languages
 * (used by "manage translations" views). Returns a map of language → fields.
 */
export async function getAllPublishedTranslationsForTarget(
  targetType: TranslationTargetType,
  targetId: string,
): Promise<Map<string, TranslationFields>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_translations")
    .select("language, fields")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "published");
  if (error || !data) return new Map();
  return new Map(data.map((r) => [r.language, r.fields as TranslationFields]));
}

/**
 * Pull the source text for a target row along with its detected source
 * language. Used by the contribution form to show "what you're translating
 * from" and to label the source column with its actual language. Only
 * reads the allowlisted fields so we don't leak unrelated columns.
 */
export async function getSourceFields(
  targetType: TranslationTargetType,
  targetId: string,
): Promise<{ fields: Record<string, string>; sourceLanguage: string } | null> {
  const supabase = await createClient();
  const columns = TRANSLATABLE_FIELDS[targetType].map((f) => f.name);
  const selectColumns = [...columns, "source_language"].join(",");
  const table = targetType === "problem_template" ? "problem_templates"
    : targetType === "requirement" ? "requirements"
    : targetType === "pilot_framework" ? "pilot_frameworks"
    : "solution_approaches";
  const { data, error } = await supabase
    .from(table)
    .select(selectColumns)
    .eq("id", targetId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as Record<string, unknown>;
  const fields: Record<string, string> = {};
  for (const col of columns) {
    const v = row[col];
    fields[col] = typeof v === "string" ? v : "";
  }
  const sourceLanguage =
    typeof row.source_language === "string" && row.source_language
      ? row.source_language
      : "en";
  return { fields, sourceLanguage };
}
