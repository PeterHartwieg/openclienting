"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOrganizationVerification } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";

export function RequestVerificationButton({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await requestOrganizationVerification(organizationId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={isPending} size="sm">
        {isPending ? "Requesting..." : "Request Verification"}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
