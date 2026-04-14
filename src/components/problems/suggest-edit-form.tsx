"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { submitSuggestedEdit } from "@/lib/actions/suggested-edits";
import type { EditTargetType, EditDiff } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SuggestEditFormProps {
  targetType: EditTargetType;
  targetId: string;
  fields: { key: string; label: string; value: string | null; multiline?: boolean }[];
}

export function SuggestEditForm({ targetType, targetId, fields }: SuggestEditFormProps) {
  const router = useRouter();
  const t = useTranslations("problemDetail");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value ?? ""]))
  );

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-xs">
        {t("suggestEditOpen")}
      </Button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Compute diff: only include changed fields
    const diff: EditDiff = {};
    for (const field of fields) {
      const newVal = form[field.key]?.trim() || null;
      if (newVal !== (field.value ?? null)) {
        diff[field.key] = { old: field.value ?? null, new: newVal };
      }
    }

    if (Object.keys(diff).length === 0) return;

    startTransition(async () => {
      const result = await submitSuggestedEdit({ targetType, targetId, diff });
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded-lg border border-dashed p-4">
      <p className="text-xs font-medium text-muted-foreground">{t("suggestEditHeader")}</p>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <Label className="text-sm">{field.label}</Label>
          {field.multiline ? (
            <Textarea
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              rows={3}
            />
          ) : (
            <Input
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t("suggestEditSubmitting") : t("suggestEditSubmit")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t("suggestEditCancel")}
        </Button>
      </div>
    </form>
  );
}
