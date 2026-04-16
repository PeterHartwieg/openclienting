"use client";

import { useState, useTransition } from "react";
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

// Toggles are grouped by the recipient's relationship to the content so the
// user can scan them quickly. Order within each group matches likely importance.
const GROUPS: Array<{
  heading: string;
  description: string;
  items: Array<{ key: PrefKey; label: string }>;
}> = [
  {
    heading: "Your submissions",
    description: "Emails about content you submitted.",
    items: [
      {
        key: "emailStatusChanges",
        label: "A moderator approves or rejects your submission",
      },
      {
        key: "emailSuccessReportDecisions",
        label: "A moderator verifies or rejects your success report",
      },
      {
        key: "emailRevisionReverted",
        label: "A moderator reverts one of your edits",
      },
    ],
  },
  {
    heading: "Activity on your content",
    description: "Emails when others engage with content you authored.",
    items: [
      {
        key: "emailCommentReplies",
        label: "Someone replies to your comment",
      },
      {
        key: "emailSuggestedEdits",
        label: "Someone suggests an edit to your content",
      },
      {
        key: "emailNewSolutionOnProblem",
        label: "A new solution is published for your problem",
      },
      {
        key: "emailNewSuccessReportOnContent",
        label: "A success report is published about your problem or solution",
      },
    ],
  },
  {
    heading: "Organizations",
    description: "Emails about organizations you created or asked to join.",
    items: [
      {
        key: "emailVerificationOutcomes",
        label: "An organization or membership is verified or rejected",
      },
    ],
  },
];

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(result.error ?? "Could not save preferences.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
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
          {isPending ? "Saving..." : "Save preferences"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved
          </span>
        )}
        {error && (
          <span className="text-sm text-destructive">{error}</span>
        )}
      </div>
    </div>
  );
}
