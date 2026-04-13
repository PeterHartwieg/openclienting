"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CommentFormProps {
  targetId: string;
  parentCommentId?: string;
}

export function CommentForm({ targetId, parentCommentId }: CommentFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPubliclyAnonymous, setIsPubliclyAnonymous] = useState(false);
  const [isOrgAnonymous, setIsOrgAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitComment({
        targetType: "problem_template",
        targetId,
        body,
        isPubliclyAnonymous,
        isOrgAnonymous,
        parentCommentId,
      });
      if (result.success) {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Write a comment..."}
        rows={3}
        required
      />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`comment-anon-person-${parentCommentId ?? "top"}`}
              checked={isPubliclyAnonymous}
              onCheckedChange={(c) => setIsPubliclyAnonymous(c === true)}
            />
            <Label htmlFor={`comment-anon-person-${parentCommentId ?? "top"}`} className="text-sm">
              Hide my identity
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`comment-anon-org-${parentCommentId ?? "top"}`}
              checked={isOrgAnonymous}
              onCheckedChange={(c) => setIsOrgAnonymous(c === true)}
            />
            <Label htmlFor={`comment-anon-org-${parentCommentId ?? "top"}`} className="text-sm">
              Hide my organization
            </Label>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
