import { getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site";
import { locales, type Locale } from "@/i18n/config";
import { buildSpokeMarkdown } from "@/lib/venture-clienting-cluster/spoke-markdown";
import { getSpokeById } from "@/lib/venture-clienting-cluster/config";

/**
 * Markdown alternative for the "What is venture clienting?" spoke.
 *
 * Exposed at `/{locale}/venture-clienting/what-is-venture-clienting/md`.
 * Cache model matches the hub's Markdown route: CDN-side 1h revalidation,
 * build-time `updated` stamp (content only changes on deploy).
 */
export const revalidate = 3600;

const spoke = getSpokeById("whatIsVentureClienting");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale: rawLocale } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  const tSpoke = await getTranslations({
    locale,
    namespace: `ventureClientingCluster.${spoke.i18nKey}`,
  });
  const tMd = await getTranslations({
    locale,
    namespace: "problemDetail.markdown",
  });

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/venture-clienting/${spoke.slug}`;

  const md = buildSpokeMarkdown({
    spoke,
    canonicalUrl,
    updatedAt: new Date().toISOString(),
    tSpoke,
    tMd,
    licenseName: tMd("license"),
  });

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
