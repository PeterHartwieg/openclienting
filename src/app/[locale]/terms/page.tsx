import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalShell } from "@/components/layout/legal-shell";
import { getLanguageAlternates } from "@/lib/site";
import { TermsEn } from "./_content/terms.en";
import { TermsDe } from "./_content/terms.de";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.terms" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: getLanguageAlternates(locale, "/terms"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Both locales stand on their own — the German version is canonical for
  // German visitors, the English version is a courtesy translation. We do not
  // mark either as "review pending" here.
  return (
    <LegalShell reviewPending={false}>
      {locale === "de" ? <TermsDe /> : <TermsEn />}
    </LegalShell>
  );
}
