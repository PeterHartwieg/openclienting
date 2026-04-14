import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalShell } from "@/components/layout/legal-shell";
import { TermsEn } from "./_content/terms.en";
import { TermsDe } from "./_content/terms.de";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalShell reviewPending={locale === "de"}>
      {locale === "de" ? <TermsDe /> : <TermsEn />}
    </LegalShell>
  );
}
