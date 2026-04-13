"use client";

import { useState, useTransition } from "react";
import { toggleVote } from "@/lib/actions/vote";
import { Button } from "@/components/ui/button";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [animate, setAnimate] = useState(false);

  function handleClick() {
    // Optimistic update
    const wasVoted = voted;
    setVoted(!wasVoted);
    setCount((c) => (wasVoted ? c - 1 : c + 1));

    if (!wasVoted) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 300);
    }

    startTransition(async () => {
      const result = await toggleVote(targetType, targetId);
      if (result.success) {
        setVoted(result.voted ?? false);
        setCount(
          wasVoted
            ? initialCount + (result.voted ? 1 : 0)
            : initialCount + (result.voted ? 1 : 0)
        );
      } else {
        // Rollback on error
        setVoted(wasVoted);
        setCount((c) => (wasVoted ? c + 1 : c - 1));
      }
    });
  }

  return (
    <Button
      variant={voted ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={voted ? "Remove upvote" : "Upvote"}
      className={cn(
        "flex items-center gap-1.5 transition-all",
        voted && "bg-accent text-accent-foreground border-accent hover:bg-accent/80",
        animate && "animate-[vote-pop_0.3s_ease-out]"
      )}
    >
      <ArrowBigUp
        className={cn(
          "h-4 w-4 transition-transform",
          voted && "fill-current"
        )}
      />
      <span>{count}</span>
    </Button>
  );
}
