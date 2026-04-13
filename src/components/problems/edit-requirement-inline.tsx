"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editRequirement } from "@/lib/actions/edit-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditRequirementInlineProps {
  requirementId: string;
  currentBody: string;
}

export function EditRequirementInline({ requirementId, currentBody }: EditRequirementInlineProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(currentBody);
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-xs">
        Edit
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editRequirement({ requirementId, body });
      if (result.success) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} required />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setBody(currentBody); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
