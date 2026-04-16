import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getAllPublishedProblemIds } from "@/lib/queries/problems";
import { getVerifiedOrganizationsDirectory } from "@/lib/queries/organizations";
import { getAllPublishedArticles } from "@/lib/queries/knowledge-articles";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  "",
  "/problems",
  "/organizations",
  "/submit",
  "/venture-clienting",
  "/privacy",
  "/terms",
  "/impressum",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [problems, organizations, knowledgeArticles] = await Promise.all([
    getAllPublishedProblemIds(),
    getVerifiedOrganizationsDirectory(),
    getAllPublishedArticles(),
  ]);
  const now = new Date();

  const staticEntries = locales.flatMap((locale) =>
    publicRoutes.map((path) => ({
      url: new URL(`/${locale}${path}`, siteUrl).toString(),
      lastModified: now,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
    })),
  );

  const problemEntries = locales.flatMap((locale) =>
    problems.map((problem) => ({
      url: new URL(`/${locale}/problems/${problem.id}`, siteUrl).toString(),
      lastModified: problem.updated_at ? new Date(problem.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  // Every verified org gets a canonical entry per locale. Priority matches
  // problem detail pages — profiles are first-class citation targets. The
  // Markdown alternative at `/{locale}/organizations/{slug}/md` is NOT in
  // the sitemap; LLM crawlers follow the `<link rel="alternate">` hint.
  const organizationEntries = locales.flatMap((locale) =>
    organizations.map((org) => ({
      url: new URL(
        `/${locale}/organizations/${org.slug}`,
        siteUrl,
      ).toString(),
      lastModified: org.updated_at ? new Date(org.updated_at) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  // Knowledge articles live in the DB under /{locale}/venture-clienting/{slug}.
  // The hub (slug='index') is already covered by `/venture-clienting` in the
  // static routes, so we skip it here and only emit spoke entries at their
  // row-native locale. No cross-locale fan-out: a de row gets a de URL, an
  // en row gets an en URL. The hub page itself derives alternates from
  // `getLanguageAlternates`, which is enough for the locale switcher.
  const knowledgeEntries = knowledgeArticles
    .filter((a) => a.kind === "spoke")
    .map((article) => ({
      url: new URL(
        `/${article.locale}/venture-clienting/${article.slug}`,
        siteUrl,
      ).toString(),
      lastModified: new Date(article.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [
    ...staticEntries,
    ...problemEntries,
    ...organizationEntries,
    ...knowledgeEntries,
  ];
}
