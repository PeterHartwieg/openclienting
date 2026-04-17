import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/i18n/format";
import type { EditDiff } from "@/lib/types/database";

const statusColors: Record<string, string> = {
  pending_recheck: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  reverted: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "moderate" });
  return {
    title: `${t("history.title")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function EditHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");

  const supabase = await createClient();
  const { data: revisions } = await supabase
    .from("content_revisions")
    .select(`
      id, target_type, target_id, diff, revision_status,
      reviewer_notes, reviewed_at, created_at,
      profiles!content_revisions_author_id_fkey(display_name)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("history.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("history.subtitle")}
      </p>

      <div className="mt-8 space-y-3">
        {(!revisions || revisions.length === 0) ? (
          <p className="text-muted-foreground">{t("history.noRevisions")}</p>
        ) : (
          revisions.map((rev) => {
            const diff = rev.diff as EditDiff;
            const statusClass = statusColors[rev.revision_status] ?? "";
            return (
              <Card key={rev.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{rev.target_type}</Badge>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusClass}`}
                    >
                      {rev.revision_status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("byUser", {
                        name:
                          (rev.profiles as unknown as { display_name: string } | null)
                            ?.display_name ?? t("unknown"),
                      })}{" "}
                      · {formatDate(rev.created_at, locale, "medium")}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-mono text-muted-foreground">
                    {rev.target_id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(diff).map(([field, values]) => (
                      <div key={field} className="rounded border p-2 text-sm">
                        <p className="font-medium">{field}</p>
                        <div className="mt-1 grid gap-1 sm:grid-cols-2">
                          <div className="rounded bg-red-500/10 p-1.5 text-xs">
                            <span className="font-medium text-red-600 dark:text-red-400">{t("history.before")} </span>
                            {values.old ?? "(empty)"}
                          </div>
                          <div className="rounded bg-green-500/10 p-1.5 text-xs">
                            <span className="font-medium text-green-600 dark:text-green-400">{t("history.after")} </span>
                            {values.new ?? "(empty)"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {rev.reviewer_notes && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">{t("history.reviewerNote")}</span>{" "}
                      {rev.reviewer_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
