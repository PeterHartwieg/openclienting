"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function LoginDialog() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Build the post-auth destination so OAuth and magic-link flows preserve
  // the locale (and current page) the user signed in from. usePathname() in
  // the [locale] route group returns the locale-prefixed path, e.g.
  // "/de/problems/abc". Fall back to the locale homepage if pathname is
  // missing or doesn't start with a slash.
  function buildCallbackUrl() {
    const safeNext = pathname && pathname.startsWith("/") ? pathname : `/${locale}`;
    const next = encodeURIComponent(safeNext);
    return `${window.location.origin}/auth/callback?next=${next}`;
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: buildCallbackUrl() },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    // Password filled → standard email/password sign-in. Empty → magic
    // link (existing behaviour). This keeps the two flows on one form
    // and avoids a fork in the dialog.
    if (password.length > 0) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (error) {
        setMessage(error.message || tErrors("generic"));
      } else {
        // Supabase drops a session cookie; reloading the current page
        // is the simplest way to re-render server components as the
        // signed-in user.
        window.location.href = pathname && pathname.startsWith("/")
          ? pathname
          : `/${locale}`;
      }
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: buildCallbackUrl() },
    });

    setLoading(false);
    if (error) {
      setMessage(error.message || tErrors("generic"));
    } else {
      setMessage(t("magicLinkSent"));
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage(t("forgotPasswordNeedsEmail"));
      return;
    }
    setResetLoading(true);
    setMessage("");
    const result = await requestPasswordReset(email.trim());
    setResetLoading(false);
    setForgotOpen(false);
    if (result.success) {
      setMessage(t("resetSent"));
    } else {
      setMessage(result.error || tErrors("generic"));
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("signIn")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("signIn")}</DialogTitle>
          <DialogDescription>{t("signInRequired")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            {t("signInWithGoogle")}
          </Button>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t("or")}</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("passwordOptionalLabel")}</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(!forgotOpen)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {t("forgotPassword")}
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("passwordOptionalPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("passwordOptionalHint")}
              </p>
            </div>
            {forgotOpen && (
              <div className="rounded-md border p-3 bg-muted/40 space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("forgotPasswordHint")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? t("magicLinkSending") : t("forgotPasswordSend")}
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("magicLinkSending")
                : password.length > 0
                ? t("signInAction")
                : t("magicLinkSend")}
            </Button>
          </form>

          {message && (
            <p className="text-sm text-center text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
