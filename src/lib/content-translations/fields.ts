/**
 * Per-target-type allowlist of fields that can be translated.
 *
 * The content_translations table stores its body as free-form JSONB, so the
 * shape is enforced in the application layer, not the database. This module
 * is the single source of truth: the contribution form iterates it, the
 * server action validates against it, the render-time merge helper reads
 * from it. Adding a new translatable column to an existing content type is
 * a one-line change here.
 */

import type { TranslationTargetType } from "@/lib/types/database";

export interface TranslatableFieldSpec {
  /** Column name on the source row. Must match the DB column exactly. */
  name: string;
  /** Single-line (input) vs multi-line (textarea) in the form. */
  multiline: boolean;
  /**
   * Label shown above the form field. Kept short and plain so non-technical
   * translators understand what the field represents.
   */
  label: string;
}

export const TRANSLATABLE_FIELDS: Record<
  TranslationTargetType,
  readonly TranslatableFieldSpec[]
> = {
  problem_template: [
    { name: "title", label: "Title", multiline: false },
    { name: "description", label: "Description", multiline: true },
  ],
  requirement: [{ name: "body", label: "Requirement", multiline: true }],
  pilot_framework: [
    { name: "scope", label: "Scope", multiline: true },
    { name: "suggested_kpis", label: "Suggested KPIs", multiline: true },
    { name: "success_criteria", label: "Success criteria", multiline: true },
    { name: "common_pitfalls", label: "Common pitfalls", multiline: true },
    { name: "duration", label: "Duration", multiline: false },
    { name: "resource_commitment", label: "Resource commitment", multiline: false },
  ],
  solution_approach: [
    { name: "title", label: "Title", multiline: false },
    { name: "description", label: "Description", multiline: true },
    { name: "complexity", label: "Complexity", multiline: false },
    { name: "price_range", label: "Price range", multiline: false },
  ],
} as const;

/** Human-readable label for a target type, used in moderator UI. */
export const TARGET_TYPE_LABELS: Record<TranslationTargetType, string> = {
  problem_template: "Problem",
  requirement: "Requirement",
  pilot_framework: "Pilot framework",
  solution_approach: "Solution approach",
};

/** Database table name for a target type. */
export const TARGET_TYPE_TABLES: Record<TranslationTargetType, string> = {
  problem_template: "problem_templates",
  requirement: "requirements",
  pilot_framework: "pilot_frameworks",
  solution_approach: "solution_approaches",
};

export function isTranslationTargetType(
  value: string,
): value is TranslationTargetType {
  return value in TRANSLATABLE_FIELDS;
}

/**
 * Given a source row and a translation's `fields` blob, return a new object
 * with the row's allowlisted fields replaced by their translated values.
 * Any translation field not in the allowlist is ignored (defensive — a
 * moderator could have inserted an arbitrary JSONB blob manually).
 */
export function mergeTranslation<T extends Record<string, unknown>>(
  row: T,
  targetType: TranslationTargetType,
  fields: Record<string, string> | null | undefined,
): T {
  if (!fields) return row;
  const spec = TRANSLATABLE_FIELDS[targetType];
  const merged: Record<string, unknown> = { ...row };
  for (const { name } of spec) {
    const value = fields[name];
    if (typeof value === "string" && value.trim().length > 0) {
      merged[name] = value;
    }
  }
  return merged as T;
}
