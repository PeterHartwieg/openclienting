"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { DeletionBlocker } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountSectionProps {
  email: string;
  blockers: DeletionBlocker[];
}

export function DeleteAccountSection({
  email,
  blockers,
}: DeleteAccountSectionProps) {
  const t = useTranslations("account.dangerZone");
  const router = useRouter();
  const locale = useLocale();
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canDelete = blockers.length === 0;
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete() {
    if (!matches) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: typed.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? t("errorFallback"));
        setLoading(false);
        return;
      }
      // Client-side sign-out clears the browser session cookie even if
      // the server-side signOut in the route raced with the redirect.
      await createClient().auth.signOut();
      router.replace(`/${locale}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorFallback"));
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("permanentWarning")}
      </p>

      {!canDelete && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">
            {t("blockerHeading")}
          </p>
          <ul className="mt-1 space-y-1">
            {blockers.map((b) => (
              <li key={b.organizationId}>
                <Link
                  className="underline hover:no-underline"
                  href={`/${locale}/organizations/${b.organizationSlug}`}
                >
                  {b.organizationName}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            {t("blockerHint")}
          </p>
        </div>
      )}

      <Dialog>
        <DialogTrigger
          render={
            <Button variant="destructive" size="sm" disabled={!canDelete} />
          }
        >
          {t("deleteButton")}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="delete-confirmation" className="text-sm">
              {t.rich("confirmLabel", {
                email: () => (
                  <span className="font-mono text-foreground">{email}</span>
                ),
              })}
            </Label>
            <Input
              id="delete-confirmation"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              placeholder={email}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!matches || loading}
            >
              {loading ? t("deletingButton") : t("confirmDeleteButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
