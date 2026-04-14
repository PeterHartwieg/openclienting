import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalShell } from "@/components/layout/legal-shell";
import { ImpressumEn } from "./_content/impressum.en";
import { ImpressumDe } from "./_content/impressum.de";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.impressum" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Impressum is originally written for the German legal context, so the
  // German version is the canonical source — no review banner needed there.
  // The English version is a courtesy translation.
  return (
    <LegalShell reviewPending={false}>
      {locale === "de" ? <ImpressumDe /> : <ImpressumEn />}
    </LegalShell>
  );
}
