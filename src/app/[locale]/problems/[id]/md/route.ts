import { getTranslations } from "next-intl/server";
import { getProblemById } from "@/lib/queries/problems";
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
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale: rawLocale, id } = await params;
  if (!(locales as readonly string[]).includes(rawLocale)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = rawLocale as Locale;

  let problem;
  try {
    problem = await getProblemById(id);
  } catch {
    return new Response("Not found", { status: 404 });
  }
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
      // Crawlers don't need fresher data than the HTML page shows.
      // `s-maxage` lets Vercel's edge cache hold it for an hour with SWR
      // revalidation for a day, absorbing bursts without DB hits.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
