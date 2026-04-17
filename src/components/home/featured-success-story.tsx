// Server component — no "use client". No hooks, no client state.
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, BadgeCheck, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getFeaturedStory } from "@/lib/queries/featured-success-report";

export async function FeaturedSuccessStory({ locale }: { locale: string }) {
  const story = await getFeaturedStory(locale);

  // Loader returns null when no row is featured — section simply disappears.
  if (!story) return null;

  const t = await getTranslations("featuredSuccessStory");
  const tHome = await getTranslations("home");

  const orgDisplay =
    story.organization_display === "anonymousOrg"
      ? t("anonymousOrg")
      : story.organization_display;

  return (
    <section className="border-t py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-semibold tracking-tight leading-heading">
            {t("sectionTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {tHome("featuredSuccessStorySectionSubtitle")}
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-4xl overflow-hidden">
          <CardContent className="p-8">
            {/* Header: attribution + verification badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{orgDisplay}</span>
              {story.is_verified && (
                <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" />
                  {t("verified")}
                </Badge>
              )}
            </div>

            {/* Summary — user-generated content, rendered as-is */}
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {story.report_summary}
            </p>

            {/* Structured evidence fields — shown when populated */}
            {(story.pilot_date_range || story.deployment_scope || story.kpi_summary || story.evidence_notes) && (
              <div className="mt-4 space-y-1.5 text-sm">
                {story.pilot_date_range && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Period:</span>{" "}
                    {story.pilot_date_range}
                  </p>
                )}
                {story.deployment_scope && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Scope:</span>{" "}
                    {story.deployment_scope}
                  </p>
                )}
                {story.kpi_summary && (
                  <div className="rounded-lg border bg-card p-3 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {t("outcomeLabel")}
                      </p>
                      <p className="text-sm text-foreground">{story.kpi_summary}</p>
                    </div>
                  </div>
                )}
                {story.evidence_notes && (
                  <p className="text-muted-foreground text-xs">
                    <span className="font-medium text-foreground">Evidence:</span>{" "}
                    {story.evidence_notes}
                  </p>
                )}
              </div>
            )}

            {/* Read more — links to the parent solution approach */}
            <div className="mt-6 flex justify-end">
              <Link
                href={`/${locale}/problems`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("readMore")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
