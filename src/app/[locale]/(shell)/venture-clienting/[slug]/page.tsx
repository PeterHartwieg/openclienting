import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { SuggestEditForm } from "@/components/problems/suggest-edit-form";
import { cn } from "@/lib/utils";
import { getSiteUrl, getLanguageAlternates, siteConfig } from "@/lib/site";
import { localeTags } from "@/i18n/config";
import {
  knowledgeArticleSchema,
  faqPageSchema,
  type SchemaSiteContext,
} from "@/lib/seo/schema";
import {
  getAllPublishedSpokeSlugs,
  getSiblingArticles,
  getSpokeArticle,
} from "@/lib/queries/knowledge-articles";

/**
 * Catch-all spoke renderer for the venture-clienting knowledge
 * cluster. Any `knowledge_articles` row with `kind='spoke'` and
 * `status='published'` is reachable at
 * `/[locale]/venture-clienting/[slug]` without a per-spoke route file.
 *
 * `generateStaticParams` pre-renders every published spoke slug at
 * build time; new slugs approved by a moderator after deploy are
 * picked up via `revalidate` (the query layer tags reads with
 * `knowledge_articles`, which moderator actions invalidate).
 */

export async function generateStaticParams() {
  const slugs = await getAllPublishedSpokeSlugs();
  // Next.js calls this once per dynamic segment — we expand across
  // locales inside the page files via the `[locale]` segment above.
  return slugs.map((slug) => ({ slug }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getSpokeArticle(slug, locale);
  if (!article) return {};
  return {
    title: article.meta_title,
    description: article.meta_description,
    alternates: {
      ...getLanguageAlternates(locale, `/venture-clienting/${slug}`),
      types: {
        "text/markdown": `/${locale}/venture-clienting/${slug}/md`,
      },
    },
  };
}

export default async function SpokeArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await getSpokeArticle(slug, locale);
  if (!article) notFound();

  const [ka, bt, siblings] = await Promise.all([
    getTranslations({ locale, namespace: "knowledgeArticle" }),
    getTranslations({ locale, namespace: "breadcrumbs" }),
    getSiblingArticles(article, locale, 2),
  ]);

  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: ka("hubLabel"), url: `/${locale}/venture-clienting` },
    {
      name: article.short_label ?? article.title,
      url: `/${locale}/venture-clienting/${article.slug}`,
    },
  ];

  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/venture-clienting/${article.slug}`;

  const siteCtx: SchemaSiteContext = {
    siteUrl,
    siteName: siteConfig.name,
    description: siteConfig.description,
    logoUrl: `${siteUrl}/icon.svg`,
  };

  const articleJsonLd = knowledgeArticleSchema(siteCtx, {
    headline: article.title,
    description: article.lede,
    canonicalUrl,
    inLanguage: localeTags[locale as keyof typeof localeTags] ?? "en-US",
    // DB timestamp — updates whenever a moderator applies a suggested
    // edit via the existing `handle_updated_at` trigger.
    dateModified: article.updated_at,
  });

  const faqJsonLd =
    article.faq.length > 0 ? faqPageSchema(article.faq) : null;

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
    article.tldr_title !== null && {
      key: "tldr_title",
      label: ka("fieldTldrTitle"),
      value: article.tldr_title,
    },
    article.detail_title !== null && {
      key: "detail_title",
      label: ka("fieldDetailTitle"),
      value: article.detail_title,
    },
    article.detail_intro !== null && {
      key: "detail_intro",
      label: ka("fieldDetailIntro"),
      value: article.detail_intro,
      multiline: true,
    },
    article.faq_title !== null && {
      key: "faq_title",
      label: ka("fieldFaqTitle"),
      value: article.faq_title,
    },
  ].filter(
    (f): f is {
      key: string;
      label: string;
      value: string;
      multiline?: boolean;
    } => Boolean(f),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <JsonLd data={faqJsonLd ? [articleJsonLd, faqJsonLd] : [articleJsonLd]} />
      <Breadcrumbs
        items={breadcrumbItems}
        className="mb-8 text-sm text-muted-foreground"
      />
      <article>
        <h1 className="text-display font-bold leading-display tracking-tighter">
          {article.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {article.lede}
        </p>

        {article.tldr.length > 0 && (
          <section className="mt-12">
            {article.tldr_title && (
              <h2 className="text-h3 font-semibold tracking-tight leading-heading">
                {article.tldr_title}
              </h2>
            )}
            <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
              {article.tldr.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </section>
        )}

        {(article.detail_intro || article.detail_bullets.length > 0) && (
          <section className="mt-10">
            {article.detail_title && (
              <h2 className="text-h3 font-semibold tracking-tight leading-heading">
                {article.detail_title}
              </h2>
            )}
            {article.detail_intro && (
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {article.detail_intro}
              </p>
            )}
            {article.detail_bullets.length > 0 && (
              <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
                {article.detail_bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {article.faq.length > 0 && (
          <section className="mt-10">
            {article.faq_title && (
              <h2 className="text-h3 font-semibold tracking-tight leading-heading">
                {article.faq_title}
              </h2>
            )}
            <div className="mt-4 space-y-4">
              {article.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-lg border border-border bg-card p-4"
                >
                  <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                    <span className="group-open:text-primary">{item.question}</span>
                  </summary>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-14 flex flex-wrap items-center gap-3 border-t pt-10">
          <Link
            href={`/${locale}/venture-clienting`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {ka("backToHub")}
          </Link>
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

        {siblings.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {ka("relatedTitle")}
            </h2>
            <ul className="mt-3 space-y-2">
              {siblings.map((sibling) => (
                <li key={sibling.slug}>
                  <Link
                    href={`/${locale}/venture-clienting/${sibling.slug}`}
                    className="text-primary hover:underline"
                  >
                    → {sibling.short_label ?? sibling.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
