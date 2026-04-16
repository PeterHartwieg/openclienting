import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getKnowledgeArticlesQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    title: `${t("tabKnowledgeArticles")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateKnowledgeArticlesQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getKnowledgeArticlesQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {t("tabKnowledgeArticles")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingKnowledgeArticles")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((ka) => (
            <Card key={ka.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{ka.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ka.kind}</Badge>
                    <Badge variant="outline">{ka.locale}</Badge>
                    <StatusBadge status={ka.status} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">/{ka.slug}</span> ·{" "}
                  {t("byUser", {
                    name:
                      (ka.profiles as unknown as { display_name: string } | null)
                        ?.display_name ?? t("unknown"),
                  })}{" "}
                  · {formatDate(ka.created_at, locale, "medium")}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{ka.lede}</p>
                {ka.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {ka.tags.map((tag: string) => `#${tag}`).join(" ")}
                  </p>
                )}
                <ModerationActions
                  targetType="knowledge_articles"
                  targetId={ka.id}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
