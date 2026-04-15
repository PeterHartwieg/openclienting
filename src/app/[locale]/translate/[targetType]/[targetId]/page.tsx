import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { TranslationForm } from "@/components/translations/translation-form";
import {
  TRANSLATABLE_FIELDS,
  TARGET_TYPE_LABELS,
  isTranslationTargetType,
} from "@/lib/content-translations/fields";
import { getSourceFields } from "@/lib/queries/content-translations";
import type { TranslationTargetType } from "@/lib/types/database";

/**
 * Contribution page for the open-source translations feature.
 *
 * URL: /{locale}/translate/{targetType}/{targetId}
 *
 * Shows the English source fields read-only on the left and editable
 * inputs on the right, with a language picker. Submit fires a server
 * action; on success the translation enters the moderation queue.
 *
 * Signed-out users get bounced to sign-in. We don't gate behind any
 * role — translation is an open contribution, like submitting a
 * problem or a comment.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; targetType: string; targetId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "translate" });
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ProposeTranslationPage({
  params,
}: {
  params: Promise<{ locale: string; targetType: string; targetId: string }>;
}) {
  const { locale, targetType, targetId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("translate");

  if (!isTranslationTargetType(targetType)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/translate/${targetType}/${targetId}`);
  }

  const sourceFields = await getSourceFields(
    targetType as TranslationTargetType,
    targetId,
  );
  if (!sourceFields) notFound();

  const spec = TRANSLATABLE_FIELDS[targetType as TranslationTargetType];
  const targetLabel = TARGET_TYPE_LABELS[targetType as TranslationTargetType];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: t("breadcrumb"), url: `/${locale}` },
          { name: targetLabel, url: `/${locale}/translate/${targetType}/${targetId}` },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        {t("pageTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{targetLabel}</p>
      <p className="mt-2 text-muted-foreground max-w-2xl">{t("pageIntro")}</p>

      <TranslationForm
        targetType={targetType as TranslationTargetType}
        targetId={targetId}
        sourceFields={sourceFields}
        spec={spec}
        defaultLanguage={locale === "en" ? "" : locale}
      />
    </div>
  );
}
