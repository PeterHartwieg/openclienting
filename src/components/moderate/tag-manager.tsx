"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createTag, deleteTag, updateTagTranslation } from "@/app/[locale]/(shell)/moderate/actions";
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
  name_de?: string | null;
  slug: string;
  category: string;
}

const categoryOrder = [
  "industry",
  "function",
  "problem_category",
  "company_size",
  "technology",
];

export function TagManager({
  tagsByCategory,
}: {
  tagsByCategory: Record<string, Tag[]>;
}) {
  const router = useRouter();
  const t = useTranslations("moderate");
  const tCommon = useTranslations("common");
  const tTags = useTranslations("tags");
  const tErrors = useTranslations("errors");

  const categoryLabels: Record<string, string> = {
    industry: tTags("categoryIndustry"),
    function: tTags("categoryFunction"),
    problem_category: tTags("categoryProblemCategory"),
    company_size: tTags("categoryCompanySize"),
    technology: tTags("categoryTechnology"),
  };

  const [name, setName] = useState("");
  const [nameDe, setNameDe] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

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

    const result = await createTag({
      name: name.trim(),
      name_de: nameDe.trim() || null,
      slug,
      category,
    });
    setLoading(false);

    if (result.success) {
      setName("");
      setNameDe("");
      router.refresh();
    } else {
      setError(result.error ?? tErrors("generic"));
    }
  }

  async function handleDelete(tagId: string) {
    const result = await deleteTag(tagId);
    if (result.success) {
      router.refresh();
    }
  }

  async function handleSaveTranslation(tagId: string) {
    const result = await updateTagTranslation({
      tagId,
      name_de: editingValue.trim() || null,
    });
    if (result.success) {
      setEditingTagId(null);
      setEditingValue("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {/* Add tag form */}
      <form onSubmit={handleCreate} className="space-y-3">
        <h3 className="text-lg font-semibold">{t("addTag")}</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="tag-name">{t("tagName")}</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("tagName")}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tag-name-de">{t("tagNameDe")}</Label>
            <Input
              id="tag-name-de"
              value={nameDe}
              onChange={(e) => setNameDe(e.target.value)}
              placeholder={t("tagNameDe")}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("tagCategory")}</Label>
            <Select value={category} onValueChange={(val) => setCategory(val ?? "")} required>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("tagCategory")} />
              </SelectTrigger>
              <SelectContent>
                {categoryOrder.map((value) => (
                  <SelectItem key={value} value={value}>
                    {categoryLabels[value] ?? value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? tCommon("loading") : t("addTag")}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {/* Tag list by category */}
      {categoryOrder.map((value) => {
        const tags = tagsByCategory[value] ?? [];
        const label = categoryLabels[value] ?? value;
        return (
          <div key={value}>
            <h3 className="text-lg font-semibold">{label}</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">{t("noPending")}</p>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                {tags.map((tag) => {
                  const isEditing = editingTagId === tag.id;
                  return (
                    <div
                      key={tag.id}
                      className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{tag.name}</span>
                      <span className="text-muted-foreground">·</span>
                      {isEditing ? (
                        <>
                          <Input
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            placeholder={t("tagNameDe")}
                            className="h-7 w-40"
                          />
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleSaveTranslation(tag.id)}
                          >
                            {tCommon("save")}
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setEditingTagId(null);
                              setEditingValue("");
                            }}
                          >
                            {tCommon("cancel")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground italic">
                            {tag.name_de || "—"}
                          </span>
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setEditingTagId(tag.id);
                              setEditingValue(tag.name_de ?? "");
                            }}
                          >
                            {tCommon("edit")}
                          </Button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                        title={tCommon("delete")}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
