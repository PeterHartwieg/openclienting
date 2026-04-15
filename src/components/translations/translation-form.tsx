"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { proposeTranslation } from "@/app/[locale]/translate/actions";
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
import { LANGUAGES } from "@/i18n/languages";
import type { TranslatableFieldSpec } from "@/lib/content-translations/fields";
import type { TranslationTargetType } from "@/lib/types/database";

interface TranslationFormProps {
  targetType: TranslationTargetType;
  targetId: string;
  sourceFields: Record<string, string>;
  spec: readonly TranslatableFieldSpec[];
  /** Pre-filled language if the user is already browsing in a non-English locale. */
  defaultLanguage: string;
}

/**
 * Side-by-side contribution form: source English text on the left
 * (read-only), editable translation on the right. Users fill only
 * the fields they want to translate — empty inputs are dropped on
 * submit so partial translations are allowed.
 *
 * The language picker excludes English ("en" is the source) and
 * uses endonyms so translators can find their own language without
 * reading another one first.
 */
export function TranslationForm({
  targetType,
  targetId,
  sourceFields,
  spec,
  defaultLanguage,
}: TranslationFormProps) {
  const t = useTranslations("translate");
  const router = useRouter();
  const locale = useLocale();
  const [language, setLanguage] = useState<string>(
    defaultLanguage === "en" ? "" : defaultLanguage,
  );
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.map((s) => [s.name, ""])),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pickableLanguages = LANGUAGES.filter((l) => l.code !== "en");

  function handleFieldChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!language) {
      setError(t("errorSelectLanguage"));
      return;
    }
    const filled = Object.values(values).some((v) => v.trim().length > 0);
    if (!filled) {
      setError(t("errorEmpty"));
      return;
    }
    startTransition(async () => {
      const result = await proposeTranslation({
        targetType,
        targetId,
        language,
        fields: values,
      });
      if (result.success) {
        setSubmitted(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
        <p className="text-sm">{t("submitSuccess")}</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          {t("goToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="translation-language">{t("languageLabel")}</Label>
        <Select
          value={language || undefined}
          onValueChange={(val) => setLanguage(val ?? "")}
        >
          <SelectTrigger id="translation-language" className="w-full max-w-md">
            <SelectValue placeholder={t("languagePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {pickableLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span>{lang.endonym}</span>
                <span className="text-muted-foreground"> · {lang.englishName}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("languageHelp")}</p>
      </div>

      <div className="space-y-5">
        {spec.map((field) => {
          const sourceValue = sourceFields[field.name] ?? "";
          return (
            <div key={field.name} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">
                  {field.label} · {t("sourceLabel")}
                </Label>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap min-h-[2.5rem]">
                  {sourceValue || (
                    <span className="text-muted-foreground italic">
                      {t("sourceEmpty")}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`field-${field.name}`}>
                  {field.label} · {t("targetLabel")}
                </Label>
                {field.multiline ? (
                  <Textarea
                    id={`field-${field.name}`}
                    rows={Math.max(3, Math.min(12, Math.ceil(sourceValue.length / 80)))}
                    value={values[field.name] ?? ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={t("fieldPlaceholder")}
                    disabled={isPending}
                  />
                ) : (
                  <Input
                    id={`field-${field.name}`}
                    value={values[field.name] ?? ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={t("fieldPlaceholder")}
                    disabled={isPending}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("moderationNote")}</p>
      </div>
    </form>
  );
}
