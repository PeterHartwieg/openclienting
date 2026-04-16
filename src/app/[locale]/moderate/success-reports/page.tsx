import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSuccessReportsQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SuccessReportReview } from "@/components/moderate/success-report-review";
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
    title: `${t("tabSuccessReports")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateSuccessReportsQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getSuccessReportsQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {t("tabSuccessReports")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingSuccessReports")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((sr) => {
            const profiles = sr.profiles as unknown as
              | { display_name: string | null }
              | null;
            const org = sr.organizations as unknown as
              | { id: string; name: string }
              | null;
            return (
              <Card key={sr.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-sm font-medium">
                      {t("successReportLabel")} ·{" "}
                      {formatDate(sr.created_at, locale, "medium")}
                    </CardTitle>
                    <StatusBadge
                      status={sr.verification_status ?? sr.status}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <SuccessReportReview
                    reportId={sr.id}
                    reportSummary={sr.report_summary}
                    pilotDateRange={
                      (sr as unknown as { pilot_date_range?: string | null })
                        .pilot_date_range
                    }
                    deploymentScope={
                      (sr as unknown as { deployment_scope?: string | null })
                        .deployment_scope
                    }
                    kpiSummary={
                      (sr as unknown as { kpi_summary?: string | null })
                        .kpi_summary
                    }
                    evidenceNotes={
                      (sr as unknown as { evidence_notes?: string | null })
                        .evidence_notes
                    }
                    submitterName={profiles?.display_name ?? null}
                    organizationName={org?.name ?? null}
                    isPubliclyAnonymous={
                      (sr as unknown as { is_publicly_anonymous: boolean })
                        .is_publicly_anonymous
                    }
                    isOrgAnonymous={
                      (sr as unknown as { is_org_anonymous: boolean })
                        .is_org_anonymous
                    }
                    verificationStatus={sr.verification_status ?? "submitted"}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
