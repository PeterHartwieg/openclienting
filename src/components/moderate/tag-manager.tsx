"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTag, deleteTag } from "@/app/[locale]/moderate/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
}

const categories = [
  { value: "industry", label: "Industry" },
  { value: "function", label: "Function" },
  { value: "problem_category", label: "Problem Category" },
  { value: "company_size", label: "Company Size" },
  { value: "technology", label: "Technology" },
];

export function TagManager({
  tagsByCategory,
}: {
  tagsByCategory: Record<string, Tag[]>;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category) return;

    setLoading(true);
    setError("");

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const result = await createTag({ name: name.trim(), slug, category });
    setLoading(false);

    if (result.success) {
      setName("");
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create tag.");
    }
  }

  async function handleDelete(tagId: string) {
    const result = await deleteTag(tagId);
    if (result.success) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {/* Add tag form */}
      <form onSubmit={handleCreate} className="space-y-3">
        <h3 className="text-lg font-semibold">Add Tag</h3>
        <div className="flex gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => setCategory(val ?? "")} required>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Tag list by category */}
      {categories.map(({ value, label }) => {
        const tags = tagsByCategory[value] ?? [];
        return (
          <div key={value}>
            <h3 className="text-lg font-semibold">{label}</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">No tags.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      title="Delete tag"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
