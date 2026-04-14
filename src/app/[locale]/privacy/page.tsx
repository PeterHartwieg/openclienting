import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalShell } from "@/components/layout/legal-shell";
import { PrivacyEn } from "./_content/privacy.en";
import { PrivacyDe } from "./_content/privacy.de";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalShell reviewPending={locale === "de"}>
      {locale === "de" ? <PrivacyDe /> : <PrivacyEn />}
    </LegalShell>
  );
}
