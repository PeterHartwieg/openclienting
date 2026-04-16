import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProblemsQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
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
    title: `${t("tabProblems")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateProblemsQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getProblemsQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("tabProblems")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingProblems")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Link href={`/${locale}/moderate/problems/${p.id}`}>
                    <CardTitle className="text-base hover:underline">
                      {p.title}
                    </CardTitle>
                  </Link>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("byUser", {
                    name:
                      (p.profiles as unknown as { display_name: string } | null)
                        ?.display_name ?? t("unknown"),
                  })}{" "}
                  · {formatDate(p.created_at, locale, "medium")}
                </p>
              </CardHeader>
              <CardContent>
                <ModerationActions
                  targetType="problem_templates"
                  targetId={p.id}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
