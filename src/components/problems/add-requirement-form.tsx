"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitRequirement } from "@/lib/actions/requirements";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function AddRequirementForm({ problemId }: { problemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add Requirement
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitRequirement({ problemId, body, anonymous });
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
        placeholder="Describe the requirement..."
        rows={3}
        required
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="req-anon"
          checked={anonymous}
          onCheckedChange={(c) => setAnonymous(c === true)}
        />
        <Label htmlFor="req-anon" className="text-sm">Submit anonymously</Label>
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
        Your requirement will be reviewed by moderators before appearing publicly.
      </p>
    </form>
  );
}
