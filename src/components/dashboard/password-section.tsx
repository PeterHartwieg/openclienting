"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { setOrChangePassword } from "@/lib/actions/account";
import { validatePassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordSectionProps {
  hasPassword: boolean;
  linkedProviders: string[]; // e.g. ["google", "email"]
}

export function PasswordSection({
  hasPassword,
  linkedProviders,
}: PasswordSectionProps) {
  const t = useTranslations("account.security");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function providerLabel(p: string): string {
    switch (p) {
      case "google":
        return t("providerGoogle");
      case "email":
        return t("providerEmailPassword");
      default:
        return p;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const msg = validatePassword(newPassword);
    if (msg) {
      setError(msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("errorPasswordsMismatch"));
      return;
    }
    if (hasPassword && !currentPassword) {
      setError(t("errorCurrentPasswordRequired"));
      return;
    }

    startTransition(async () => {
      const result = await setOrChangePassword({
        newPassword,
        currentPassword: hasPassword ? currentPassword : undefined,
      });
      if (result.success) {
        setSaved(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium">{t("signInMethodsHeading")}</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {linkedProviders.map((p) => (
            <li key={p}>• {providerLabel(p)}</li>
          ))}
          {linkedProviders.length === 0 && <li>• {t("magicLinkOnly")}</li>}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-medium">
          {hasPassword ? t("changePasswordHeading") : t("setPasswordHeading")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasPassword
            ? t("changePasswordDescription")
            : t("setPasswordDescription")}
        </p>

        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="current-password">{t("currentPasswordLabel")}</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="new-password">{t("newPasswordLabel")}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t("minLengthHint", { min: MIN_PASSWORD_LENGTH })}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">{t("confirmPasswordLabel")}</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending
              ? t("saving")
              : hasPassword
              ? t("updatePasswordButton")
              : t("setPasswordButton")}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              {t("saved")}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
