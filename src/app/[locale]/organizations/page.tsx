import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getVerifiedOrganizationsDirectory } from "@/lib/queries/organizations";
import { getLanguageAlternates } from "@/lib/site";
import { getSchemaSiteContext } from "@/lib/seo/site-context";
import { organizationsCollectionSchema } from "@/lib/seo/schema";
import { getOrgSizeTier, cn } from "@/lib/utils";
import { localeTags, type Locale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "organizations" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getLanguageAlternates(locale, "/organizations"),
  };
}

const tierColors: Record<string, string> = {
  Micro: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Small: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  Medium: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Large: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

export default async function OrganizationsDirectoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "organizations" });
  const bt = await getTranslations({ locale, namespace: "breadcrumbs" });

  const orgs = await getVerifiedOrganizationsDirectory();

  // Breadcrumbs + CollectionPage schema. The ItemList enumerates every
  // verified org on the page (not paginated at this volume) so answer
  // engines see a clean seed list.
  const siteCtx = getSchemaSiteContext();
  const directoryPath = `/${locale}/organizations`;
  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: bt("organizations"), url: directoryPath },
  ];
  const collectionSchema = organizationsCollectionSchema({
    inLanguageTag: localeTags[locale as Locale],
    pageName: t("metaTitle"),
    pageDescription: t("metaDescription"),
    pageUrl: `${siteCtx.siteUrl}${directoryPath}`,
    items: orgs.map((org) => ({
      name: org.name,
      url: `${siteCtx.siteUrl}/${locale}/organizations/${org.slug}`,
    })),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={collectionSchema} />
      <Breadcrumbs
        items={breadcrumbItems}
        className="mb-4 text-sm text-muted-foreground"
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => {
            const tier = getOrgSizeTier(org.employee_count);
            return (
              <Link
                key={org.id}
                href={`/${locale}/organizations/${org.slug}`}
                className="group rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Card className="h-full border-l-2 border-l-primary/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-l-primary group-hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {org.logo_url ? (
                        <Image
                          src={org.logo_url}
                          alt={`${org.name} logo`}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-base font-bold text-muted-foreground">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base leading-tight group-hover:text-primary">
                          {org.name}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="gap-1 border-green-500/40 text-green-700 dark:text-green-400"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {t("verified")}
                          </Badge>
                          {tier && (
                            <Badge
                              className={cn("text-xs", tierColors[tier])}
                            >
                              {tier}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {org.description && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {org.description}
                      </p>
                    )}
                    {!org.description && (
                      <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {t("profileDescriptionFallback")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
