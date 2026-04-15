import { getTranslations } from "next-intl/server";
import {
  getVerifiedOrganizationBySlug,
  getOrganizationContributions,
} from "@/lib/queries/organizations";
import { getSiteUrl } from "@/lib/site";
import { organizationToMarkdown } from "@/lib/seo/markdown";
import { locales, type Locale } from "@/i18n/config";

/**
 * Markdown alternative for a public organization profile.
 *
 * Exposed at `/{locale}/organizations/{slug}/md`. Advertised to answer-engine
 * crawlers via `public/llms.txt` and via a `<link rel="alternate"
 * type="text/markdown">` rendered in the HTML profile page.
 *
 * Caching is layered exactly the same way as `problems/[id]/md`:
 *
 *   1. Edge: `s-maxage=3600` + `stale-while-revalidate=86400`. Vercel holds
 *      the response at the CDN for an hour and strips the `s-maxage`
 *      directive from the downstream header so browsers still see
 *      `public, max-age=0`.
 *   2. Data layer: `getVerifiedOrganizationBySlug` and
 *      `getOrganizationContributions` are both wrapped in `unstable_cache`
 *      with tagged cache keys so time-based revalidation bounds DB round-
 *      trips even on edge cache misses.
 *
 * Anonymity: not applicable here. The query already filters every row by
 * `is_org_anonymous = false`, and profiles only exist for verified orgs
 * whose identity is public by definition.
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

  const org = await getVerifiedOrganizationBySlug(slug);
  if (!org) {
    return new Response("Not found", { status: 404 });
  }

  const contributions = await getOrganizationContributions(org.id);
  const mt = await getTranslations({
    locale,
    namespace: "organizations.markdown",
  });

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/organizations/${slug}`;

  const md = organizationToMarkdown(
    {
      name: org.name,
      slug: org.slug,
      description: org.description,
      website: org.website,
      employeeCount: org.employee_count,
      verificationStatus: org.verification_status,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    },
    {
      canonicalUrl,
      licenseName: mt("licenseName"),
      siteUrl,
      locale,
      problems: contributions.problems.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        solution_status: p.solution_status,
      })),
      solutionApproaches: contributions.solutionApproaches.map((sa) => ({
        id: sa.id,
        title: sa.title,
        description: sa.description,
        technology_type: sa.technology_type,
        maturity: sa.maturity,
        problem_id: sa.problem_id,
        problem_title: sa.problem_title,
      })),
      verifiedSuccessReports: contributions.verifiedSuccessReports.map((r) => ({
        id: r.id,
        report_summary: r.report_summary,
        solution_approach_title: r.solution_approach_title,
        problem_id: r.problem_id,
        problem_title: r.problem_title,
      })),
      labels: {
        website: mt("website"),
        employees: mt("employees"),
        verified: mt("verified"),
        problems: mt("problems"),
        problemsEmpty: mt("problemsEmpty"),
        solutionApproaches: mt("solutionApproaches"),
        solutionApproachesEmpty: mt("solutionApproachesEmpty"),
        verifiedOutcomes: mt("verifiedOutcomes"),
        verifiedOutcomesEmpty: mt("verifiedOutcomesEmpty"),
        source: mt("source"),
        canonical: mt("canonical"),
        license: mt("license"),
        about: mt("about"),
        inProblem: mt("inProblem"),
      },
    },
  );

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "index, follow",
    },
  });
}
