"use client";

import { useState, useTransition } from "react";
import { toggleVote } from "@/lib/actions/vote";
import { Button } from "@/components/ui/button";

interface UpvoteButtonProps {
  targetType: "requirement" | "pilot_framework";
  targetId: string;
  initialCount: number;
  initialVoted: boolean;
}

export function UpvoteButton({
  targetType,
  targetId,
  initialCount,
  initialVoted,
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleVote(targetType, targetId);
      if (result.success) {
        setVoted(result.voted ?? false);
        setCount((c) => (result.voted ? c + 1 : c - 1));
      }
    });
  }

  return (
    <Button
      variant={voted ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5"
    >
      <span className="text-xs">&#9650;</span>
      <span>{count}</span>
    </Button>
  );
}
