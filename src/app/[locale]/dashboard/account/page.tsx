import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getDeletionBlockers } from "@/lib/actions/account";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import { PasswordSection } from "@/components/dashboard/password-section";
import { DeleteAccountSection } from "@/components/dashboard/delete-account-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, website, public_email, locale, avatar_url")
    .eq("id", user.id)
    .single();

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
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <nav className="flex gap-4 text-sm">
          <span className="font-medium">Account</span>
          <Link
            href={`/${locale}/dashboard/settings`}
            className="text-muted-foreground hover:text-foreground"
          >
            Notifications
          </Link>
        </nav>
      </div>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Information shown next to your submissions and comments.
            </CardDescription>
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
            <CardTitle>Avatar</CardTitle>
            <CardDescription>
              A small profile picture shown next to your name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={profile?.avatar_url ?? null}
              fallbackInitial={fallbackInitial}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Login &amp; security</CardTitle>
            <CardDescription>
              Manage how you sign in to OpenClienting.
            </CardDescription>
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
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Irreversible account actions. Proceed with care.
            </CardDescription>
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
