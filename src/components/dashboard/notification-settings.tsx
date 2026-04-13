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
  };
}

export function NotificationSettings({ initialPrefs }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        emailStatusChanges: prefs.emailStatusChanges,
        emailSuggestedEdits: prefs.emailSuggestedEdits,
        emailCommentReplies: prefs.emailCommentReplies,
        emailVerificationOutcomes: prefs.emailVerificationOutcomes,
        emailSuccessReportDecisions: prefs.emailSuccessReportDecisions,
        emailRevisionReverted: prefs.emailRevisionReverted,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="pref-status"
          checked={prefs.emailStatusChanges}
          onCheckedChange={(c) => setPrefs({ ...prefs, emailStatusChanges: c === true })}
        />
        <Label htmlFor="pref-status" className="text-sm">
          Submission status changes (approved/rejected)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="pref-edits"
          checked={prefs.emailSuggestedEdits}
          onCheckedChange={(c) => setPrefs({ ...prefs, emailSuggestedEdits: c === true })}
        />
        <Label htmlFor="pref-edits" className="text-sm">
          Suggested edits on your content
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="pref-comments"
          checked={prefs.emailCommentReplies}
          onCheckedChange={(c) => setPrefs({ ...prefs, emailCommentReplies: c === true })}
        />
        <Label htmlFor="pref-comments" className="text-sm">
          Replies to your comments
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="pref-verification"
          checked={prefs.emailVerificationOutcomes}
          onCheckedChange={(c) => setPrefs({ ...prefs, emailVerificationOutcomes: c === true })}
        />
        <Label htmlFor="pref-verification" className="text-sm">
          Organization &amp; membership verification outcomes
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="pref-success-report"
          checked={prefs.emailSuccessReportDecisions}
          onCheckedChange={(c) => setPrefs({ ...prefs, emailSuccessReportDecisions: c === true })}
        />
        <Label htmlFor="pref-success-report" className="text-sm">
          Success report decisions (verified/rejected)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="pref-revision"
          checked={prefs.emailRevisionReverted}
          onCheckedChange={(c) => setPrefs({ ...prefs, emailRevisionReverted: c === true })}
        />
        <Label htmlFor="pref-revision" className="text-sm">
          Reverted edits on your content
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
      </div>
    </div>
  );
}
