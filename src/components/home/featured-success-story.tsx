import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Factory, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { features } from "@/lib/features";

// TODO: Replace with a real curated pilot story once content is ready.
// When `features.showFeaturedSuccessStory` is flipped to true, this placeholder
// renders instead. The placeholder is deliberately English-only because it is
// not production content.
type KpiDirection = "lower-is-better" | "higher-is-better";
type DummyKpi = {
  label: string;
  delta: string;
  direction: KpiDirection;
};
const dummyStory = {
  industryLabel: "Manufacturing",
  problemTitle: "Long machine setup times between batch runs",
  summary:
    "A mid-sized SME in the machine-building sector piloted a computer-vision solution to automate tool-change verification. After an 8-week pilot the setup time dropped by 38% and the supplier converted to a full rollout.",
  orgLabel: "Mid-sized machine-building SME (anonymous)",
  kpis: [
    {
      label: "Setup time",
      delta: "−38%",
      direction: "lower-is-better",
    },
    {
      label: "Scrap rate",
      delta: "−12%",
      direction: "lower-is-better",
    },
    {
      label: "Operator confidence",
      delta: "+21%",
      direction: "higher-is-better",
    },
  ] satisfies DummyKpi[],
};

// Per feedback_kpi_direction memory: color deltas by whether the label's
// direction is "lower is better" or "higher is better". A decrease on a
// lower-is-better metric is good (green); an increase on a higher-is-better
// metric is also good (green). Everything else is red. Neutral would apply if
// direction were unknown, but here we always know it.
function deltaIsImprovement(kpi: DummyKpi): boolean {
  const decreased = kpi.delta.startsWith("−") || kpi.delta.startsWith("-");
  return kpi.direction === "lower-is-better" ? decreased : !decreased;
}

export async function FeaturedSuccessStory({ locale }: { locale: string }) {
  if (!features.showFeaturedSuccessStory) return null;

  const t = await getTranslations("home");

  return (
    <section className="border-t py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-semibold tracking-tight leading-heading">
            {t("featuredSuccessStorySectionTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("featuredSuccessStorySectionSubtitle")}
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-4xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Factory className="h-3 w-3" />
                {dummyStory.industryLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {dummyStory.orgLabel}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-semibold leading-tight">
              {dummyStory.problemTitle}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {dummyStory.summary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {dummyStory.kpis.map((kpi) => {
                const improved = deltaIsImprovement(kpi);
                const Icon = kpi.delta.startsWith("−") || kpi.delta.startsWith("-")
                  ? TrendingDown
                  : TrendingUp;
                return (
                  <div
                    key={kpi.label}
                    className="flex items-center gap-3 rounded-lg border bg-card p-3"
                  >
                    <div
                      className={
                        improved
                          ? "flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400"
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p
                        className={
                          improved
                            ? "text-lg font-bold leading-none text-emerald-600 dark:text-emerald-400"
                            : "text-lg font-bold leading-none text-red-600 dark:text-red-400"
                        }
                      >
                        {kpi.delta}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {kpi.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href={`/${locale}/problems`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("featuredSuccessStoryReadMore")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
