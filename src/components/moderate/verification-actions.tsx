"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewOrganizationVerification } from "@/lib/actions/moderate-organizations";
import type { VerificationDecision } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function VerificationActions({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAction(decision: VerificationDecision) {
    setLoading(true);
    const result = await reviewOrganizationVerification({
      organizationId,
      decision,
      notes: notes.trim() || undefined,
    });
    setLoading(false);
    if (result.success) router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes (optional — stored in audit log regardless of decision)</Label>
        <Textarea
          placeholder="Reason for approval or rejection..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleAction("approved")} disabled={loading} size="sm">
          {loading ? "..." : "Approve"}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => handleAction("rejected")} disabled={loading}>
          {loading ? "..." : "Reject"}
        </Button>
      </div>
    </div>
  );
}
