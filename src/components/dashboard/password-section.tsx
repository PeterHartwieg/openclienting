"use client";

import { useState, useTransition } from "react";
import { setOrChangePassword } from "@/lib/actions/account";
import { validatePassword, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordSectionProps {
  hasPassword: boolean;
  linkedProviders: string[]; // e.g. ["google", "email"]
}

function providerLabel(p: string): string {
  switch (p) {
    case "google":
      return "Google";
    case "email":
      return "Email + password";
    default:
      return p;
  }
}

export function PasswordSection({
  hasPassword,
  linkedProviders,
}: PasswordSectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const msg = validatePassword(newPassword);
    if (msg) {
      setError(msg);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (hasPassword && !currentPassword) {
      setError("Current password is required");
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
        <h3 className="text-sm font-medium">Sign-in methods</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {linkedProviders.map((p) => (
            <li key={p}>• {providerLabel(p)}</li>
          ))}
          {linkedProviders.length === 0 && <li>• Magic link (email only)</li>}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-medium">
          {hasPassword ? "Change password" : "Set a password"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasPassword
            ? "Update the password used to sign in with your email."
            : "Add a password so you can sign in without waiting for a magic link."}
        </p>

        {hasPassword && (
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
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
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm new password</Label>
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
              ? "Saving..."
              : hasPassword
              ? "Update password"
              : "Set password"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
