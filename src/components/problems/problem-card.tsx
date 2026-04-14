import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagBadge } from "@/components/shared/tag-badge";
import { SolutionStatusBadge } from "@/components/shared/solution-status-badge";
import { getTagLabel } from "@/lib/i18n/tags";

interface ProblemTag {
  tag_id: string;
  tags: {
    id: string;
    name: string;
    name_de?: string | null;
    slug: string;
    category: string;
  } | null;
}

interface ProblemCardProps {
  id: string;
  title: string;
  description: string;
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean;
  author?: { display_name: string | null } | null;
  organization?: { id: string; name: string } | null;
  problemTags: ProblemTag[];
  solutionStatus?: string;
  locale: string;
}

const MAX_VISIBLE_TAGS = 3;

export async function ProblemCard({
  id,
  title,
  description,
  is_publicly_anonymous,
  is_org_anonymous,
  author,
  organization,
  problemTags,
  solutionStatus,
  locale,
}: ProblemCardProps) {
  const t = await getTranslations({ locale, namespace: "problemDetail" });
  const validTags = problemTags.filter((pt) => pt.tags);
  const visibleTags = validTags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = validTags.length - MAX_VISIBLE_TAGS;

  return (
    <Link
      href={`/${locale}/problems/${id}`}
      className="group rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="h-full border-l-2 border-l-primary/40 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 group-hover:border-l-primary">
        <CardHeader>
          <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">
              {[
                is_publicly_anonymous ? t("anonymous") : (author?.display_name ?? t("unknown")),
                is_org_anonymous ? null : (organization?.name ?? null),
              ].filter(Boolean).join(" · ")}
            </p>
            {solutionStatus && <SolutionStatusBadge status={solutionStatus} />}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
          {validTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {visibleTags.map((pt) => (
                <TagBadge
                  key={pt.tag_id}
                  name={getTagLabel(pt.tags!, locale)}
                  category={pt.tags!.category}
                />
              ))}
              {overflowCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {t("moreTags", { count: overflowCount })}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
