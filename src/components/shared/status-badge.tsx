import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-transparent",
  },
  submitted: {
    label: "Submitted",
    className: "bg-warning/15 text-warning-foreground border-transparent",
  },
  in_review: {
    label: "In Review",
    className: "bg-primary/15 text-primary border-transparent",
  },
  published: {
    label: "Published",
    className: "bg-success/15 text-success border-transparent",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive border-transparent",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config?.className ?? ""}>
      {config?.label ?? status}
    </Badge>
  );
}
