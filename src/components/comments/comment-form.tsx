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
  const [anonymous, setAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitComment({
        targetType: "problem_template",
        targetId,
        body,
        anonymous,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`comment-anon-${parentCommentId ?? "top"}`}
            checked={anonymous}
            onCheckedChange={(c) => setAnonymous(c === true)}
          />
          <Label htmlFor={`comment-anon-${parentCommentId ?? "top"}`} className="text-sm">
            Anonymous
          </Label>
        </div>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
