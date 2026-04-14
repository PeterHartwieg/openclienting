"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: buildCallbackUrl() },
    });

    setLoading(false);
    if (error) {
      // Auth provider error messages aren't part of our message catalog;
      // fall back to a generic translated error if present.
      setMessage(error.message || tErrors("generic"));
    } else {
      setMessage(t("magicLinkSent"));
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
          <DialogDescription>
            {t("signInRequired")}
          </DialogDescription>
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

          <form onSubmit={handleMagicLink} className="space-y-3">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("magicLinkSending") : t("magicLinkSend")}
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
