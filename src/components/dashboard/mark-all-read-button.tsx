"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkAllReadButtonProps {
  unreadCount: number;
  label: string;
}

export function MarkAllReadButton({ unreadCount, label }: MarkAllReadButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (unreadCount === 0) return null;

  function handleClick() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-muted-foreground",
      )}
    >
      {isPending ? "…" : label}
    </button>
  );
}
