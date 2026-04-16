"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { moderateSuccessReport } from "@/app/[locale]/(shell)/moderate/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SuccessReportReviewProps {
  reportId: string;
  reportSummary: string;
  pilotDateRange?: string | null;
  deploymentScope?: string | null;
  kpiSummary?: string | null;
  evidenceNotes?: string | null;
  // True attribution always shown to moderators
  submitterName: string | null;
  organizationName: string | null;
  isPubliclyAnonymous: boolean;
  isOrgAnonymous: boolean;
  verificationStatus: string;
}

export function SuccessReportReview({
  reportId,
  reportSummary,
  pilotDateRange,
  deploymentScope,
  kpiSummary,
  evidenceNotes,
  submitterName,
  organizationName,
  isPubliclyAnonymous,
  isOrgAnonymous,
  verificationStatus,
}: SuccessReportReviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "verify" | "reject") {
    setError(null);
    startTransition(async () => {
      const result = await moderateSuccessReport({ reportId, decision });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Action failed");
      }
    });
  }

  const alreadyDecided = verificationStatus === "verified" || verificationStatus === "rejected";

  return (
    <div className="space-y-3">
      {/* Evidence fields */}
      <div className="space-y-1.5 text-sm">
        <p className="whitespace-pre-wrap">{reportSummary}</p>
        {pilotDateRange && (
          <p className="text-muted-foreground"><span className="font-medium text-foreground">Period:</span> {pilotDateRange}</p>
        )}
        {deploymentScope && (
          <p className="text-muted-foreground"><span className="font-medium text-foreground">Scope:</span> {deploymentScope}</p>
        )}
        {kpiSummary && (
          <p className="text-muted-foreground"><span className="font-medium text-foreground">KPIs:</span> {kpiSummary}</p>
        )}
        {evidenceNotes && (
          <p className="text-muted-foreground"><span className="font-medium text-foreground">Evidence:</span> {evidenceNotes}</p>
        )}
      </div>

      {/* True attribution (always visible to moderators) */}
      <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-0.5">
        <p className="font-medium text-muted-foreground uppercase tracking-wide mb-1">True attribution</p>
        <p>
          Submitter: <span className="font-medium">{submitterName ?? "Unknown"}</span>
          {isPubliclyAnonymous && <Badge variant="outline" className="ml-2 text-xs">publicly hidden</Badge>}
        </p>
        <p>
          Organization: <span className="font-medium">{organizationName ?? "None"}</span>
          {isOrgAnonymous && <Badge variant="outline" className="ml-2 text-xs">publicly hidden</Badge>}
        </p>
      </div>

      {alreadyDecided ? (
        <p className="text-xs text-muted-foreground">
          Decision recorded: <span className="font-medium">{verificationStatus}</span>
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isPending}
            onClick={() => decide("verify")}
          >
            {isPending ? "..." : "Verify"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => decide("reject")}
          >
            {isPending ? "..." : "Reject"}
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
