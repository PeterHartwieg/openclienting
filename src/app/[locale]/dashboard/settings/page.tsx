import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { NotificationSettings } from "@/components/dashboard/notification-settings";

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <nav className="flex gap-4 text-sm">
          <Link
            href={`/${locale}/dashboard/account`}
            className="text-muted-foreground hover:text-foreground"
          >
            Account
          </Link>
          <span className="font-medium">Notifications</span>
        </nav>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Email Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which email notifications you&apos;d like to receive.
        </p>
        <div className="mt-4">
          <NotificationSettings
            initialPrefs={{
              emailStatusChanges: prefs?.email_status_changes ?? true,
              emailSuggestedEdits: prefs?.email_suggested_edits ?? true,
              emailCommentReplies: prefs?.email_comment_replies ?? true,
              emailVerificationOutcomes: prefs?.email_verification_outcomes ?? true,
              emailSuccessReportDecisions: prefs?.email_success_report_decisions ?? true,
              emailRevisionReverted: prefs?.email_revision_reverted ?? true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
