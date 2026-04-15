import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getPublishedProblems } from "@/lib/queries/problems";
import { getVerifiedOrganizationsDirectory } from "@/lib/queries/organizations";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  "",
  "/problems",
  "/organizations",
  "/submit",
  "/venture-clienting",
  "/venture-clienting/what-is-venture-clienting",
  "/venture-clienting/venture-clienting-vs-corporate-venture-capital",
  "/venture-clienting/startup-pilot-framework",
  "/venture-clienting/problem-template",
  "/venture-clienting/sme-open-innovation",
  "/venture-clienting/verified-success-report",
  "/privacy",
  "/terms",
  "/impressum",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [problems, organizations] = await Promise.all([
    getPublishedProblems(),
    getVerifiedOrganizationsDirectory(),
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

  return [...staticEntries, ...problemEntries, ...organizationEntries];
}
