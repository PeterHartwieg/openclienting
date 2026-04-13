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
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

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
            }}
          />
        </div>
      </div>
    </div>
  );
}
