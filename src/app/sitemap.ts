import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { getPublishedProblems } from "@/lib/queries/problems";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  "",
  "/problems",
  "/submit",
  "/venture-clienting",
  "/privacy",
  "/terms",
  "/impressum",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const problems = await getPublishedProblems();
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

  return [...staticEntries, ...problemEntries];
}
