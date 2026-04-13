"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editPilotFramework } from "@/lib/actions/edit-content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditPilotFrameworkFormProps {
  frameworkId: string;
  current: {
    scope: string | null;
    suggested_kpis: string | null;
    success_criteria: string | null;
    common_pitfalls: string | null;
    duration: string | null;
    resource_commitment: string | null;
  };
}

export function EditPilotFrameworkForm({ frameworkId, current }: EditPilotFrameworkFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    scope: current.scope ?? "",
    suggestedKpis: current.suggested_kpis ?? "",
    successCriteria: current.success_criteria ?? "",
    commonPitfalls: current.common_pitfalls ?? "",
    duration: current.duration ?? "",
    resourceCommitment: current.resource_commitment ?? "",
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
      const result = await editPilotFramework({ frameworkId, ...form });
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">Scope</Label>
          <Textarea value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Duration</Label>
          <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Suggested KPIs</Label>
          <Textarea value={form.suggestedKpis} onChange={(e) => setForm({ ...form, suggestedKpis: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Success Criteria</Label>
          <Textarea value={form.successCriteria} onChange={(e) => setForm({ ...form, successCriteria: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Common Pitfalls</Label>
          <Textarea value={form.commonPitfalls} onChange={(e) => setForm({ ...form, commonPitfalls: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Resource Commitment</Label>
          <Textarea value={form.resourceCommitment} onChange={(e) => setForm({ ...form, resourceCommitment: e.target.value })} rows={2} />
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
