import { Badge } from "@/components/ui/badge";

const categoryColors: Record<string, string> = {
  industry: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  function: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  problem_category: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  company_size: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  technology: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
};

export function TagBadge({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  return (
    <Badge
      variant="outline"
      className={categoryColors[category] ?? ""}
    >
      {name}
    </Badge>
  );
}
