"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { setOrChangePassword } from "@/lib/actions/account";
import { validatePassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Landing page after a user clicks the reset-password email link.
// The /auth/callback route already exchanged the recovery code for a
// session and redirected here, so the user is authenticated when this
// page loads. If they somehow arrive without a session (expired link,
// direct visit), we bounce them to the homepage.
export default function ResetPasswordPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("account.password");
  const tCommon = useTranslations("common");

  const [checkingSession, setCheckingSession] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}`);
        return;
      }
      setCheckingSession(false);
    });
  }, [router, locale]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const msg = validatePassword(newPassword);
    if (msg) {
      setError(msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }

    setLoading(true);
    const result = await setOrChangePassword({ newPassword });
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.replace(`/${locale}/dashboard/account`);
      }, 1500);
    } else {
      setError(result.error);
    }
  }

  if (checkingSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("resetTitle")}</CardTitle>
          <CardDescription>{t("resetDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-foreground">{t("resetSuccess")}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{t("newPasswordLabel")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">{t("confirmLabel")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? tCommon("loading") : t("resetSubmit")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
