"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveTranslation,
  rejectTranslation,
} from "@/app/[locale]/translate/actions";
import { Button } from "@/components/ui/button";
import type { TranslationFields, TranslationTargetType } from "@/lib/types/database";
import { TRANSLATABLE_FIELDS } from "@/lib/content-translations/fields";

interface TranslationReviewProps {
  translationId: string;
  targetType: TranslationTargetType;
  sourceFields: Record<string, string>;
  translatedFields: TranslationFields;
}

/**
 * Moderator review card for a pending content translation.
 *
 * Shows each translatable field side-by-side (source left, translation right)
 * so the moderator can spot-check meaning without context-switching. Fields
 * left untranslated are rendered faintly so partial submissions are visible
 * but easy to skim past.
 */
export function TranslationReview({
  translationId,
  targetType,
  sourceFields,
  translatedFields,
}: TranslationReviewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveTranslation(translationId);
      if (result.success) router.refresh();
      else setError(result.error);
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const result = await rejectTranslation(translationId);
      if (result.success) router.refresh();
      else setError(result.error);
    });
  }

  const spec = TRANSLATABLE_FIELDS[targetType];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {spec.map((field) => {
          const source = sourceFields[field.name] ?? "";
          const translated = translatedFields[field.name];
          const empty = !translated || translated.trim().length === 0;
          return (
            <div key={field.name} className="rounded border p-2 text-sm">
              <p className="font-medium">{field.label}</p>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                <div className="rounded bg-muted/50 p-1.5 text-xs whitespace-pre-wrap">
                  <span className="font-medium text-muted-foreground">EN: </span>
                  {source || <span className="italic">(empty)</span>}
                </div>
                <div
                  className={
                    empty
                      ? "rounded bg-muted/30 p-1.5 text-xs italic text-muted-foreground"
                      : "rounded bg-green-500/10 p-1.5 text-xs whitespace-pre-wrap"
                  }
                >
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {empty ? "—" : "Translation: "}
                  </span>
                  {translated ?? "(not translated)"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApprove} disabled={isPending}>
          Approve
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReject}
          disabled={isPending}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
