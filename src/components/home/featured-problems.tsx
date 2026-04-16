import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPublishedProblemsPage } from "@/lib/queries/problems";
import { ProblemCard } from "@/components/problems/problem-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export async function FeaturedProblems({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const { rows: problems } = await getPublishedProblemsPage({ page: 1, pageSize: 4 });
  const featured = problems;

  if (featured.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-h2 font-semibold tracking-tight leading-heading">
              {t("recentProblems")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("recentProblemsSubtitle")}
            </p>
          </div>
          <Link
            href={`/${locale}/problems`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            {t("viewAll")}
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
              is_org_anonymous={problem.is_org_anonymous}
              author={problem.profiles}
              organization={problem.organizations as { id: string; name: string } | null}
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
            {t("viewAllProblems")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
