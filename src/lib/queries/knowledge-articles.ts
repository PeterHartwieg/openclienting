import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/types/database";

/**
 * Query helpers for the `knowledge_articles` table.
 *
 * All reads go through `unstable_cache` tagged `knowledge_articles` so
 * moderation actions can bust the cache by calling
 * `updateTag("knowledge_articles")`. Locale fallback rule: when the
 * requested locale's row is missing, fall back to `en`. That preserves
 * today's behavior for German visitors on spoke pages (whose DE rows
 * were placeholder English in the old i18n file) and leaves a clean
 * seam for crowd-sourced translations — once a DE row is proposed and
 * approved, visitors see it without any code change.
 */

export type KnowledgeArticleRow =
  Database["public"]["Tables"]["knowledge_articles"]["Row"];

const FALLBACK_LOCALE = "en";

// ------------------------------------------------------------
// Full-list fetcher, cached — everything derives from this
// ------------------------------------------------------------

/**
 * Fetch all published knowledge articles. Cached because the list is
 * read by every page in the cluster plus the sitemap and llms.txt, and
 * the row count is small (dozens, not thousands).
 */
const getPublishedArticlesCached = unstable_cache(
  async (): Promise<KnowledgeArticleRow[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("status", "published")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as KnowledgeArticleRow[];
  },
  ["knowledge_articles:published"],
  { revalidate: 3600, tags: ["knowledge_articles"] },
);

export async function getAllPublishedArticles() {
  return getPublishedArticlesCached();
}

// ------------------------------------------------------------
// Per-page fetchers (locale-aware, with EN fallback)
// ------------------------------------------------------------

function pickArticle(
  articles: KnowledgeArticleRow[],
  slug: string,
  locale: string,
): KnowledgeArticleRow | null {
  const exact = articles.find((a) => a.slug === slug && a.locale === locale);
  if (exact) return exact;
  if (locale !== FALLBACK_LOCALE) {
    const fallback = articles.find(
      (a) => a.slug === slug && a.locale === FALLBACK_LOCALE,
    );
    if (fallback) return fallback;
  }
  return null;
}

/** Hub row for the given locale, falling back to `en`. */
export async function getHubArticle(
  locale: string,
): Promise<KnowledgeArticleRow | null> {
  const all = await getAllPublishedArticles();
  return pickArticle(all, "index", locale);
}

/** Spoke row for (slug, locale), falling back to `en`. */
export async function getSpokeArticle(
  slug: string,
  locale: string,
): Promise<KnowledgeArticleRow | null> {
  const all = await getAllPublishedArticles();
  const article = pickArticle(all, slug, locale);
  if (!article || article.kind !== "spoke") return null;
  return article;
}

/**
 * All spokes visible at the given locale, with locale fallback applied
 * per-slug. The hub uses this for its index list.
 */
export async function getAllSpokesForLocale(
  locale: string,
): Promise<KnowledgeArticleRow[]> {
  const all = await getAllPublishedArticles();
  const slugs = new Set(
    all.filter((a) => a.kind === "spoke").map((a) => a.slug),
  );
  const resolved: KnowledgeArticleRow[] = [];
  for (const slug of slugs) {
    const row = pickArticle(all, slug, locale);
    if (row && row.kind === "spoke") resolved.push(row);
  }
  resolved.sort((a, b) => a.sort_order - b.sort_order);
  return resolved;
}

/**
 * Slugs of every published spoke (locale-independent). Used by
 * `generateStaticParams` on the catch-all route so Next.js knows which
 * URLs to pre-render.
 */
export async function getAllPublishedSpokeSlugs(): Promise<string[]> {
  const all = await getAllPublishedArticles();
  return Array.from(
    new Set(all.filter((a) => a.kind === "spoke").map((a) => a.slug)),
  );
}

// ------------------------------------------------------------
// Tag-based sibling auto-pick
// ------------------------------------------------------------

/**
 * Tag-based "Related in this cluster" sibling picker.
 *
 * Returns the two published spokes (at the requested locale, with EN
 * fallback) that share the most tags with the given article,
 * excluding the article itself. Ties break by recency (newest first).
 * If fewer than two candidates exist, returns whatever it has.
 */
export async function getSiblingArticles(
  article: KnowledgeArticleRow,
  locale: string,
  limit = 2,
): Promise<KnowledgeArticleRow[]> {
  if (article.kind !== "spoke") return [];
  const spokes = await getAllSpokesForLocale(locale);
  const candidates = spokes
    .filter((s) => s.slug !== article.slug)
    .map((s) => {
      const overlap = s.tags.filter((t) => article.tags.includes(t)).length;
      return { article: s, overlap };
    })
    .filter((c) => c.overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return (
        new Date(b.article.updated_at).getTime() -
        new Date(a.article.updated_at).getTime()
      );
    });
  return candidates.slice(0, limit).map((c) => c.article);
}
