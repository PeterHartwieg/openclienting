import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SuggestEditForm } from "@/components/problems/suggest-edit-form";
import { cn } from "@/lib/utils";
import { getLanguageAlternates } from "@/lib/site";
import {
  getAllSpokesForLocale,
  getHubArticle,
} from "@/lib/queries/knowledge-articles";

/**
 * Venture-clienting hub — the `/[locale]/venture-clienting` landing page.
 *
 * Content lives in the `knowledge_articles` table (row `kind='hub'`,
 * `slug='index'`). Moderated edits flow through the existing
 * `suggested_edits` pipeline with `target_type='knowledge_article'`; new
 * articles and new-locale translations are proposed via the form at
 * `/[locale]/venture-clienting/propose` and approved through the
 * moderator queue at `/[locale]/moderate`.
 *
 * Locale fallback: if the hub row for this locale is missing, the
 * query layer falls back to `en`. That preserves today's behavior for
 * any locale that hasn't been translated yet.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const article = await getHubArticle(locale);
  if (!article) return {};
  return {
    title: article.meta_title,
    description: article.meta_description,
    alternates: {
      ...getLanguageAlternates(locale, "/venture-clienting"),
      types: {
        "text/markdown": `/${locale}/venture-clienting/md`,
      },
    },
  };
}

export default async function VentureClientingHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [article, spokes, ka, bt] = await Promise.all([
    getHubArticle(locale),
    getAllSpokesForLocale(locale),
    getTranslations({ locale, namespace: "knowledgeArticle" }),
    getTranslations({ locale, namespace: "breadcrumbs" }),
  ]);

  if (!article) notFound();

  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: ka("hubLabel"), url: `/${locale}/venture-clienting` },
  ];

  // Phase 1 suggest-edit surface: scalar fields only. Sections and
  // other structured content are moderator-only until the structured
  // editor ships in a follow-up. A user who wants to correct a
  // section body can still propose a full replacement article via
  // `/venture-clienting/propose`.
  const editableFields = [
    { key: "title", label: ka("fieldTitle"), value: article.title },
    { key: "lede", label: ka("fieldLede"), value: article.lede, multiline: true },
    { key: "meta_title", label: ka("fieldMetaTitle"), value: article.meta_title },
    {
      key: "meta_description",
      label: ka("fieldMetaDescription"),
      value: article.meta_description,
      multiline: true,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm text-muted-foreground" />
      <article>
        <h1 className="text-display font-bold leading-display tracking-tighter">
          {article.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {article.lede}
        </p>

        <div className="mt-12 space-y-10">
          {article.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-h3 font-semibold tracking-tight leading-heading">
                {section.title}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {ka("spokeIndexTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {spokes.map((spoke) => (
              <li key={spoke.slug}>
                <Link
                  href={`/${locale}/venture-clienting/${spoke.slug}`}
                  className="text-primary hover:underline"
                >
                  → {spoke.short_label ?? spoke.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted-foreground">
            <Link
              href={`/${locale}/venture-clienting/propose`}
              className="text-primary hover:underline"
            >
              {ka("proposeArticleCta")} →
            </Link>
          </p>
        </section>

        <div className="mt-14 flex flex-wrap items-center gap-4 border-t pt-10">
          <Link
            href={`/${locale}/problems`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {ka("browseProblems")}
          </Link>
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {ka("submitProblem")}
          </Link>
        </div>

        <div className="mt-6">
          <SuggestEditForm
            targetType="knowledge_article"
            targetId={article.id}
            fields={editableFields}
          />
        </div>
      </article>
    </div>
  );
}
