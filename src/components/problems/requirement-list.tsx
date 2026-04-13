import { Card, CardContent } from "@/components/ui/card";
import { UpvoteButton } from "@/components/shared/upvote-button";
import { EditRequirementInline } from "@/components/problems/edit-requirement-inline";

interface Requirement {
  id: string;
  body: string;
  anonymous: boolean;
  upvote_count: number;
  author_id?: string;
  profiles?: { display_name: string | null } | null;
}

interface RequirementListProps {
  requirements: Requirement[];
  userVotes?: Set<string>;
  currentUserId?: string;
}

export function RequirementList({ requirements, userVotes, currentUserId }: RequirementListProps) {
  if (requirements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No requirements have been added yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requirements.map((req) => (
        <Card key={req.id}>
          <CardContent className="flex items-start gap-4 pt-4">
            <UpvoteButton
              targetType="requirement"
              targetId={req.id}
              initialCount={req.upvote_count}
              initialVoted={userVotes?.has(req.id) ?? false}
            />
            <div className="flex-1">
              <p className="text-sm">{req.body}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {req.anonymous
                    ? "Anonymous"
                    : req.profiles?.display_name ?? "Unknown"}
                </p>
                {currentUserId && currentUserId === req.author_id && (
                  <EditRequirementInline requirementId={req.id} currentBody={req.body} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
