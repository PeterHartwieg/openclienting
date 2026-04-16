import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getTranslationsQueue } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TranslationReview } from "@/components/moderate/translation-review";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/i18n/format";
import { TARGET_TYPE_LABELS } from "@/lib/content-translations/fields";
import { getLanguageLabel } from "@/i18n/languages";
import type {
  TranslationFields,
  TranslationTargetType,
} from "@/lib/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "moderate" });
  return {
    title: `${t("tabTranslations")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function ModerateTranslationsQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");
  const { items, sources, count } = await getTranslationsQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {t("tabTranslations")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("queueCount", { count })}
      </p>

      <div className="mt-6 space-y-3">
        {count === 0 ? (
          <EmptyState
            title={t("noPendingTranslations")}
            message={t("queueEmptyHint")}
          />
        ) : (
          items.map((tr) => {
            const targetType = tr.target_type as TranslationTargetType;
            const key = `${tr.target_type}:${tr.target_id}`;
            const source = sources.get(key);
            const sourceFields = source?.fields ?? {};
            const sourceLanguage = source?.sourceLanguage ?? "en";
            return (
              <Card key={tr.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">
                      {TARGET_TYPE_LABELS[targetType]}
                    </Badge>
                    <Badge variant="outline">
                      {getLanguageLabel(sourceLanguage)} →{" "}
                      {getLanguageLabel(tr.language)}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {tr.target_id.slice(0, 8)}…
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("byUser", {
                      name:
                        (tr.profiles as unknown as { display_name: string } | null)
                          ?.display_name ?? t("unknown"),
                    })}{" "}
                    · {formatDate(tr.created_at, locale, "medium")}
                  </p>
                </CardHeader>
                <CardContent>
                  <TranslationReview
                    translationId={tr.id}
                    targetType={targetType}
                    sourceFields={sourceFields}
                    translatedFields={tr.fields as TranslationFields}
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
