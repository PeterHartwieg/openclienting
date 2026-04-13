import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  published: "Published",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusStyles[status] ?? ""}>
      {statusLabels[status] ?? status}
    </Badge>
  );
}
