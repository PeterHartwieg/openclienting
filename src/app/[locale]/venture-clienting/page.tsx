import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils";
import { getLanguageAlternates } from "@/lib/site";
import { SPOKES } from "@/lib/venture-clienting-cluster/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ventureClienting" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      ...getLanguageAlternates(locale, "/venture-clienting"),
      // Markdown alternate for LLM crawlers — discovered via `llms.txt` and
      // this `<link rel="alternate" type="text/markdown">` header.
      types: {
        "text/markdown": `/${locale}/venture-clienting/md`,
      },
    },
  };
}

export default async function VentureClientingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ventureClienting");
  const bt = await getTranslations({ locale, namespace: "breadcrumbs" });

  const breadcrumbItems = [
    { name: bt("home"), url: `/${locale}` },
    { name: bt("ventureClienting"), url: `/${locale}/venture-clienting` },
  ];

  const sections = [
    { title: t("section1Title"), body: t("section1Body") },
    { title: t("section2Title"), body: t("section2Body") },
    { title: t("section3Title"), body: t("section3Body") },
    { title: t("section4Title"), body: t("section4Body") },
    { title: t("section5Title"), body: t("section5Body") },
  ];

  const spokeLinks = await Promise.all(
    SPOKES.map(async (spoke) => {
      const st = await getTranslations({
        locale,
        namespace: `ventureClientingCluster.${spoke.i18nKey}`,
      });
      return {
        href: `/${locale}/venture-clienting/${spoke.slug}`,
        label: st("shortLabel"),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm text-muted-foreground" />
      <article>
        <h1 className="text-display font-bold leading-display tracking-tighter">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          {t("lede")}
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-h3 font-semibold tracking-tight leading-heading">
                {section.title}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("spokeIndexTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {spokeLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-primary hover:underline">
                  → {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-14 flex flex-wrap items-center gap-4 border-t pt-10">
          <Link
            href={`/${locale}/problems`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t("ctaBrowse")}
          </Link>
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {t("ctaSubmit")}
          </Link>
        </div>
      </article>
    </div>
  );
}
