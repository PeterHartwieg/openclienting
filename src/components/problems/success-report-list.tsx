import { Card, CardContent } from "@/components/ui/card";

interface SuccessReport {
  id: string;
  body: string;
  anonymous: boolean;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

interface SuccessReportListProps {
  reports: SuccessReport[];
}

export function SuccessReportList({ reports }: SuccessReportListProps) {
  if (reports.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Success Reports ({reports.length})
      </p>
      {reports.map((report) => (
        <Card key={report.id} className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-3">
            <p className="text-sm whitespace-pre-wrap">{report.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {report.anonymous
                ? "Anonymous"
                : report.profiles?.display_name ?? "Unknown"}
              {" · "}
              {new Date(report.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
