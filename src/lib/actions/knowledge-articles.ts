"use server";

import { createClient } from "@/lib/supabase/server";
import type { KnowledgeArticleFaqItem } from "@/lib/types/database";

/**
 * Submit a new knowledge article for moderator review.
 *
 * Always inserts with `status='submitted'` and `kind='spoke'`. Hubs are
 * not proposable by contributors — a moderator can only create one via
 * the migration seed or direct DB edit. The `(slug, locale)` uniqueness
 * is enforced at the DB level; if a contributor proposes a slug that
 * already exists (even in another locale), the row simply lands at
 * that `(slug, locale)` — the DB check blocks true duplicates.
 *
 * Moderator approval happens in `/[locale]/moderate` via the existing
 * `moderateItem` flow extended to accept `target_type='knowledge_articles'`.
 * The `knowledge_articles` cache tag is busted on approval so the new
 * article becomes visible immediately.
 */

interface ProposeArticleInput {
  slug: string;
  locale: string;
  title: string;
  shortLabel: string;
  lede: string;
  metaTitle: string;
  metaDescription: string;
  tldrTitle: string;
  tldr: string[];
  detailTitle: string;
  detailIntro: string;
  detailBullets: string[];
  faqTitle: string;
  faq: KnowledgeArticleFaqItem[];
  tags: string[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function proposeKnowledgeArticle(
  input: ProposeArticleInput,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sign in required" };

  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return {
      success: false,
      error: "Slug must be lowercase, hyphens-only (a-z, 0-9, -).",
    };
  }

  const title = input.title.trim();
  const lede = input.lede.trim();
  const metaTitle = input.metaTitle.trim();
  const metaDescription = input.metaDescription.trim();
  if (!title || !lede || !metaTitle || !metaDescription) {
    return {
      success: false,
      error: "Title, lede, meta title, and meta description are required.",
    };
  }

  const tldr = input.tldr.map((s) => s.trim()).filter(Boolean);
  const detailBullets = input.detailBullets.map((s) => s.trim()).filter(Boolean);
  const faq = input.faq
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
  const tags = input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);

  const { data, error } = await supabase
    .from("knowledge_articles")
    .insert({
      slug,
      locale: input.locale,
      kind: "spoke",
      title,
      short_label: input.shortLabel.trim() || null,
      lede,
      meta_title: metaTitle,
      meta_description: metaDescription,
      tldr_title: input.tldrTitle.trim() || null,
      tldr,
      detail_title: input.detailTitle.trim() || null,
      detail_intro: input.detailIntro.trim() || null,
      detail_bullets: detailBullets,
      faq_title: input.faqTitle.trim() || null,
      faq,
      sections: [],
      tags,
      status: "submitted",
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data.id };
}
