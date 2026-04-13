"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { leaveOrganization } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";

export function LeaveOrgButton({ organizationId, locale }: { organizationId: string; locale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");
    startTransition(async () => {
      const result = await leaveOrganization(organizationId);
      if (result.success) {
        router.push(`/${locale}/dashboard/organizations`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={isPending} size="sm" variant="destructive">
        {isPending ? "Leaving..." : "Leave Organization"}
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
