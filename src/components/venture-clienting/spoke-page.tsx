import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { cn } from "@/lib/utils";
import { getSiteUrl, getLanguageAlternates, siteConfig } from "@/lib/site";
import { localeTags } from "@/i18n/config";
import {
  knowledgeArticleSchema,
  faqPageSchema,
  type FaqItem,
  type SchemaSiteContext,
} from "@/lib/seo/schema";
import {
  DETAIL_BULLET_COUNT,
  FAQ_COUNT,
  SPOKES,
  TLDR_COUNT,
  getSpokeById,
  type SpokeConfig,
} from "@/lib/venture-clienting-cluster/config";

interface SpokePageProps {
  locale: string;
  spoke: SpokeConfig;
}

/**
 * Shared renderer for all six venture-clienting spoke pages.
 *
 * Each spoke route (e.g. `.../what-is-venture-clienting/page.tsx`) is a
 * ~20-line file that imports this component and hands it the locale + a
 * `SpokeConfig` looked up from `SPOKES`. Everything else — prose, JSON-LD,
 * breadcrumbs, CTA row — lives here so the six pages stay in lockstep.
 *
 * Visibility contract (see `src/lib/seo/schema.ts` header): every field in
 * the Article and FAQPage schemas is derived from the same i18n strings
 * that render as visible prose below, so hidden-but-schema'd content can't
 * drift from what users actually see.
 */
export async function SpokePage({ locale, spoke }: SpokePageProps) {
  const namespace = `ventureClientingCluster.${spoke.i18nKey}`;
  const t = await getTranslations({ locale, namespace });
  const bt = await getTranslations({ locale, namespace: "breadcrumbs" });

  // Absolute canonical URL for JSON-LD. Schema.org requires absolute URLs.
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}/${locale}/venture-clienting/${spoke.slug}`;

  // Updated stamp = build time. Same freshness model as the Markdown alt:
  // the content only changes on deploy, so all cached responses within a
  // revalidate window share the same `updated` timestamp.
  const updatedAt = new Date().toISOString();

  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: bt("ventureClienting"), url: `/${locale}/venture-clienting` },
    {
      name: bt(spoke.breadcrumbKey),
      url: `/${locale}/venture-clienting/${spoke.slug}`,
    },
  ];

  const tldrBullets = Array.from({ length: TLDR_COUNT }, (_, i) =>
    t(`tldr${i + 1}`),
  );
  const detailBullets = Array.from({ length: DETAIL_BULLET_COUNT }, (_, i) =>
    t(`detailBullet${i + 1}`),
  );
  const faq: FaqItem[] = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`faq${i + 1}Q`),
    answer: t(`faq${i + 1}A`),
  }));

  // Sibling spoke links — each spoke has exactly two cross-links. Labels
  // come from the sibling's own `shortLabel` key so the link text stays
  // consistent with how the sibling page titles itself.
  const siblingLinks = await Promise.all(
    spoke.siblings.map(async (siblingId) => {
      const sibling = getSpokeById(siblingId);
      const siblingT = await getTranslations({
        locale,
        namespace: `ventureClientingCluster.${sibling.i18nKey}`,
      });
      return {
        href: `/${locale}/venture-clienting/${sibling.slug}`,
        label: siblingT("shortLabel"),
      };
    }),
  );

  const siteCtx: SchemaSiteContext = {
    siteUrl,
    siteName: siteConfig.name,
    description: siteConfig.description,
    logoUrl: `${siteUrl}/icon.svg`,
  };

  const articleJsonLd = knowledgeArticleSchema(siteCtx, {
    headline: t("title"),
    description: t("lede"),
    canonicalUrl,
    inLanguage: localeTags[locale as keyof typeof localeTags] ?? "en-US",
    dateModified: updatedAt,
  });

  const faqJsonLd = faqPageSchema(faq);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <JsonLd data={[articleJsonLd, faqJsonLd]} />
      <Breadcrumbs
        items={breadcrumbItems}
        className="mb-8 text-sm text-muted-foreground"
      />
      <article>
        <h1 className="text-display font-bold leading-display tracking-tighter">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {t("lede")}
        </p>

        <section className="mt-12">
          <h2 className="text-h3 font-semibold tracking-tight leading-heading">
            {t("tldrTitle")}
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
            {tldrBullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-h3 font-semibold tracking-tight leading-heading">
            {t("detailTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("detailIntro")}
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground leading-relaxed">
            {detailBullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-h3 font-semibold tracking-tight leading-heading">
            {t("faqTitle")}
          </h2>
          <div className="mt-4 space-y-4">
            {faq.map((item, i) => (
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

        <div className="mt-14 flex flex-wrap items-center gap-3 border-t pt-10">
          <Link
            href={`/${locale}/venture-clienting`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {t("ctaHubLabel")}
          </Link>
          <Link
            href={`/${locale}/problems`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t("ctaBrowseLabel")}
          </Link>
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {t("ctaSubmitLabel")}
          </Link>
        </div>

        {siblingLinks.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("relatedTitle")}
            </h2>
            <ul className="mt-3 space-y-2">
              {siblingLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-primary hover:underline"
                  >
                    → {link.label}
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

/**
 * Metadata helper used by each spoke's `generateMetadata()`. Consolidates
 * title/description/hreflang/markdown-alternate so the spoke route files
 * stay tiny.
 */
export async function buildSpokeMetadata({
  locale,
  spoke,
}: {
  locale: string;
  spoke: SpokeConfig;
}) {
  const t = await getTranslations({
    locale,
    namespace: `ventureClientingCluster.${spoke.i18nKey}`,
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      ...getLanguageAlternates(locale, `/venture-clienting/${spoke.slug}`),
      types: {
        "text/markdown": `/${locale}/venture-clienting/${spoke.slug}/md`,
      },
    },
  };
}

// Re-export so route files can iterate the canonical list when needed.
export { SPOKES };
