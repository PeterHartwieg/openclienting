"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewOrganizationVerification, reviewMembership } from "@/lib/actions/moderate-organizations";
import type { VerificationDecision } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface VerificationActionsProps {
  targetType: "organization" | "membership";
  targetId: string;
}

export function VerificationActions({ targetType, targetId }: VerificationActionsProps) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAction(decision: VerificationDecision) {
    setLoading(true);

    const result =
      targetType === "organization"
        ? await reviewOrganizationVerification({
            organizationId: targetId,
            decision,
            notes: notes || undefined,
          })
        : await reviewMembership({
            membershipId: targetId,
            decision,
            notes: notes || undefined,
          });

    setLoading(false);

    if (result.success) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={() => handleAction("approved")}
          disabled={loading}
          size="sm"
        >
          Approve
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowReject(!showReject)}
          disabled={loading}
        >
          Reject
        </Button>
      </div>

      {showReject && (
        <div className="space-y-2">
          <Textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction("rejected")}
            disabled={loading}
          >
            Confirm Rejection
          </Button>
        </div>
      )}
    </div>
  );
}
