import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSuggestedEditsQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuggestedEditReview } from "@/components/moderate/suggested-edit-review";
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
    title: `${t("tabEdits")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateSuggestedEditsQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getSuggestedEditsQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("tabEdits")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingEdits")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((se) => (
            <Card key={se.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{se.target_type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {se.target_id.slice(0, 8)}...
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("byUser", {
                    name:
                      (se.profiles as unknown as { display_name: string } | null)
                        ?.display_name ?? t("unknown"),
                  })}{" "}
                  · {formatDate(se.created_at, locale, "medium")}
                </p>
              </CardHeader>
              <CardContent>
                <SuggestedEditReview
                  editId={se.id}
                  diff={
                    se.diff as Record<
                      string,
                      { old: string | null; new: string | null }
                    >
                  }
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
