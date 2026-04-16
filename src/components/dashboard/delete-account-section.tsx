"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
        setError(body.error ?? "Failed to delete account");
        setLoading(false);
        return;
      }
      // Client-side sign-out clears the browser session cookie even if
      // the server-side signOut in the route raced with the redirect.
      await createClient().auth.signOut();
      router.replace(`/${locale}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Permanently delete your account and all content you authored —
        submissions, comments, and votes. This cannot be undone.
      </p>

      {!canDelete && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium text-destructive">
            You&apos;re the sole admin of:
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
            Transfer admin rights to another member or leave these organizations
            before deleting your account.
          </p>
        </div>
      )}

      <Dialog>
        <DialogTrigger
          render={
            <Button variant="destructive" size="sm" disabled={!canDelete} />
          }
        >
          Delete my account
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently removes your profile, submissions, comments, and
              votes. Organizations you created will remain with their remaining
              members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="delete-confirmation" className="text-sm">
              Type{" "}
              <span className="font-mono text-foreground">{email}</span> to
              confirm
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
              {loading ? "Deleting..." : "Delete account permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
