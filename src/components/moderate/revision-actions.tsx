"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveRevision, revertRevision } from "@/app/[locale]/moderate/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EditDiff } from "@/lib/types/database";

interface RevisionActionsProps {
  revisionId: string;
  diff: EditDiff;
}

export function RevisionActions({ revisionId, diff }: RevisionActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  async function handleApprove() {
    setLoading(true);
    const result = await approveRevision(revisionId, notes || undefined);
    setLoading(false);
    if (result.success) router.refresh();
  }

  async function handleRevert() {
    setLoading(true);
    const result = await revertRevision(revisionId, notes || undefined);
    setLoading(false);
    if (result.success) router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {Object.entries(diff).map(([field, values]) => (
          <div key={field} className="rounded border p-2 text-sm">
            <p className="font-medium">{field}</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              <div className="rounded bg-red-500/10 p-1.5 text-xs">
                <span className="font-medium text-red-600 dark:text-red-400">Before: </span>
                {values.old ?? "(empty)"}
              </div>
              <div className="rounded bg-green-500/10 p-1.5 text-xs">
                <span className="font-medium text-green-600 dark:text-green-400">After: </span>
                {values.new ?? "(empty)"}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Textarea
        placeholder="Reviewer notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApprove} disabled={loading}>
          Approve
        </Button>
        <Button variant="destructive" size="sm" onClick={handleRevert} disabled={loading}>
          Revert
        </Button>
      </div>
    </div>
  );
}
