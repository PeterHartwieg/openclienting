import { Badge } from "@/components/ui/badge";

const categoryVar: Record<string, string> = {
  industry: "var(--tag-industry)",
  function: "var(--tag-function)",
  problem_category: "var(--tag-problem-category)",
  company_size: "var(--tag-company-size)",
  technology: "var(--tag-technology)",
};

export function TagBadge({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  const colorVar = categoryVar[category];

  return (
    <Badge
      variant="outline"
      className="border-transparent"
      style={
        colorVar
          ? {
              backgroundColor: `color-mix(in oklch, ${colorVar} 15%, transparent)`,
              color: colorVar,
            }
          : undefined
      }
    >
      {name}
    </Badge>
  );
}
