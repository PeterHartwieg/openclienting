import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagBadge } from "@/components/shared/tag-badge";

interface ProblemTag {
  tag_id: string;
  tags: { id: string; name: string; slug: string; category: string } | null;
}

interface ProblemCardProps {
  id: string;
  title: string;
  description: string;
  anonymous: boolean;
  author?: { display_name: string | null } | null;
  problemTags: ProblemTag[];
  locale: string;
}

export function ProblemCard({
  id,
  title,
  description,
  anonymous,
  author,
  problemTags,
  locale,
}: ProblemCardProps) {
  return (
    <Link href={`/${locale}/problems/${id}`}>
      <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {anonymous ? "Anonymous" : author?.display_name ?? "Unknown"}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
          {problemTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {problemTags
                .filter((pt) => pt.tags)
                .map((pt) => (
                  <TagBadge
                    key={pt.tag_id}
                    name={pt.tags!.name}
                    category={pt.tags!.category}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
