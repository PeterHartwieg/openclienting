import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpvoteButton } from "@/components/shared/upvote-button";
import { SuccessReportList } from "@/components/problems/success-report-list";
import { AddSuccessReportForm } from "@/components/problems/add-success-report-form";
import { EditSolutionApproachForm } from "@/components/problems/edit-solution-approach-form";

interface SuccessReport {
  id: string;
  report_summary: string;
  is_publicly_anonymous: boolean;
  status: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

interface SolutionApproach {
  id: string;
  title: string;
  description: string;
  technology_type: string;
  maturity: string;
  complexity: string | null;
  price_range: string | null;
  is_publicly_anonymous: boolean;
  upvote_count: number;
  author_id?: string;
  profiles?: { display_name: string | null } | null;
  success_reports?: SuccessReport[];
}

interface SolutionApproachListProps {
  approaches: SolutionApproach[];
  userVotes?: Set<string>;
  isAuthenticated?: boolean;
  currentUserId?: string;
}

const technologyLabels: Record<string, string> = {
  software: "Software",
  hardware: "Hardware",
  platform: "Platform",
  service: "Service",
};

const maturityLabels: Record<string, string> = {
  emerging: "Emerging",
  growing: "Growing",
  established: "Established",
};

export function SolutionApproachList({ approaches, userVotes, isAuthenticated, currentUserId }: SolutionApproachListProps) {
  if (approaches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No solution approaches have been proposed yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {approaches.map((sa) => {
        const publishedReports = (sa.success_reports ?? []).filter(
          (r) => r.status === "published"
        );
        return (
        <Card key={sa.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start gap-4">
              <UpvoteButton
                targetType="solution_approach"
                targetId={sa.id}
                initialCount={sa.upvote_count}
                initialVoted={userVotes?.has(sa.id) ?? false}
              />
              <div className="flex-1">
                <CardTitle className="text-base">{sa.title}</CardTitle>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {technologyLabels[sa.technology_type] ?? sa.technology_type}
                  </Badge>
                  <Badge variant="outline">
                    {maturityLabels[sa.maturity] ?? sa.maturity}
                  </Badge>
                  {sa.complexity && (
                    <Badge variant="outline">{sa.complexity}</Badge>
                  )}
                  {sa.price_range && (
                    <Badge variant="outline">{sa.price_range}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pl-[4.5rem]">
            <p className="text-sm whitespace-pre-wrap">{sa.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {sa.is_publicly_anonymous
                ? "Anonymous"
                : sa.profiles?.display_name ?? "Unknown"}
            </p>
            {currentUserId && currentUserId === sa.author_id && (
              <div className="mt-2">
                <EditSolutionApproachForm approachId={sa.id} current={sa} />
              </div>
            )}
            {publishedReports.length > 0 && (
              <SuccessReportList reports={publishedReports} />
            )}
            {isAuthenticated && (
              <div className="mt-3">
                <AddSuccessReportForm solutionApproachId={sa.id} />
              </div>
            )}
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
