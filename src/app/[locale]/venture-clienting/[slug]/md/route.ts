import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site";
import { ventureClientingToMarkdown } from "@/lib/seo/markdown";
import { locales, type Locale } from "@/i18n/config";
import { getSpokeArticle } from "@/lib/queries/knowledge-articles";

/**
 * Markdown alternative for a venture-clienting spoke article.
 *
 * Reshapes the row's structured fields (tldr / detail / faq) into the
 * sections[] shape that `ventureClientingToMarkdown` expects, then
 * serves the result. `dateModified` comes from the row's `updated_at`
 * so moderated edits are reflected as soon as the `knowledge_articles`
 * cache tag is invalidated.
 */
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale: rawLocale, slug } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  const article = await getSpokeArticle(slug, locale);
  if (!article) return new Response("Not found", { status: 404 });

  const mt = await getTranslations({ locale, namespace: "problemDetail.markdown" });

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/venture-clienting/${article.slug}`;

  const sections: Array<{ title: string; body: string }> = [];

  if (article.tldr.length > 0) {
    sections.push({
      title: article.tldr_title ?? "TL;DR",
      body: article.tldr.map((bullet) => `- ${bullet}`).join("\n"),
    });
  }

  if (article.detail_intro || article.detail_bullets.length > 0) {
    const parts: string[] = [];
    if (article.detail_intro) parts.push(article.detail_intro);
    if (article.detail_bullets.length > 0) {
      parts.push(article.detail_bullets.map((b) => `- ${b}`).join("\n"));
    }
    sections.push({
      title: article.detail_title ?? "Details",
      body: parts.join("\n\n"),
    });
  }

  if (article.faq.length > 0) {
    sections.push({
      title: article.faq_title ?? "FAQ",
      body: article.faq
        .map((item) => `### ${item.question}\n\n${item.answer}`)
        .join("\n\n"),
    });
  }

  const md = ventureClientingToMarkdown({
    canonicalUrl,
    licenseName: mt("license"),
    updatedAt: article.updated_at,
    labels: {
      title: article.title,
      lede: article.lede,
      sections,
      source: mt("source"),
      canonical: mt("canonical"),
      license: mt("licenseLabel"),
    },
  });

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
