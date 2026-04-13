import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpvoteButton } from "@/components/shared/upvote-button";
import { EditPilotFrameworkForm } from "@/components/problems/edit-pilot-framework-form";

interface PilotFramework {
  id: string;
  scope: string | null;
  suggested_kpis: string | null;
  success_criteria: string | null;
  common_pitfalls: string | null;
  duration: string | null;
  resource_commitment: string | null;
  anonymous: boolean;
  upvote_count: number;
  author_id?: string;
  profiles?: { display_name: string | null } | null;
}

interface PilotFrameworkListProps {
  frameworks: PilotFramework[];
  userVotes?: Set<string>;
  currentUserId?: string;
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export function PilotFrameworkList({ frameworks, userVotes, currentUserId }: PilotFrameworkListProps) {
  if (frameworks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pilot frameworks have been added yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {frameworks.map((fw) => (
        <Card key={fw.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pilot Framework</CardTitle>
              <UpvoteButton
                targetType="pilot_framework"
                targetId={fw.id}
                initialCount={fw.upvote_count}
                initialVoted={userVotes?.has(fw.id) ?? false}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {fw.anonymous
                ? "Anonymous"
                : fw.profiles?.display_name ?? "Unknown"}
            </p>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Field label="Scope" value={fw.scope} />
              <Field label="Duration" value={fw.duration} />
              <Field label="Suggested KPIs" value={fw.suggested_kpis} />
              <Field label="Success Criteria" value={fw.success_criteria} />
              <Field label="Common Pitfalls" value={fw.common_pitfalls} />
              <Field label="Resource Commitment" value={fw.resource_commitment} />
            </dl>
            {currentUserId && currentUserId === fw.author_id && (
              <EditPilotFrameworkForm frameworkId={fw.id} current={fw} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
