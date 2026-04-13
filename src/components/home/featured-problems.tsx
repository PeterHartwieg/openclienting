import Link from "next/link";
import { getPublishedProblems } from "@/lib/queries/problems";
import { ProblemCard } from "@/components/problems/problem-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export async function FeaturedProblems({ locale }: { locale: string }) {
  const problems = await getPublishedProblems();
  const featured = problems.slice(0, 4);

  if (featured.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-h2 font-semibold tracking-tight leading-heading">
              Recent Problems
            </h2>
            <p className="mt-2 text-muted-foreground">
              Latest challenges submitted by the community.
            </p>
          </div>
          <Link
            href={`/${locale}/problems`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((problem) => (
            <ProblemCard
              key={problem.id}
              id={problem.id}
              title={problem.title}
              description={problem.description}
              is_publicly_anonymous={problem.is_publicly_anonymous}
              author={problem.profiles}
              problemTags={problem.problem_tags ?? []}
              locale={locale}
            />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href={`/${locale}/problems`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all problems
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
