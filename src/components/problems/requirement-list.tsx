import { Card, CardContent } from "@/components/ui/card";
import { UpvoteButton } from "@/components/shared/upvote-button";
import { EditRequirementInline } from "@/components/problems/edit-requirement-inline";
import { TranslateThisLink } from "@/components/translations/translate-this-link";

interface Requirement {
  id: string;
  body: string;
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean;
  upvote_count: number;
  author_id?: string;
  profiles?: { display_name: string | null } | null;
  organizations?: { id: string; name: string } | null;
}

interface RequirementListProps {
  requirements: Requirement[];
  userVotes?: Set<string>;
  currentUserId?: string;
  locale: string;
}

export function RequirementList({ requirements, userVotes, currentUserId, locale }: RequirementListProps) {
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
                  {[
                    req.is_publicly_anonymous ? "Anonymous" : (req.profiles?.display_name ?? "Unknown"),
                    req.is_org_anonymous ? null : (req.organizations?.name ?? null),
                  ].filter(Boolean).join(" · ")}
                </p>
                {currentUserId && currentUserId === req.author_id && (
                  <EditRequirementInline requirementId={req.id} currentBody={req.body} />
                )}
                <TranslateThisLink
                  locale={locale}
                  targetType="requirement"
                  targetId={req.id}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
