import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getOrganizationVerificationQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationActions } from "@/components/moderate/verification-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/i18n/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "moderate" });
  return {
    title: `${t("tabOrgVerification")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateOrgVerificationQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getOrganizationVerificationQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {t("tabOrgVerification")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingOrgs")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((org) => (
            <Card key={org.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{org.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {org.website && (
                    <>
                      <a
                        href={
                          org.website.startsWith("http")
                            ? org.website
                            : `https://${org.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        {org.website}
                      </a>
                      {" · "}
                    </>
                  )}
                  {t("byUser", {
                    name:
                      (org.profiles as unknown as { display_name: string | null } | null)
                        ?.display_name ?? t("unknown"),
                  })}{" "}
                  ({(org as { creator_email?: string | null }).creator_email ??
                    t("noEmail")})
                  {" · "}
                  {formatDate(org.created_at, locale, "medium")}
                </p>
                {org.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {org.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs space-y-1.5">
                  <p className="font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t("verificationChecklist")}
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 shrink-0" />
                    <span>{t("checkWebsiteReachable")}</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 shrink-0" />
                    <span>{t("checkOrgNameMatches")}</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 shrink-0" />
                    <span>{t("checkRequesterPlausible")}</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 shrink-0" />
                    <span>{t("checkGenuineBusiness")}</span>
                  </label>
                </div>
                <VerificationActions organizationId={org.id} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
