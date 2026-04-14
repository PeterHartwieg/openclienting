import { Search, PenLine, Rocket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function HowItWorks() {
  const t = await getTranslations("home");

  const steps = [
    { icon: Search, title: t("step1Title"), description: t("step1Body") },
    { icon: PenLine, title: t("step2Title"), description: t("step2Body") },
    { icon: Rocket, title: t("step3Title"), description: t("step3Body") },
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
              className="relative border-t-2 border-t-primary/60 bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" />
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
