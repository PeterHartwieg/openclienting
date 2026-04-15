import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site";
import { ventureClientingToMarkdown } from "@/lib/seo/markdown";
import { locales, type Locale } from "@/i18n/config";

/**
 * Markdown alternative for the venture-clienting explainer page.
 *
 * Exposed at `/{locale}/venture-clienting/md`. Mirrors the same
 * `ventureClienting.*` i18n namespace the HTML page reads so the prose stays
 * in lockstep with what human visitors see — no separate copy to maintain.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  const t = await getTranslations({ locale, namespace: "ventureClienting" });
  const mt = await getTranslations({ locale, namespace: "problemDetail.markdown" });

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/venture-clienting`;

  const md = ventureClientingToMarkdown({
    canonicalUrl,
    licenseName: mt("license"),
    // Build time is good enough — the page is editorial content, not
    // user-generated, so it changes with deploys.
    updatedAt: new Date().toISOString(),
    labels: {
      title: t("title"),
      lede: t("lede"),
      sections: [
        { title: t("section1Title"), body: t("section1Body") },
        { title: t("section2Title"), body: t("section2Body") },
        { title: t("section3Title"), body: t("section3Body") },
        { title: t("section4Title"), body: t("section4Body") },
        { title: t("section5Title"), body: t("section5Body") },
      ],
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
