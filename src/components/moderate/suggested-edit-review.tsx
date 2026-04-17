"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { applySuggestedEdit, moderateItem } from "@/app/[locale]/(shell)/moderate/actions";
import { Button } from "@/components/ui/button";

interface SuggestedEditReviewProps {
  editId: string;
  diff: Record<string, { old: string | null; new: string | null }>;
}

export function SuggestedEditReview({ editId, diff }: SuggestedEditReviewProps) {
  const router = useRouter();
  const t = useTranslations("moderate");
  const [loading, setLoading] = useState(false);

  async function handleApply() {
    setLoading(true);
    const result = await applySuggestedEdit(editId);
    setLoading(false);
    if (result.success) router.refresh();
  }

  async function handleReject() {
    setLoading(true);
    const result = await moderateItem({
      targetType: "suggested_edits",
      targetId: editId,
      action: "reject",
    });
    setLoading(false);
    if (result.success) router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {Object.entries(diff).map(([field, values]) => (
          <div key={field} className="rounded border p-2 text-sm">
            <p className="font-medium">{field}</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              <div className="rounded bg-red-500/10 p-1.5 text-xs">
                <span className="font-medium text-red-600 dark:text-red-400">{t("revision.old")} </span>
                {values.old ?? "(empty)"}
              </div>
              <div className="rounded bg-green-500/10 p-1.5 text-xs">
                <span className="font-medium text-green-600 dark:text-green-400">{t("revision.new")} </span>
                {values.new ?? "(empty)"}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApply} disabled={loading}>
          {t("actions.applyChanges")}
        </Button>
        <Button variant="destructive" size="sm" onClick={handleReject} disabled={loading}>
          {t("reject")}
        </Button>
      </div>
    </div>
  );
}
