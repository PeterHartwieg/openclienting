import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PERSONA_COOKIE, parsePersona } from "@/lib/persona";
import { PersonaHero } from "@/components/home/persona-hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { FeaturedProblems } from "@/components/home/featured-problems";
import { FeaturedSuccessStory } from "@/components/home/featured-success-story";
import { ForSmes } from "@/components/home/for-smes";
import { ForStartups } from "@/components/home/for-startups";
import { getTagLabel, sortTagsByLocaleLabel } from "@/lib/i18n/tags";
import { getHomePageStats } from "@/lib/queries/home";
import { getLanguageAlternates } from "@/lib/site";
import {
  FileText,
  BadgeCheck,
  Lightbulb,
  Factory,
  Truck,
  ShoppingCart,
  Zap,
  HardHat,
  HeartPulse,
  Tag as TagIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icon mapping for known industry slugs. Falls back to a generic Tag icon for
// any new industry tag added by moderators.
const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  manufacturing: Factory,
  logistics: Truck,
  retail: ShoppingCart,
  energy: Zap,
  construction: HardHat,
  healthcare: HeartPulse,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getLanguageAlternates(locale, ""),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  // Read persona cookie so the first render matches what the user chose last
  // visit. Client component takes over after hydration and can still toggle.
  const cookieStore = await cookies();
  const initialPersona = parsePersona(cookieStore.get(PERSONA_COOKIE)?.value);

  const {
    successfulPilotCount,
    verifiedReportCount,
    approachCount,
    industryTagsData,
  } = await getHomePageStats();

  const industries = sortTagsByLocaleLabel(industryTagsData ?? [], locale).map(
    (tag) => ({
      slug: tag.slug,
      label: getTagLabel(tag, locale),
      icon: INDUSTRY_ICONS[tag.slug] ?? TagIcon,
    }),
  );

  const stats = [
    {
      label: t("statSuccessfulPilots"),
      value: String(successfulPilotCount ?? 0),
      icon: FileText,
    },
    {
      label: t("statVerifiedReports"),
      value: String(verifiedReportCount ?? 0),
      icon: BadgeCheck,
    },
    {
      label: t("statApproaches"),
      value: String(approachCount ?? 0),
      icon: Lightbulb,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero with persona toggle */}
      <PersonaHero locale={locale} initialPersona={initialPersona} />

      {/* Stats */}
      <section className="border-y bg-muted/40 py-12">
        <div className="mx-auto grid max-w-md grid-cols-1 gap-5 px-4 sm:px-6 md:max-w-6xl md:grid-cols-3 md:gap-6 lg:px-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 md:justify-center"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold text-primary leading-none">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Industry categories */}
      <section className="border-t bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-h2 font-semibold tracking-tight leading-heading">
            {t("exploreByIndustry")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("exploreByIndustrySubtitle")}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map((industry) => (
              <Link
                key={industry.slug}
                href={`/${locale}/problems?industry=${industry.slug}`}
              >
                <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30">
                  <CardHeader className="items-center text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <industry.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-2 text-sm font-medium">
                      {industry.label}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Problems */}
      <Suspense
        fallback={
          <section className="py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Skeleton className="mb-8 h-8 w-48" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </section>
        }
      >
        <FeaturedProblems locale={locale} />
      </Suspense>

      {/* Featured Success Story (feature-flagged) */}
      <FeaturedSuccessStory locale={locale} />

      {/* For SMEs */}
      <ForSmes locale={locale} />

      {/* For Startups */}
      <ForStartups locale={locale} />
    </div>
  );
}
