import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { SearchBar } from "@/components/layout/search-bar";
import { HowItWorks } from "@/components/home/how-it-works";
import { FeaturedProblems } from "@/components/home/featured-problems";
import {
  FileText,
  Globe,
  Lightbulb,
  Factory,
  Truck,
  ShoppingCart,
  Zap,
  HardHat,
  HeartPulse,
} from "lucide-react";

const industries = [
  { name: "Manufacturing", slug: "manufacturing", icon: Factory },
  { name: "Logistics", slug: "logistics", icon: Truck },
  { name: "Retail", slug: "retail", icon: ShoppingCart },
  { name: "Energy", slug: "energy", icon: Zap },
  { name: "Construction", slug: "construction", icon: HardHat },
  { name: "Healthcare", slug: "healthcare", icon: HeartPulse },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const [
    { count: successfulPilotCount },
    { count: industryCount },
    { count: approachCount },
  ] = await Promise.all([
    supabase
      .from("problem_templates")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .eq("solution_status", "successful_pilot"),
    supabase
      .from("tags")
      .select("*", { count: "exact", head: true })
      .eq("category", "industry"),
    supabase
      .from("solution_approaches")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  const stats = [
    { label: "Problems with successful pilots", value: String(successfulPilotCount ?? 0), icon: FileText },
    { label: "Industries covered", value: String(industryCount ?? 0), icon: Globe },
    { label: "Solution approaches proposed", value: String(approachCount ?? 0), icon: Lightbulb },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-display font-bold leading-display tracking-tighter">
            Real Problems.{" "}
            <span className="text-primary">Open Solutions.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            SMEs crowdsource problem templates and pilot playbooks. Startups
            discover unsolved challenges to position their solutions against.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <SearchBar locale={locale} />
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href={`/${locale}/problems`}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Browse Problems
            </Link>
            <Link
              href={`/${locale}/submit`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Submit a Problem
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
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
            Explore by Industry
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find real challenges specific to your sector.
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
                      {industry.name}
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

      {/* For Startups CTA */}
      <section className="border-t bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-h2 font-semibold tracking-tight leading-heading">
              For Startups
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Discover real, unsolved challenges from SMEs. Position your
              solution against validated problem templates with clear
              requirements and success criteria.
            </p>
            <Link
              href={`/${locale}/problems`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "mt-8"
              )}
            >
              Explore Challenges
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
