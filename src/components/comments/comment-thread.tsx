"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/i18n/format";

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

function CommentItem({
  comment,
  locale,
  anonymousLabel,
  unknownLabel,
}: {
  comment: Comment;
  locale: string;
  anonymousLabel: string;
  unknownLabel: string;
}) {
  const renderMeta = (c: Comment) =>
    [
      c.is_publicly_anonymous
        ? anonymousLabel
        : c.profiles?.display_name ?? unknownLabel,
      c.is_org_anonymous ? null : c.organizations?.name ?? null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="space-y-2">
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm">{comment.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {renderMeta(comment)}
            {" · "}
            {formatDate(comment.created_at, locale, "short")}
          </p>
        </CardContent>
      </Card>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {comment.replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-4">
                <p className="text-sm">{reply.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {renderMeta(reply)}
                  {" · "}
                  {formatDate(reply.created_at, locale, "short")}
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
  const locale = useLocale();
  const t = useTranslations("problemDetail");
  const tErrors = useTranslations("errors");

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
    return <p className="text-sm text-muted-foreground">{t("comments")}</p>;
  }

  return (
    <div className="space-y-4">
      {threaded.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          locale={locale}
          anonymousLabel={t("anonymous")}
          unknownLabel={tErrors("notFound")}
        />
      ))}
    </div>
  );
}
