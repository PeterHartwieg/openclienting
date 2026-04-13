import { Card, CardContent } from "@/components/ui/card";

interface Comment {
  id: string;
  body: string;
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean;
  parent_comment_id: string | null;
  created_at: string;
  profiles?: { display_name: string | null } | null;
  organizations?: { id: string; name: string } | null;
  replies?: Comment[];
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="space-y-2">
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm">{comment.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {[
              comment.is_publicly_anonymous ? "Anonymous" : (comment.profiles?.display_name ?? "Unknown"),
              comment.is_org_anonymous ? null : (comment.organizations?.name ?? null),
            ].filter(Boolean).join(" · ")}{" · "}
            {new Date(comment.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </CardContent>
      </Card>
      {/* One-level replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {comment.replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-4">
                <p className="text-sm">{reply.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    reply.is_publicly_anonymous ? "Anonymous" : (reply.profiles?.display_name ?? "Unknown"),
                    reply.is_org_anonymous ? null : (reply.organizations?.name ?? null),
                  ].filter(Boolean).join(" · ")}{" · "}
                  {new Date(reply.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comments }: { comments: Comment[] }) {
  // Organize into threads: top-level comments + their replies
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replyMap = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parent_comment_id) {
      const existing = replyMap.get(c.parent_comment_id) ?? [];
      existing.push(c);
      replyMap.set(c.parent_comment_id, existing);
    }
  }

  const threaded = topLevel.map((c) => ({
    ...c,
    replies: replyMap.get(c.id) ?? [],
  }));

  if (threaded.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet. Be the first to start the discussion.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {threaded.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
