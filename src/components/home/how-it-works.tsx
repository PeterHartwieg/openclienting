import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark, type BrandMarkState } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

export async function HowItWorks() {
  const t = await getTranslations("home");

  // The three steps walk the brand metaphor end-to-end:
  //   1. Corporate posts a real problem  → blue bracket active
  //   2. Startup proposes an approach    → orange bracket active
  //   3. Match / pilot / collaboration   → paired mark with center dot
  const steps: Array<{
    title: string;
    description: string;
    markState: BrandMarkState;
    tileClass: string;
    borderClass: string;
  }> = [
    {
      title: t("step1Title"),
      description: t("step1Body"),
      markState: "corporate",
      tileClass: "bg-primary/10",
      borderClass: "border-t-primary/70",
    },
    {
      title: t("step2Title"),
      description: t("step2Body"),
      markState: "startup",
      tileClass: "bg-accent/15",
      borderClass: "border-t-accent/70",
    },
    {
      title: t("step3Title"),
      description: t("step3Body"),
      markState: "match",
      tileClass: "bg-gradient-to-br from-primary/10 to-accent/15",
      borderClass: "border-t-primary/70",
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-h2 font-semibold tracking-tight leading-heading">
            {t("howItWorksTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("howItWorksSubtitle")}
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card
              key={step.title}
              className={cn(
                "relative border-t-2 bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                step.borderClass,
              )}
            >
              <CardHeader>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    step.tileClass,
                  )}
                >
                  <BrandMark state={step.markState} size={28} />
                </div>
                <CardTitle className="mt-3 text-lg">
                  <span className="text-muted-foreground mr-2">
                    {i + 1}.
                  </span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
