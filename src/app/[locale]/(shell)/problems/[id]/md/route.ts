import { getTranslations } from "next-intl/server";
import { getPublishedProblemForMarkdown } from "@/lib/queries/problems";
import { getSiteUrl } from "@/lib/site";
import { getTagLabel } from "@/lib/i18n/tags";
import { problemToMarkdown, type ResolvedTag } from "@/lib/seo/markdown";
import { locales, type Locale } from "@/i18n/config";

/**
 * Markdown alternative for a single problem detail page.
 *
 * Exposed at `/{locale}/problems/{id}/md`. Advertised to LLM crawlers via
 * `llms.txt` and via an `<link rel="alternate" type="text/markdown">` on the
 * HTML problem page (see `page.metadata.ts`). NOT added to the sitemap —
 * search engines should index the HTML canonical, the Markdown is a per-row
 * anonymity-gated mirror for answer engines.
 *
 * Anonymity gate: `problemToMarkdown` applies the per-row flags
 * (`is_publicly_anonymous` / `is_org_anonymous`) independently to the
 * top-level problem and every nested entity. This handler does NOT do any
 * top-level anonymity short-circuit — mixing named and anonymous rows under
 * one problem is a supported case and must render correctly.
 *
 * Caching is layered:
 *   1. Edge: the `s-maxage=3600` in the response `Cache-Control` header
 *      tells Vercel's CDN to hold the response for an hour. Vercel strips
 *      `s-maxage` from the downstream header so browsers see
 *      `public, max-age=0` and don't cache — while the edge still serves
 *      `x-vercel-cache: HIT` for repeat crawler requests. This is the
 *      actual caching that saves DB round-trips for answer-engine crawlers.
 *   2. Data layer: `getPublishedProblemForMarkdown` wraps the Supabase
 *      query in `unstable_cache` with a 1h window, so any cache miss at
 *      the edge lands on a function invocation that still shares one DB
 *      round-trip with concurrent misses. Shares the
 *      `["problem_templates", "tags"]` cache tags with
 *      `getPublishedProblemsCached` so existing revalidation
 *      (on problem publish/edit) busts both caches together.
 *
 * `revalidate = 3600` below is ignored for this route (the proxy middleware
 * runs Supabase session refresh which reads cookies, marking downstream
 * routes dynamic), but is kept as a signal of intent.
 */
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale: rawLocale, id } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  const problem = await getPublishedProblemForMarkdown(id);
  if (!problem) {
    return new Response("Not found", { status: 404 });
  }

  const t = await getTranslations({ locale, namespace: "problemDetail" });
  const mt = await getTranslations({ locale, namespace: "problemDetail.markdown" });

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/problems/${id}`;

  // Resolve tags once at the handler boundary so the pure builder has no
  // dependency on next-intl or `getTagLabel`.
  const tags: ResolvedTag[] = (problem.problem_tags ?? [])
    .map((pt: { tags: { name: string; name_de?: string | null; slug: string } | null }) => pt.tags)
    .filter((tag: { name: string; name_de?: string | null; slug: string } | null): tag is {
      name: string;
      name_de?: string | null;
      slug: string;
    } => !!tag)
    .map((tag: { name: string; name_de?: string | null; slug: string }) => ({
      label: getTagLabel(tag, locale),
      slug: tag.slug,
    }));

  const md = problemToMarkdown(problem, {
    canonicalUrl,
    licenseName: mt("license"),
    tags,
    labels: {
      anonymous: t("anonymous"),
      unknown: t("unknown"),
      author: mt("author"),
      organization: mt("organization"),
      description: t("description"),
      requirements: t("requirements"),
      requirementsEmpty: mt("requirementsEmpty"),
      pilotFrameworks: t("pilotFrameworks"),
      pilotFrameworksEmpty: mt("pilotFrameworksEmpty"),
      solutionApproaches: t("approaches"),
      solutionApproachesEmpty: mt("solutionApproachesEmpty"),
      verifiedOutcomes: t("verifiedOutcomesHeading"),
      source: mt("source"),
      canonical: mt("canonical"),
      license: mt("licenseLabel"),
      upvotes: mt("upvotes"),
      technology: mt("technology"),
      maturity: mt("maturity"),
      complexity: mt("complexity"),
      price: mt("price"),
      scope: mt("scope"),
      duration: mt("duration"),
      suggestedKpis: mt("suggestedKpis"),
      successCriteria: mt("successCriteria"),
      commonPitfalls: mt("commonPitfalls"),
      resourceCommitment: mt("resourceCommitment"),
      pilotPeriod: mt("pilotPeriod"),
      deploymentScope: mt("deploymentScope"),
      kpiSummary: mt("kpiSummary"),
      evidenceNotes: mt("evidenceNotes"),
    },
  });

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // `s-maxage` is the operative directive: Vercel's edge caches for
      // an hour with a day of stale-while-revalidate. `max-age=0` keeps
      // browsers from caching the response locally. Vercel strips
      // `s-maxage` from the downstream header, so browsers see
      // `public, max-age=0` while the edge still serves HITs.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
