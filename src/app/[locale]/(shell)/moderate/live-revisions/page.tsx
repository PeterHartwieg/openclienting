import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLiveRevisionsQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevisionActions } from "@/components/moderate/revision-actions";
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
    title: `${t("tabLiveRevisions")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateLiveRevisionsQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, count } = await getLiveRevisionsQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {t("tabLiveRevisions")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingRevisions")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((rev) => (
            <Card key={rev.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{rev.target_type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {rev.target_id.slice(0, 8)}...
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("byUser", {
                    name:
                      (rev.profiles as unknown as { display_name: string } | null)
                        ?.display_name ?? t("unknown"),
                  })}{" "}
                  · {formatDate(rev.created_at, locale, "long")}
                </p>
              </CardHeader>
              <CardContent>
                <RevisionActions
                  revisionId={rev.id}
                  diff={
                    rev.diff as Record<
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
