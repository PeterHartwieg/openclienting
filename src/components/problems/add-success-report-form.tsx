"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSuccessReport } from "@/lib/actions/success-reports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function AddSuccessReportForm({ solutionApproachId }: { solutionApproachId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Report Success
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitSuccessReport({ solutionApproachId, body, anonymous });
      if (result.success) {
        setBody("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Describe the successful pilot — what was the outcome, evidence, context..."
        rows={4}
        required
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="sr-anon"
          checked={anonymous}
          onCheckedChange={(c) => setAnonymous(c === true)}
        />
        <Label htmlFor="sr-anon" className="text-sm">Submit anonymously</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your success report will be reviewed by moderators before appearing publicly.
      </p>
    </form>
  );
}
