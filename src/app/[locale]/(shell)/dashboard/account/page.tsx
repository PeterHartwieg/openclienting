import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getDeletionBlockers } from "@/lib/actions/account";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import { PasswordSection } from "@/components/dashboard/password-section";
import { DeleteAccountSection } from "@/components/dashboard/delete-account-section";
import { NotificationSettings } from "@/components/dashboard/notification-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "account" });

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, bio, website, public_email, locale, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // user.identities tells us how the account can sign in. "email"
  // identity means a password is set; "google" is the OAuth provider.
  const identities = user.identities ?? [];
  const linkedProviders = Array.from(
    new Set(identities.map((i) => i.provider))
  );
  const hasPassword = linkedProviders.includes("email");

  const blockers = await getDeletionBlockers();

  const fallbackInitial =
    (profile?.display_name ?? user.email ?? "?").trim().charAt(0) || "?";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("pageHeading")}</h1>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.title")}</CardTitle>
            <CardDescription>{t("profile.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initial={{
                displayName: profile?.display_name ?? null,
                bio: profile?.bio ?? null,
                website: profile?.website ?? null,
                publicEmail: profile?.public_email ?? null,
                locale: profile?.locale ?? null,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("avatar.title")}</CardTitle>
            <CardDescription>{t("avatar.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url ?? null}
              fallbackInitial={fallbackInitial}
            />
          </CardContent>
        </Card>

        <Card id="notifications" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>{t("notifications.title")}</CardTitle>
            <CardDescription>{t("notifications.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings
              initialPrefs={{
                emailStatusChanges: prefs?.email_status_changes ?? true,
                emailSuggestedEdits: prefs?.email_suggested_edits ?? true,
                emailCommentReplies: prefs?.email_comment_replies ?? true,
                emailVerificationOutcomes: prefs?.email_verification_outcomes ?? true,
                emailSuccessReportDecisions: prefs?.email_success_report_decisions ?? true,
                emailRevisionReverted: prefs?.email_revision_reverted ?? true,
                emailNewSolutionOnProblem: prefs?.email_new_solution_on_problem ?? true,
                emailNewSuccessReportOnContent: prefs?.email_new_success_report_on_content ?? true,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("security.title")}</CardTitle>
            <CardDescription>{t("security.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordSection
              hasPassword={hasPassword}
              linkedProviders={linkedProviders}
            />
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">{t("dangerZone.title")}</CardTitle>
            <CardDescription>{t("dangerZone.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection
              email={user.email ?? ""}
              blockers={blockers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
