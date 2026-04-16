import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site";
import { ventureClientingToMarkdown } from "@/lib/seo/markdown";
import { locales, type Locale } from "@/i18n/config";
import { getHubArticle } from "@/lib/queries/knowledge-articles";

/**
 * Markdown alternative for the venture-clienting hub page.
 *
 * Serves the hub row from `knowledge_articles` as Markdown so LLM
 * crawlers get the same prose as the HTML page, with a canonical
 * pointer back. The `dateModified` is the row's `updated_at`, so
 * moderated edits are reflected in the markdown output as soon as
 * the unstable_cache tag is invalidated.
 */
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  const article = await getHubArticle(locale);
  if (!article) return new Response("Not found", { status: 404 });

  const mt = await getTranslations({ locale, namespace: "problemDetail.markdown" });

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/venture-clienting`;

  const md = ventureClientingToMarkdown({
    canonicalUrl,
    licenseName: mt("license"),
    updatedAt: article.updated_at,
    labels: {
      title: article.title,
      lede: article.lede,
      sections: article.sections,
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
