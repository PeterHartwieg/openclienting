import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getTagsGroupedByCategory } from "@/lib/queries/tags";
import { TagManager } from "@/components/moderate/tag-manager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "moderate" });
  return {
    title: `${t("tagsPage.title")} — ${t("metaTitle")}`,
    robots: { index: false, follow: false },
  };
}

export default async function TagManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moderate");

  const tagsByCategory = await getTagsGroupedByCategory(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("tagsPage.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("tagsPage.subtitle")}
      </p>
      <div className="mt-8">
        <TagManager tagsByCategory={tagsByCategory} />
      </div>
    </div>
  );
}
