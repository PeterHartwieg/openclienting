import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getModerationCounts } from "@/lib/queries/moderation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModerationCounts } from "@/lib/nav/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "moderate" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

type QueueKey = keyof ModerationCounts;

const QUEUES: ReadonlyArray<{
  key: QueueKey;
  slug: string;
  labelKey: string;
}> = [
  { key: "problems", slug: "problems", labelKey: "moderate.tabProblems" },
  { key: "requirements", slug: "requirements", labelKey: "moderate.tabRequirements" },
  { key: "frameworks", slug: "frameworks", labelKey: "moderate.tabFrameworks" },
  { key: "solutions", slug: "solutions", labelKey: "moderate.tabSolutions" },
  { key: "successReports", slug: "success-reports", labelKey: "moderate.tabSuccessReports" },
  { key: "suggestedEdits", slug: "suggested-edits", labelKey: "moderate.tabEdits" },
  { key: "organizationVerification", slug: "organization-verification", labelKey: "moderate.tabOrgVerification" },
  { key: "liveRevisions", slug: "live-revisions", labelKey: "moderate.tabLiveRevisions" },
  { key: "knowledgeArticles", slug: "knowledge-articles", labelKey: "moderate.tabKnowledgeArticles" },
  { key: "translations", slug: "translations", labelKey: "moderate.tabTranslations" },
];

export default async function ModerationOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // Layout already runs requireRole("moderator") and pre-fetches the same
  // counts; React `cache()` makes this a no-op round-trip.
  const counts = await getModerationCounts();

  const total = QUEUES.reduce((sum, q) => sum + counts[q.key], 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("moderate.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("moderate.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/moderate/history`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("moderate.editHistory")}
          </Link>
          <Link
            href={`/${locale}/moderate/tags`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("moderate.manageTags")}
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {total === 0
          ? t("moderate.overview.allClear")
          : t("moderate.overview.totalPending", { count: total })}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUEUES.map((q) => {
          const count = counts[q.key];
          const href = `/${locale}/moderate/${q.slug}`;
          return (
            <Link
              key={q.key}
              href={href}
              className="group rounded-lg border bg-card p-0 transition-colors hover:bg-muted/40"
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-medium group-hover:underline">
                      {t(q.labelKey)}
                    </CardTitle>
                    {count > 0 ? (
                      <Badge variant="secondary" className="font-semibold">
                        {count}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        0
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {count === 0
                    ? t("moderate.overview.queueEmpty")
                    : t("moderate.overview.queuePending", { count })}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
