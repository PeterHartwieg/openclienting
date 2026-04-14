"use client";

import { useState, useTransition } from "react";
import { createOrganization } from "@/lib/actions/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function CreateOrgForm({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    website: "",
    description: "",
    employeeCount: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await createOrganization({
        name: form.name,
        website: form.website || undefined,
        description: form.description || undefined,
        employeeCount: form.employeeCount ? parseInt(form.employeeCount, 10) : undefined,
      });

      if (result.success) {
        // Navigate outside the transition to avoid keeping it pending
        window.location.href = `/${locale}/dashboard/organizations/${result.organizationId}`;
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Acme Corp"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://example.com"
          type="url"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="employeeCount">Number of Employees</Label>
        <Input
          id="employeeCount"
          value={form.employeeCount}
          onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
          placeholder="e.g. 50"
          type="number"
          min={0}
        />
        <p className="text-xs text-muted-foreground">
          Used to classify your organization size (Micro, Small, Medium, Large)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of your organization"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Organization"}
      </Button>
    </form>
  );
}
