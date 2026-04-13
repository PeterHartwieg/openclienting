"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitProblem } from "@/app/[locale]/submit/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { TagSelector } from "@/components/submit/tag-selector";

interface TagOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface ProblemFormProps {
  tagsByCategory: Record<string, TagOption[]>;
  locale: string;
}

export function ProblemForm({ tagsByCategory, locale }: ProblemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [pilotFramework, setPilotFramework] = useState({
    scope: "",
    suggested_kpis: "",
    success_criteria: "",
    common_pitfalls: "",
    duration: "",
    resource_commitment: "",
  });

  function addRequirement() {
    setRequirements([...requirements, ""]);
  }

  function updateRequirement(index: number, value: string) {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  }

  function removeRequirement(index: number) {
    if (requirements.length <= 1) return;
    setRequirements(requirements.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await submitProblem({
      title,
      description,
      anonymous,
      tagIds: selectedTagIds,
      requirements,
      pilotFramework,
    });

    setLoading(false);

    if (result.success) {
      router.push(`/${locale}/dashboard`);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Problem Definition */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Problem Definition</h2>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Manual quality inspection in manufacturing lines"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem in detail: what is the current situation, what are the pain points, and what would an ideal solution look like?"
            rows={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <p className="text-sm text-muted-foreground">
            Select at least one tag from each category.
          </p>
          <TagSelector
            tagsByCategory={tagsByCategory}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
          />
        </div>
      </section>

      <Separator />

      {/* Requirements */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Requirements</h2>
        <p className="text-sm text-muted-foreground">
          What must any solution achieve? Add one requirement per field.
        </p>

        {requirements.map((req, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={req}
              onChange={(e) => updateRequirement(i, e.target.value)}
              placeholder={`Requirement ${i + 1}`}
              rows={2}
              className="flex-1"
            />
            {requirements.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRequirement(i)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
          Add requirement
        </Button>
      </section>

      <Separator />

      {/* Pilot Framework */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pilot Framework</h2>
        <p className="text-sm text-muted-foreground">
          Help others understand how to pilot a solution for this problem.
          All fields are optional.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Textarea
              id="scope"
              value={pilotFramework.scope}
              onChange={(e) =>
                setPilotFramework({ ...pilotFramework, scope: e.target.value })
              }
              placeholder="What should a pilot cover?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={pilotFramework.duration}
              onChange={(e) =>
                setPilotFramework({ ...pilotFramework, duration: e.target.value })
              }
              placeholder="e.g., 3 months"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kpis">Suggested KPIs</Label>
            <Textarea
              id="kpis"
              value={pilotFramework.suggested_kpis}
              onChange={(e) =>
                setPilotFramework({ ...pilotFramework, suggested_kpis: e.target.value })
              }
              placeholder="How should success be measured?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="criteria">Success Criteria</Label>
            <Textarea
              id="criteria"
              value={pilotFramework.success_criteria}
              onChange={(e) =>
                setPilotFramework({ ...pilotFramework, success_criteria: e.target.value })
              }
              placeholder="What determines a successful pilot?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pitfalls">Common Pitfalls</Label>
            <Textarea
              id="pitfalls"
              value={pilotFramework.common_pitfalls}
              onChange={(e) =>
                setPilotFramework({ ...pilotFramework, common_pitfalls: e.target.value })
              }
              placeholder="What should teams watch out for?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resources">Resource Commitment</Label>
            <Textarea
              id="resources"
              value={pilotFramework.resource_commitment}
              onChange={(e) =>
                setPilotFramework({
                  ...pilotFramework,
                  resource_commitment: e.target.value,
                })
              }
              placeholder="What resources are needed?"
              rows={3}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Anonymity & Submit */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="anonymous"
            checked={anonymous}
            onCheckedChange={(checked) => setAnonymous(checked === true)}
          />
          <Label htmlFor="anonymous">
            Submit anonymously (your identity is stored but not shown publicly)
          </Label>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Submitting..." : "Submit for Review"}
        </Button>
      </section>
    </form>
  );
}
