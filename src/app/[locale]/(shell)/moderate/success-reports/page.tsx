import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSuccessReportsQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SuccessReportReview } from "@/components/moderate/success-report-review";
import { FeatureSuccessReport } from "@/components/moderate/feature-success-report";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/i18n/format";
import { createClient } from "@/lib/supabase/server";

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

/** Fetch current active featured rows for a set of success_report ids */
async function getActiveFeaturedRows(reportIds: string[]) {
  if (reportIds.length === 0) return {} as Record<string, { id: string; locale: string; display_order: number }[]>;

  const supabase = await createClient();
  const { data } = await supabase
    .from("featured_success_report")
    .select("id, success_report_id, locale, display_order")
    .in("success_report_id", reportIds)
    .is("unfeatured_at", null);

  const map: Record<string, { id: string; locale: string; display_order: number }[]> = {};
  for (const row of data ?? []) {
    if (!map[row.success_report_id]) map[row.success_report_id] = [];
    map[row.success_report_id].push({
      id: row.id,
      locale: row.locale,
      display_order: row.display_order,
    });
  }
  return map;
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

  const featuredMap = await getActiveFeaturedRows(items.map((sr) => sr.id));

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

                  {/* Feature on homepage lever */}
                  <FeatureSuccessReport
                    successReportId={sr.id}
                    activeFeaturedRows={featuredMap[sr.id] ?? []}
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
