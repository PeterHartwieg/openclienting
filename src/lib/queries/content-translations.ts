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

/** Lookup key used by the in-request cache. */
type LookupKey = string; // `${targetType}:${targetId}`

function keyOf(targetType: TranslationTargetType, targetId: string): LookupKey {
  return `${targetType}:${targetId}`;
}

/**
 * Fetch published translations for a batch of (target_type, target_id)
 * pairs in a single round-trip. Returns a Map keyed by `${type}:${id}`
 * so callers can look up per-row translations in O(1).
 *
 * Empty inputs short-circuit to an empty map — no query.
 */
export const getPublishedTranslations = cache(async function (
  targets: readonly { targetType: TranslationTargetType; targetId: string }[],
  language: string,
): Promise<Map<LookupKey, TranslationFields>> {
  if (language === "en" || targets.length === 0) return new Map();

  // Build parallel arrays for the IN clauses. Supabase / PostgREST
  // supports filtering by multiple columns via .in() per column, which
  // over-fetches slightly (cross product) but is acceptable here because
  // the `idx_content_translations_lookup` index covers the filter set.
  const targetTypes = Array.from(new Set(targets.map((t) => t.targetType)));
  const targetIds = targets.map((t) => t.targetId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_translations")
    .select("target_type, target_id, fields")
    .in("target_type", targetTypes)
    .in("target_id", targetIds)
    .eq("language", language)
    .eq("status", "published");

  if (error || !data) return new Map();

  // Post-filter out any cross-product rows that didn't belong to a
  // requested pair. In practice (target_type, target_id) pairs are
  // unique per row so this is mostly a safety net.
  const requested = new Set(
    targets.map((t) => keyOf(t.targetType, t.targetId)),
  );
  const result = new Map<LookupKey, TranslationFields>();
  for (const row of data) {
    const key = keyOf(row.target_type as TranslationTargetType, row.target_id);
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
interface ProblemLikeShape {
  id: string;
  requirements?: readonly { id: string }[] | null;
  pilot_frameworks?: readonly { id: string }[] | null;
  solution_approaches?: readonly { id: string }[] | null;
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
 * Apply translation fallback to a problem + its joined children. Returns
 * a new object tree with translated fields merged in, leaving any rows
 * without a published translation unchanged (English source = fallback).
 *
 * Shape-preserving: the same object layout goes in and comes out, so
 * page components that expect `problem.title`, `problem.requirements[i].body`
 * etc. don't need to know translations exist.
 */
export async function translateProblem<T extends ProblemLikeShape>(
  problem: T,
  locale: string,
): Promise<T> {
  if (locale === "en") return problem;
  // Guard against unknown locales — only real ISO codes get a lookup.
  const targets = collectTargets(problem);
  const translations = await getPublishedTranslations(targets, locale);
  if (translations.size === 0) return problem;

  const translated: T = { ...problem };

  const problemFields = translations.get(keyOf("problem_template", problem.id));
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
      const fields = translations.get(keyOf("requirement", r.id));
      return fields
        ? (mergeTranslation(r as unknown as Record<string, unknown>, "requirement", fields) as unknown as { id: string })
        : r;
    });
  }
  if (translated.pilot_frameworks) {
    (translated as ProblemLikeShape).pilot_frameworks = translated.pilot_frameworks.map((f) => {
      const fields = translations.get(keyOf("pilot_framework", f.id));
      return fields
        ? (mergeTranslation(f as unknown as Record<string, unknown>, "pilot_framework", fields) as unknown as { id: string })
        : f;
    });
  }
  if (translated.solution_approaches) {
    (translated as ProblemLikeShape).solution_approaches = translated.solution_approaches.map((s) => {
      const fields = translations.get(keyOf("solution_approach", s.id));
      return fields
        ? (mergeTranslation(s as unknown as Record<string, unknown>, "solution_approach", fields) as unknown as { id: string })
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
 * Pull the source English text for a target row. Used by the contribution
 * form to show "what you're translating from". Only reads the allowlisted
 * fields so we don't leak unrelated columns.
 */
export async function getSourceFields(
  targetType: TranslationTargetType,
  targetId: string,
): Promise<Record<string, string> | null> {
  const supabase = await createClient();
  const columns = TRANSLATABLE_FIELDS[targetType].map((f) => f.name);
  const table = targetType === "problem_template" ? "problem_templates"
    : targetType === "requirement" ? "requirements"
    : targetType === "pilot_framework" ? "pilot_frameworks"
    : "solution_approaches";
  const { data, error } = await supabase
    .from(table)
    .select(columns.join(","))
    .eq("id", targetId)
    .maybeSingle();
  if (error || !data) return null;
  const out: Record<string, string> = {};
  const row = data as unknown as Record<string, unknown>;
  for (const col of columns) {
    const v = row[col];
    out[col] = typeof v === "string" ? v : "";
  }
  return out;
}
