import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalShell } from "@/components/layout/legal-shell";
import { getLanguageAlternates } from "@/lib/site";
import { PrivacyEn } from "./_content/privacy.en";
import { PrivacyDe } from "./_content/privacy.de";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getLanguageAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The privacy notice is written for the German legal context (DSGVO / TDDDG).
  // Both locales stand on their own — the German version is canonical for
  // German visitors, and the English version is a courtesy translation. We
  // intentionally do not mark either as "review pending" here.
  return (
    <LegalShell reviewPending={false}>
      {locale === "de" ? <PrivacyDe /> : <PrivacyEn />}
    </LegalShell>
  );
}
