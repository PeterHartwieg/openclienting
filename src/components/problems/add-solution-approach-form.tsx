"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSolutionApproach } from "@/lib/actions/solution-approaches";
import type { TechnologyType, Maturity } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const technologyOptions: { value: TechnologyType; label: string }[] = [
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
  { value: "platform", label: "Platform" },
  { value: "service", label: "Service" },
];

const maturityOptions: { value: Maturity; label: string }[] = [
  { value: "emerging", label: "Emerging" },
  { value: "growing", label: "Growing" },
  { value: "established", label: "Established" },
];

export function AddSolutionApproachForm({ problemId }: { problemId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPubliclyAnonymous, setIsPubliclyAnonymous] = useState(false);
  const [isOrgAnonymous, setIsOrgAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: "",
    description: "",
    technologyType: "software" as TechnologyType,
    maturity: "emerging" as Maturity,
    complexity: "",
    priceRange: "",
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Propose Solution Approach
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitSolutionApproach({ problemId, ...form, isPubliclyAnonymous, isOrgAnonymous });
      if (result.success) {
        setForm({
          title: "",
          description: "",
          technologyType: "software",
          maturity: "emerging",
          complexity: "",
          priceRange: "",
        });
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1">
        <Label className="text-sm">Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Name of the solution approach"
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-sm">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the solution approach, how it addresses the problem..."
          rows={4}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm">Technology Type</Label>
          <select
            value={form.technologyType}
            onChange={(e) => setForm({ ...form, technologyType: e.target.value as TechnologyType })}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {technologyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Maturity</Label>
          <select
            value={form.maturity}
            onChange={(e) => setForm({ ...form, maturity: e.target.value as Maturity })}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {maturityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Complexity (optional)</Label>
          <Input
            value={form.complexity}
            onChange={(e) => setForm({ ...form, complexity: e.target.value })}
            placeholder="e.g. Low, Medium, High"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Price Range (optional)</Label>
          <Input
            value={form.priceRange}
            onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
            placeholder="e.g. $1k-$10k/month"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id="sa-anon-person" checked={isPubliclyAnonymous} onCheckedChange={(c) => setIsPubliclyAnonymous(c === true)} />
          <Label htmlFor="sa-anon-person" className="text-sm">Hide my personal identity publicly</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="sa-anon-org" checked={isOrgAnonymous} onCheckedChange={(c) => setIsOrgAnonymous(c === true)} />
          <Label htmlFor="sa-anon-org" className="text-sm">Hide my organization identity publicly</Label>
        </div>
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
        Your solution approach will be reviewed by moderators before appearing publicly.
      </p>
    </form>
  );
}
