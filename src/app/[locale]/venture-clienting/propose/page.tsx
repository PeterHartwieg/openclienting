import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProposeArticleForm } from "@/components/knowledge-articles/propose-form";
import { getCurrentUser } from "@/lib/auth/roles";

/**
 * Propose-new-article page for the venture-clienting cluster.
 *
 * Sign-in is required (the server action rechecks), but we render the
 * locked state at the page level so the UI explains why the form is
 * missing instead of failing after submit. New articles land in the
 * moderation queue as `knowledge_articles` rows with `status='submitted'`
 * and no visible canonical URL until approved.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "knowledgeArticle" });
  return {
    title: t("proposeArticlePageTitle"),
    description: t("proposeArticlePageIntro"),
    robots: { index: false, follow: false },
  };
}

export default async function ProposeArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/venture-clienting`);
  }

  const [ka, bt] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeArticle" }),
    getTranslations({ locale, namespace: "breadcrumbs" }),
  ]);

  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: ka("hubLabel"), url: `/${locale}/venture-clienting` },
    { name: ka("proposeArticleCta"), url: `/${locale}/venture-clienting/propose` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm text-muted-foreground" />
      <h1 className="text-display font-bold leading-display tracking-tighter">
        {ka("proposeArticlePageTitle")}
      </h1>
      <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
        {ka("proposeArticlePageIntro")}
      </p>

      <div className="mt-12">
        <ProposeArticleForm locale={locale} />
      </div>
    </div>
  );
}
