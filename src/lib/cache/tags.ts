import { updateTag } from "next/cache";

/**
 * Central registry of cache-tag groups, keyed by domain entity.
 *
 * Each entry lists every tag that a mutation to this entity must invalidate.
 * Tags correspond 1-to-1 with the `tags` arrays on unstable_cache() calls in
 * src/lib/queries/**. Keeping both in the same codebase makes drift visible.
 *
 * Ground truth (loaders that consume each tag):
 *  problem_templates    — getAllPublishedProblemIds, getPublishedProblemForMarkdown,
 *                         getOrganizationContributions, getHomePageStats
 *  solution_approaches  — getOrganizationContributions, getHomePageStats
 *  success_reports      — getOrganizationContributions, getHomePageStats
 *  tags                 — getAllTagsCached, getPublishedProblemForMarkdown
 *  organizations        — getVerifiedOrganizationsDirectory, getVerifiedOrganizationBySlug,
 *                         getOrganizationContributions
 *  knowledge_articles   — getPublishedArticlesCached
 *  moderation_events    — getModerationHistoryFor
 *  featured_success_report — getFeaturedStory
 *  content_translations — no unstable_cache reader today (getPublishedTranslations uses
 *                         React.cache per-request); kept for forward-compatibility and
 *                         because approveTranslation already calls updateTag on it.
 *
 * Notes on empty-entry entities:
 *  comment       — no unstable_cache reader; getCommentsFor uses React.cache per-request
 *  notification  — no unstable_cache reader; getDashboardOverview uses React.cache
 *  account       — profiles table has no standalone unstable_cache reader
 *                  (display_name/avatar embedded in problem_templates join; mutations that
 *                   affect visible cached fields should use "problem" entity instead)
 */
export const CACHE_TAGS = {
  // Domain entities → tags to bust on any mutation
  problem: ["problem_templates", "moderation_events"],
  solution: ["solution_approaches", "moderation_events"],
  success_report: ["success_reports", "moderation_events"],
  knowledge_article: ["knowledge_articles", "moderation_events"],
  // requirements and pilot_frameworks live as child joins on problem detail pages;
  // the getPublishedProblemForMarkdown loader joins them without child-status filter,
  // so any insert/update on these tables must bust problem_templates.
  requirement: ["problem_templates", "moderation_events"],
  pilot_framework: ["problem_templates", "moderation_events"],
  organization: ["organizations", "moderation_events"],
  // organization_membership has no cached loader; entry kept as documentation
  // that this was explicitly evaluated (see allowlist in cache-tags.test.ts).
  // content_translations: getPublishedTranslations uses React.cache (per-request),
  // not unstable_cache, so there is no persistent cache to bust for the
  // content_translations table itself. We bust the parent entity caches
  // (problem_templates / solution_approaches) since those list queries embed
  // translated titles/descriptions when a translation is approved.
  translation: [
    "problem_templates",
    "solution_approaches",
  ],
  tag: ["tags", "problem_templates"],
  featured_success_report: ["featured_success_report"],
  // For mutations that only affect the moderation audit trail (e.g. approving
  // a suggested_edit meta-status without changing live content) without touching
  // any specific content-domain entity.
  moderation_event: ["moderation_events"],
  // suggested_edit has no cached loader in submitted state; on apply the
  // caller should use the entity being edited (problem/solution/etc).
} as const;

export type CacheEntity = keyof typeof CACHE_TAGS;

/**
 * Invalidate all cache tags associated with the given domain entity.
 * Use this in server actions immediately after a successful mutation.
 *
 * Calls updateTag (Next.js 15 API) for each tag in the registry.
 */
export function invalidateFor(entity: CacheEntity): void {
  for (const tag of CACHE_TAGS[entity]) {
    updateTag(tag);
  }
}

/**
 * Multi-entity helper for mutations that legitimately cross domain boundaries
 * (e.g. approving a problem cascades to its child solutions and knowledge).
 * Deduplicates tags so each revalidateTag call happens exactly once.
 */
export function invalidateForMany(entities: readonly CacheEntity[]): void {
  const seen = new Set<string>();
  for (const entity of entities) {
    for (const tag of CACHE_TAGS[entity]) {
      if (!seen.has(tag)) {
        seen.add(tag);
        updateTag(tag);
      }
    }
  }
}
