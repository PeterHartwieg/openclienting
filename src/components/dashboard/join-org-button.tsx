"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestMembership } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";

export function JoinOrgButton({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await requestMembership(organizationId);
      if (result.success) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return <p className="text-sm text-muted-foreground">Request sent</p>;
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={isPending} size="sm" variant="outline">
        {isPending ? "Requesting..." : "Request to Join"}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
