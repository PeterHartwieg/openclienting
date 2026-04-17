"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  featureSuccessReport,
  unfeatureSuccessReport,
} from "@/app/[locale]/(shell)/moderate/actions";

// All locale codes the product ships — matches the CHECK in the migration.
const SUPPORTED_LOCALES = [
  "ar","bn","cs","da","de","el","en","es","fi","fr",
  "he","hi","hu","id","it","ja","ko","mn","nl","no",
  "pl","pt","ro","ru","sv","sw","th","tr","uk","vi","zh",
] as const;

interface FeaturedRow {
  id: string;
  locale: string;
  display_order: number;
}

interface FeatureSuccessReportProps {
  /** The success_report.id to feature */
  successReportId: string;
  /**
   * Current active featured rows for this report (unfeatured_at is null).
   * Pass an empty array when not featured anywhere.
   */
  activeFeaturedRows: FeaturedRow[];
}

export function FeatureSuccessReport({
  successReportId,
  activeFeaturedRows,
}: FeatureSuccessReportProps) {
  const router = useRouter();
  const t = useTranslations("moderate");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>("en");
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  function handleFeature() {
    setError(null);
    startTransition(async () => {
      const result = await featureSuccessReport({
        successReportId,
        locale,
        displayOrder,
      });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleUnfeature(featuredId: string) {
    setError(null);
    startTransition(async () => {
      const result = await unfeatureSuccessReport({ featuredId });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="mt-4 rounded-md border bg-muted/30 px-4 py-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("featureSuccessReport.button.feature")}
      </p>

      {/* Currently featured rows */}
      {activeFeaturedRows.length > 0 ? (
        <div className="space-y-2">
          {activeFeaturedRows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded border bg-card px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{row.locale}</span>
                {" — "}{t("featureSuccessReport.featuredOrderSummary", { order: row.display_order })}
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {t("featureSuccessReport.status.featured")}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleUnfeature(row.id)}
              >
                {t("featureSuccessReport.button.unfeature")}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("featureSuccessReport.status.notFeatured")}</p>
      )}

      {/* Feature form */}
      <div className="flex flex-wrap items-end gap-2 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="fsr-locale">
            {t("featureSuccessReport.localeLabel")}
          </label>
          <select
            id="fsr-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={isPending}
            className="h-8 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium" htmlFor="fsr-order">
            {t("featureSuccessReport.orderLabel")}
          </label>
          <input
            id="fsr-order"
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            disabled={isPending}
            className="h-8 w-20 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button size="sm" disabled={isPending} onClick={handleFeature}>
          {isPending ? "…" : t("featureSuccessReport.button.feature")}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
