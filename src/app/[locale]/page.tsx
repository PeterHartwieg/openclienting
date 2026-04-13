import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const industries = [
  { name: "Manufacturing", slug: "manufacturing" },
  { name: "Logistics", slug: "logistics" },
  { name: "Retail", slug: "retail" },
  { name: "Energy", slug: "energy" },
  { name: "Construction", slug: "construction" },
  { name: "Healthcare", slug: "healthcare" },
];

const stats = [
  { label: "Problems with successful pilots", value: "—" },
  { label: "Industries covered", value: "6" },
  { label: "Solution approaches proposed", value: "—" },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Venture Clienting,{" "}
            <span className="text-muted-foreground">Open Source</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            SMEs crowdsource problem templates and pilot playbooks. Startups
            discover unsolved challenges to position their solutions against.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
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
      <section className="border-y bg-muted/40 py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industry categories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Explore by Industry
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map((industry) => (
              <Link
                key={industry.slug}
                href={`/${locale}/problems?industry=${industry.slug}`}
              >
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {industry.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Startups CTA */}
      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            For Startups
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Discover real, unsolved challenges from SMEs. Position your solution
            against validated problem templates with clear requirements and
            success criteria.
          </p>
          <Link
            href={`/${locale}/problems`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
          >
            Explore Challenges
          </Link>
        </div>
      </section>
    </div>
  );
}
