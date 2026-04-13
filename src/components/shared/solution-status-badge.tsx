import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  unsolved: {
    label: "Unsolved",
    className: "border-muted-foreground/30 text-muted-foreground",
  },
  has_approaches: {
    label: "Has Approaches",
    className: "border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  successful_pilot: {
    label: "Successful Pilot",
    className: "border-green-500/30 text-green-600 dark:text-green-400",
  },
};

export function SolutionStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.unsolved;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
