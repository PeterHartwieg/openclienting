"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { moderateItem } from "@/app/[locale]/(shell)/moderate/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ModerationActionsProps {
  targetType: "problem_templates" | "requirements" | "pilot_frameworks" | "solution_approaches" | "success_reports" | "suggested_edits" | "knowledge_articles";
  targetId: string;
}

export function ModerationActions({ targetType, targetId }: ModerationActionsProps) {
  const router = useRouter();
  const t = useTranslations("moderate");
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "publish" | "reject") {
    setLoading(true);
    const result = await moderateItem({
      targetType,
      targetId,
      action,
      rejectionReason: action === "reject" ? reason : undefined,
    });
    setLoading(false);

    if (result.success) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          onClick={() => handleAction("publish")}
          disabled={loading}
          size="sm"
        >
          {t("approve")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowReject(!showReject)}
          disabled={loading}
        >
          {t("reject")}
        </Button>
      </div>

      {showReject && (
        <div className="space-y-2">
          <Textarea
            placeholder={t("actions.rejectionReasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction("reject")}
            disabled={loading}
          >
            {t("actions.confirmReject")}
          </Button>
        </div>
      )}
    </div>
  );
}
