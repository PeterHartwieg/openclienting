"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateNotificationPreferences } from "@/lib/actions/notifications";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface NotificationSettingsProps {
  initialPrefs: {
    emailStatusChanges: boolean;
    emailSuggestedEdits: boolean;
    emailCommentReplies: boolean;
    emailVerificationOutcomes: boolean;
    emailSuccessReportDecisions: boolean;
    emailRevisionReverted: boolean;
    emailNewSolutionOnProblem: boolean;
    emailNewSuccessReportOnContent: boolean;
  };
}

type PrefKey = keyof NotificationSettingsProps["initialPrefs"];

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const t = useTranslations("account.notifications");
  const [prefs, setPrefs] = useState(initialPrefs);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toggles are grouped by the recipient's relationship to the content so the
  // user can scan them quickly. Order within each group matches likely importance.
  const groups: Array<{
    heading: string;
    description: string;
    items: Array<{ key: PrefKey; label: string }>;
  }> = [
    {
      heading: t("groups.yourSubmissions.heading"),
      description: t("groups.yourSubmissions.description"),
      items: [
        {
          key: "emailStatusChanges",
          label: t("groups.yourSubmissions.statusChanges"),
        },
        {
          key: "emailSuccessReportDecisions",
          label: t("groups.yourSubmissions.successReportDecisions"),
        },
        {
          key: "emailRevisionReverted",
          label: t("groups.yourSubmissions.revisionReverted"),
        },
      ],
    },
    {
      heading: t("groups.activityOnContent.heading"),
      description: t("groups.activityOnContent.description"),
      items: [
        {
          key: "emailCommentReplies",
          label: t("groups.activityOnContent.commentReplies"),
        },
        {
          key: "emailSuggestedEdits",
          label: t("groups.activityOnContent.suggestedEdits"),
        },
        {
          key: "emailNewSolutionOnProblem",
          label: t("groups.activityOnContent.newSolutionOnProblem"),
        },
        {
          key: "emailNewSuccessReportOnContent",
          label: t("groups.activityOnContent.newSuccessReportOnContent"),
        },
      ],
    },
    {
      heading: t("groups.organizations.heading"),
      description: t("groups.organizations.description"),
      items: [
        {
          key: "emailVerificationOutcomes",
          label: t("groups.organizations.verificationOutcomes"),
        },
      ],
    },
  ];

  function setPref(key: PrefKey, value: boolean) {
    setSaved(false);
    setError(null);
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateNotificationPreferences(prefs);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error ?? t("errorFallback"));
      }
    });
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.heading}>
          <h3 className="text-sm font-semibold">{group.heading}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {group.description}
          </p>
          <div className="mt-3 space-y-2">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-start gap-2">
                <Checkbox
                  id={`pref-${item.key}`}
                  checked={prefs[item.key]}
                  onCheckedChange={(c) => setPref(item.key, c === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`pref-${item.key}`}
                  className="text-sm font-normal leading-relaxed"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 border-t pt-4">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("saveButton")}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {t("saved")}
          </span>
        )}
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
