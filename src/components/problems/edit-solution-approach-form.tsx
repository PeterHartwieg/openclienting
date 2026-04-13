"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editSolutionApproach } from "@/lib/actions/edit-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditSolutionApproachFormProps {
  approachId: string;
  current: {
    title: string;
    description: string;
    complexity: string | null;
    price_range: string | null;
  };
}

export function EditSolutionApproachForm({ approachId, current }: EditSolutionApproachFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: current.title,
    description: current.description,
    complexity: current.complexity ?? "",
    priceRange: current.price_range ?? "",
  });

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-xs">
        Edit
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editSolutionApproach({ approachId, ...form });
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <Label className="text-sm">Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div className="space-y-1">
        <Label className="text-sm">Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">Complexity</Label>
          <Input value={form.complexity} onChange={(e) => setForm({ ...form, complexity: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Price Range</Label>
          <Input value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
