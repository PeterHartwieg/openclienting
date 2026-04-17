"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("account.profile");
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
        <Label htmlFor="display-name">{t("displayNameLabel")}</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("displayNamePlaceholder")}
          maxLength={80}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("bioLabel")}</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("bioPlaceholder")}
          maxLength={BIO_MAX}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length} / {BIO_MAX}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website">{t("websiteLabel")}</Label>
        <Input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t("websitePlaceholder")}
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="public-email">{t("publicEmailLabel")}</Label>
        <Input
          id="public-email"
          type="email"
          value={publicEmail}
          onChange={(e) => setPublicEmail(e.target.value)}
          placeholder={t("publicEmailPlaceholder")}
          maxLength={320}
        />
        <p className="text-xs text-muted-foreground">
          {t("publicEmailHint")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="locale">{t("localeLabel")}</Label>
        <Select
          value={locale}
          onValueChange={(v) => setLocale(v ?? "")}
        >
          <SelectTrigger id="locale" className="w-full">
            <SelectValue placeholder={t("localePlaceholder")} />
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
          {t("localeHint")}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("saveButton")}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {t("saved")}
          </span>
        )}
      </div>
    </div>
  );
}
