"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { reviewMembership } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";

export function MembershipActions({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await reviewMembership({ membershipId, decision });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Action failed");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={isPending} onClick={() => decide("approved")}>
        {isPending ? "..." : "Approve"}
      </Button>
      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => decide("rejected")}>
        {isPending ? "..." : "Reject"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
