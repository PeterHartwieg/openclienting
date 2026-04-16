import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getFrameworksQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModerationActions } from "@/components/moderate/moderation-actions";
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
    title: `${t("tabFrameworks")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateFrameworksQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getFrameworksQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("tabFrameworks")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingFrameworks")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((f) => (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {f.scope
                    ? f.scope.length > 100
                      ? f.scope.slice(0, 100) + "..."
                      : f.scope
                    : t("pilotFrameworkPlaceholder")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("byUser", {
                    name:
                      (f.profiles as unknown as { display_name: string } | null)
                        ?.display_name ?? t("unknown"),
                  })}{" "}
                  · {formatDate(f.created_at, locale, "medium")}
                </p>
              </CardHeader>
              <CardContent>
                <ModerationActions
                  targetType="pilot_frameworks"
                  targetId={f.id}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
