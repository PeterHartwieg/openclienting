import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { getTagsGroupedByCategory } from "@/lib/queries/tags";
import { getUserVerifiedMemberships } from "@/lib/queries/organizations";
import { ProblemForm } from "@/components/submit/problem-form";
import { getLanguageAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submit" });
  return {
    title: t("metaTitle"),
    alternates: getLanguageAlternates(locale, "/submit"),
  };
}

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("submit");
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const [tagsByCategory, verifiedOrgs] = await Promise.all([
    getTagsGroupedByCategory(locale),
    getUserVerifiedMemberships(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8">
        <ProblemForm tagsByCategory={tagsByCategory} locale={locale} verifiedOrgs={verifiedOrgs} />
      </div>
    </div>
  );
}
