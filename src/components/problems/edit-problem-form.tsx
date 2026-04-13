"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editProblem } from "@/lib/actions/edit-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditProblemFormProps {
  problemId: string;
  currentTitle: string;
  currentDescription: string;
}

export function EditProblemForm({ problemId, currentTitle, currentDescription }: EditProblemFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editProblem({ problemId, title, description });
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <Label className="text-sm">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label className="text-sm">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); setTitle(currentTitle); setDescription(currentDescription); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
