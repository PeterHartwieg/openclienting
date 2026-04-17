import { CheckCircle2, XCircle, Inbox, Pencil, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getModerationHistoryFor } from "@/lib/queries/moderation-history";
import { formatDate } from "@/lib/i18n/format";

interface ModerationHistoryTimelineProps {
  problemId: string;
  locale: string;
}

function actionIcon(action: string) {
  switch (action) {
    case "approved":
    case "verified":
    case "published":
      return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    case "submitted":
      return <Inbox className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    case "edited":
    case "reverted":
    case "draft_saved":
      return <Pencil className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
}

export async function ModerationHistoryTimeline({
  problemId,
  locale,
}: ModerationHistoryTimelineProps) {
  const events = await getModerationHistoryFor("problem_template", problemId);

  if (events.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "moderationHistory" });

  return (
    <section aria-labelledby="moderation-history-heading" className="mt-6">
      <h2
        id="moderation-history-heading"
        className="mb-4 text-base font-semibold text-foreground"
      >
        {t("title")}
      </h2>

      <ol className="relative border-l border-border pl-6 space-y-5">
        {events.map((event) => {
          const knownActions = new Set([
            "submitted",
            "approved",
            "rejected",
            "edited",
            "published",
            "reverted",
          ]);
          const actionKey = event.action as
            | "submitted"
            | "approved"
            | "rejected"
            | "edited"
            | "published"
            | "reverted";
          const actionLabel = knownActions.has(event.action)
            ? t(`actions.${actionKey}`)
            : event.action;

          return (
            <li key={event.id} className="relative">
              {/* Icon sits on the left border */}
              <span className="absolute -left-[1.625rem] flex h-7 w-7 items-center justify-center rounded-full border bg-background ring-4 ring-background">
                {actionIcon(event.action)}
              </span>

              <div className="flex flex-col gap-0.5 pl-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{actionLabel}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{t("reviewer")}</span>
                  <span className="text-muted-foreground">·</span>
                  <time
                    dateTime={event.created_at}
                    className="text-muted-foreground"
                    title={event.created_at}
                  >
                    {formatDate(event.created_at, locale, "short")}
                  </time>
                </div>

                {event.notes && (
                  <p className="text-sm text-muted-foreground">
                    {event.notes}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
