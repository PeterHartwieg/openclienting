import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SuccessReport {
  id: string;
  report_summary: string;
  pilot_date_range?: string | null;
  deployment_scope?: string | null;
  kpi_summary?: string | null;
  evidence_notes?: string | null;
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean;
  verification_status?: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
  organizations?: { id: string; name: string } | null;
}

interface SuccessReportListProps {
  reports: SuccessReport[];
}

function VerificationBadge({ status }: { status?: string }) {
  if (status === "verified") {
    return <Badge className="bg-green-600 text-white text-xs">Verified</Badge>;
  }
  if (status === "under_review") {
    return <Badge variant="outline" className="text-yellow-600 border-yellow-500 text-xs">Under review</Badge>;
  }
  return <Badge variant="outline" className="text-xs">Submitted</Badge>;
}

export function SuccessReportList({ reports }: SuccessReportListProps) {
  if (reports.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Success Reports ({reports.length})
      </p>
      {reports.map((report) => {
        const authorLabel = report.is_publicly_anonymous
          ? "Anonymous"
          : report.profiles?.display_name ?? "Unknown";

        const orgLabel = report.is_org_anonymous
          ? null
          : (report.organizations as { id: string; name: string } | null)?.name ?? null;

        const attribution = [authorLabel, orgLabel].filter(Boolean).join(" · ");

        const hasDetails =
          report.pilot_date_range ||
          report.deployment_scope ||
          report.kpi_summary ||
          report.evidence_notes;

        return (
          <Card key={report.id} className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm whitespace-pre-wrap flex-1">{report.report_summary}</p>
                <VerificationBadge status={report.verification_status} />
              </div>

              {hasDetails && (
                <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                  {report.pilot_date_range && (
                    <p><span className="font-medium">Period:</span> {report.pilot_date_range}</p>
                  )}
                  {report.deployment_scope && (
                    <p><span className="font-medium">Scope:</span> {report.deployment_scope}</p>
                  )}
                  {report.kpi_summary && (
                    <p><span className="font-medium">KPIs:</span> {report.kpi_summary}</p>
                  )}
                  {report.evidence_notes && (
                    <p><span className="font-medium">Evidence:</span> {report.evidence_notes}</p>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {attribution}
                {" · "}
                {new Date(report.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
