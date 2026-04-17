"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { reviewOrganizationVerification } from "@/lib/actions/moderate-organizations";
import type { VerificationDecision } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function VerificationActions({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const t = useTranslations("moderate");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAction(decision: VerificationDecision) {
    setLoading(true);
    const result = await reviewOrganizationVerification({
      organizationId,
      decision,
      notes: notes.trim() || undefined,
    });
    setLoading(false);
    if (result.success) router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{t("actions.verificationNotesLabel")}</Label>
        <Textarea
          placeholder={t("actions.verificationNotesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleAction("approved")} disabled={loading} size="sm">
          {loading ? "…" : t("approve")}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => handleAction("rejected")} disabled={loading}>
          {loading ? "…" : t("reject")}
        </Button>
      </div>
    </div>
  );
}
