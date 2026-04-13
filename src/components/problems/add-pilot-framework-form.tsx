"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPilotFramework } from "@/lib/actions/pilot-frameworks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function AddPilotFrameworkForm({ problemId }: { problemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPubliclyAnonymous, setIsPubliclyAnonymous] = useState(false);
  const [isOrgAnonymous, setIsOrgAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    scope: "",
    suggestedKpis: "",
    successCriteria: "",
    commonPitfalls: "",
    duration: "",
    resourceCommitment: "",
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Add Pilot Framework
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitPilotFramework({ problemId, ...form, isPubliclyAnonymous, isOrgAnonymous });
      if (result.success) {
        setForm({
          scope: "",
          suggestedKpis: "",
          successCriteria: "",
          commonPitfalls: "",
          duration: "",
          resourceCommitment: "",
        });
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id="fw-anon-person" checked={isPubliclyAnonymous} onCheckedChange={(c) => setIsPubliclyAnonymous(c === true)} />
          <Label htmlFor="fw-anon-person" className="text-sm">Hide my personal identity publicly</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="fw-anon-org" checked={isOrgAnonymous} onCheckedChange={(c) => setIsOrgAnonymous(c === true)} />
          <Label htmlFor="fw-anon-org" className="text-sm">Hide my organization identity publicly</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your pilot framework will be reviewed by moderators before appearing publicly.
      </p>
    </form>
  );
}
