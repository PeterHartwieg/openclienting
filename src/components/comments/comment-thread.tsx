"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/i18n/format";
import { OrgLink } from "@/components/organizations/org-link";
import { AuthorAvatar } from "@/components/shared/author-avatar";

interface Comment {
  id: string;
  body: string;
  is_publicly_anonymous: boolean;
  is_org_anonymous?: boolean;
  parent_comment_id: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url?: string | null;
  } | null;
  organizations?: {
    id: string;
    name: string;
    slug?: string | null;
    verification_status?: string | null;
  } | null;
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
  const renderMeta = (c: Comment) => {
    const author = c.is_publicly_anonymous
      ? anonymousLabel
      : c.profiles?.display_name ?? unknownLabel;
    const org = c.is_org_anonymous ? null : c.organizations ?? null;
    return (
      <>
        {author}
        {org?.name && (
          <>
            {" \u00B7 "}
            <OrgLink
              name={org.name}
              slug={org.slug}
              verificationStatus={org.verification_status}
              locale={locale}
              className="hover:underline"
            />
          </>
        )}
      </>
    );
  };

  const renderAvatar = (c: Comment) =>
    c.is_publicly_anonymous ? (
      <AuthorAvatar avatarUrl={null} name={null} size={20} />
    ) : (
      <AuthorAvatar
        avatarUrl={c.profiles?.avatar_url ?? null}
        name={c.profiles?.display_name}
        size={20}
      />
    );

  return (
    <div className="space-y-2">
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm">{comment.body}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {renderAvatar(comment)}
            <span>
              {renderMeta(comment)}
              {" \u00B7 "}
              {formatDate(comment.created_at, locale, "short")}
            </span>
          </div>
        </CardContent>
      </Card>
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {comment.replies.map((reply) => (
            <Card key={reply.id}>
              <CardContent className="pt-4">
                <p className="text-sm">{reply.body}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {renderAvatar(reply)}
                  <span>
                    {renderMeta(reply)}
                    {" \u00B7 "}
                    {formatDate(reply.created_at, locale, "short")}
                  </span>
                </div>
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
