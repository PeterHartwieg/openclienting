import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getVerifiedOrganizationBySlug,
  getOrganizationContributions,
} from "@/lib/queries/organizations";
import { getLanguageAlternates } from "@/lib/site";
import { getSchemaSiteContext } from "@/lib/seo/site-context";
import { organizationProfileSchema } from "@/lib/seo/schema";
import { getOrgSizeTier, cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const org = await getVerifiedOrganizationBySlug(slug);
  const t = await getTranslations({ locale, namespace: "organizations" });
  if (!org) {
    return {
      title: t("notFound"),
    };
  }
  return {
    title: t("profileMetaTitle", { name: org.name }),
    description:
      org.description && org.description.trim().length > 0
        ? org.description
        : t("profileMetaDescription", { name: org.name }),
    alternates: getLanguageAlternates(locale, `/organizations/${slug}`),
  };
}

const tierColors: Record<string, string> = {
  Micro: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Small:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  Medium:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Large:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const org = await getVerifiedOrganizationBySlug(slug);
  if (!org) notFound();

  const contributions = await getOrganizationContributions(org.id);
  const t = await getTranslations({ locale, namespace: "organizations" });
  const bt = await getTranslations({ locale, namespace: "breadcrumbs" });

  const siteCtx = getSchemaSiteContext();
  const canonicalPath = `/${locale}/organizations/${slug}`;
  const profileUrl = `${siteCtx.siteUrl}${canonicalPath}`;
  const tier = getOrgSizeTier(org.employee_count);
  const mdUrl = `${canonicalPath}/md`;

  // Schema.org Organization payload — only fields that correspond to
  // something visible on the hero are emitted.
  const orgSchema = organizationProfileSchema({
    name: org.name,
    profileUrl,
    description: org.description,
    website: org.website,
    logoUrl: org.logo_url,
    employeeCount: org.employee_count,
    verificationLabel: `Verified by ${siteCtx.siteName}`,
  });

  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: bt("organizations"), url: `/${locale}/organizations` },
    { name: org.name, url: canonicalPath },
  ];

  const { problems, solutionApproaches, verifiedSuccessReports } = contributions;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={orgSchema} />
      {/* Markdown alternative — advertised to LLM crawlers via alternate link. */}
      <link rel="alternate" type="text/markdown" href={mdUrl} />
      <Breadcrumbs
        items={breadcrumbItems}
        className="mb-4 text-sm text-muted-foreground"
      />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.06] via-background to-background p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="flex items-start gap-5">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={`${org.name} logo`}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl font-bold text-muted-foreground">
              {org.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-green-500/40 text-green-700 dark:text-green-400"
              >
                <CheckCircle2 className="h-3 w-3" />
                {t("verified")}
              </Badge>
              {tier && (
                <Badge className={cn("text-xs", tierColors[tier])}>
                  {tier}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight leading-tight text-balance sm:text-4xl">
              {org.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("visitWebsite")}
                </a>
              )}
              {org.employee_count != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {org.employee_count.toLocaleString(locale)} {t("employees").toLowerCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {org.description && org.description.trim().length > 0 && (
          <div className="mt-6">
            <h2 className="sr-only">{t("about")}</h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
              {org.description}
            </p>
          </div>
        )}
      </div>

      {/* Contributions */}
      <section className="mt-8 space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("contributionsHeading")}
        </h2>

        {/* Problems authored */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold">
              {t("problemsAuthored")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                · {t("problemsAuthoredCount", { count: problems.length })}
              </span>
            </h3>
          </div>
          {problems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("problemsAuthoredEmpty")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {problems.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/problems/${p.id}`}
                  className="group rounded-lg"
                >
                  <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-tight group-hover:text-primary">
                        {p.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Solution approaches offered */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-semibold">
              {t("solutionApproaches")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ·{" "}
                {t("solutionApproachesCount", {
                  count: solutionApproaches.length,
                })}
              </span>
            </h3>
          </div>
          {solutionApproaches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("solutionApproachesEmpty")}
            </p>
          ) : (
            <div className="space-y-2">
              {solutionApproaches.map((sa) => (
                <Card key={sa.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-tight">
                      {sa.title}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("inProblem")}:{" "}
                      <Link
                        href={`/${locale}/problems/${sa.problem_id}`}
                        className="hover:text-foreground"
                      >
                        {sa.problem_title}
                      </Link>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {sa.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Verified pilot outcomes (as client) */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold">
              {t("verifiedOutcomes")}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ·{" "}
                {t("verifiedOutcomesCount", {
                  count: verifiedSuccessReports.length,
                })}
              </span>
            </h3>
          </div>
          {verifiedSuccessReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("verifiedOutcomesEmpty")}
            </p>
          ) : (
            <div className="space-y-2">
              {verifiedSuccessReports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/[0.08] via-green-500/[0.03] to-transparent p-4"
                >
                  <blockquote className="border-l-2 border-green-500/50 pl-3 text-sm font-medium leading-relaxed">
                    &ldquo;{r.report_summary}&rdquo;
                  </blockquote>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("inProblem")}:{" "}
                    <Link
                      href={`/${locale}/problems/${r.problem_id}`}
                      className="hover:text-foreground"
                    >
                      {r.problem_title}
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

