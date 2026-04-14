import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FileText, EyeOff, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function ForSmes({ locale }: { locale: string }) {
  const t = await getTranslations("home");

  const features = [
    {
      icon: FileText,
      title: t("forSmesFeature1Title"),
      body: t("forSmesFeature1Body"),
    },
    {
      icon: EyeOff,
      title: t("forSmesFeature2Title"),
      body: t("forSmesFeature2Body"),
    },
    {
      icon: BarChart3,
      title: t("forSmesFeature3Title"),
      body: t("forSmesFeature3Body"),
    },
  ];

  return (
    <section className="border-t bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 font-semibold tracking-tight leading-heading">
            {t("forSmesTitle")}
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {t("forSmesDescription")}
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-t-2 border-t-primary/60">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t("forSmesCtaPrimary")}
          </Link>
          <Link
            href={`/${locale}/problems`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {t("forSmesCtaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
