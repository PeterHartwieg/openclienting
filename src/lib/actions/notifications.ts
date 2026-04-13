"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in required" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in required" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateNotificationPreferences(params: {
  emailStatusChanges?: boolean;
  emailSuggestedEdits?: boolean;
  emailCommentReplies?: boolean;
  emailVerificationOutcomes?: boolean;
  emailSuccessReportDecisions?: boolean;
  emailRevisionReverted?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Sign in required" };

  // Upsert preferences
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      ...(params.emailStatusChanges !== undefined && { email_status_changes: params.emailStatusChanges }),
      ...(params.emailSuggestedEdits !== undefined && { email_suggested_edits: params.emailSuggestedEdits }),
      ...(params.emailCommentReplies !== undefined && { email_comment_replies: params.emailCommentReplies }),
      ...(params.emailVerificationOutcomes !== undefined && { email_verification_outcomes: params.emailVerificationOutcomes }),
      ...(params.emailSuccessReportDecisions !== undefined && { email_success_report_decisions: params.emailSuccessReportDecisions }),
      ...(params.emailRevisionReverted !== undefined && { email_revision_reverted: params.emailRevisionReverted }),
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
