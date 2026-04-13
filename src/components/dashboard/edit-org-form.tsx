"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function EditOrgForm({
  organizationId,
  initialValues,
}: {
  organizationId: string;
  initialValues: {
    name: string;
    website: string | null;
    description: string | null;
    employeeCount: number | null;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: initialValues.name,
    website: initialValues.website ?? "",
    description: initialValues.description ?? "",
    employeeCount: initialValues.employeeCount?.toString() ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    startTransition(async () => {
      const result = await updateOrganization({
        organizationId,
        name: form.name,
        website: form.website,
        description: form.description,
        employeeCount: form.employeeCount ? parseInt(form.employeeCount, 10) : null,
      });

      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Organization Name</Label>
        <Input
          id="edit-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-website">Website</Label>
        <Input
          id="edit-website"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://example.com"
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-employees">Number of Employees</Label>
        <Input
          id="edit-employees"
          value={form.employeeCount}
          onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
          placeholder="e.g. 50"
          type="number"
          min={0}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-600">Changes saved.</p>}

      <Button type="submit" disabled={isPending} size="sm">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
