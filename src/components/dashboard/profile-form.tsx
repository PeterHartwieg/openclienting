"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/account";
import { LANGUAGES } from "@/i18n/languages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormProps {
  initial: {
    displayName: string | null;
    bio: string | null;
    website: string | null;
    publicEmail: string | null;
    locale: string | null;
  };
}

const BIO_MAX = 500;

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [publicEmail, setPublicEmail] = useState(initial.publicEmail ?? "");
  const [locale, setLocale] = useState<string>(initial.locale ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    startTransition(async () => {
      const result = await updateProfile({
        displayName,
        bio,
        website,
        publicEmail,
        locale: locale || null,
      });
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How your name appears on submissions"
          maxLength={80}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Short bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A sentence or two about yourself (optional)"
          maxLength={BIO_MAX}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length} / {BIO_MAX}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="public-email">Public email</Label>
        <Input
          id="public-email"
          type="email"
          value={publicEmail}
          onChange={(e) => setPublicEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={320}
        />
        <p className="text-xs text-muted-foreground">
          Optional — shown on your public profile. Leave blank to keep your
          sign-in address private.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="locale">Preferred language (for emails)</Label>
        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger id="locale" className="w-full">
            <SelectValue placeholder="Use the site default" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.endonym} — {l.englishName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Determines the language of notification emails. Your browsing language
          is still controlled by the URL.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save profile"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
