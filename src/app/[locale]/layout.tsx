import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsentWrapper } from "@/components/shared/cookie-consent";
import { RouteChangeTracker } from "@/components/shared/route-change-tracker";
import { LoginTimestampSetter } from "@/components/analytics/login-timestamp-setter";
import { HtmlDirSync } from "@/components/shared/html-dir-sync";
import { JsonLd } from "@/components/seo/json-ld";
import { locales, localeTags, type Locale } from "@/i18n/config";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { getSchemaSiteContext } from "@/lib/seo/site-context";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  // Make the locale available for static rendering of nested segments.
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations("common");

  // Site-wide JSON-LD (WebSite + Organization) emitted once per locale.
  // Root-locale canonical URL and inLanguage tag are locale-specific, so this
  // belongs in the per-locale layout rather than the root layout.
  const siteCtx = getSchemaSiteContext();
  const inLanguageTag = localeTags[locale as Locale];
  const siteSchemas = [
    websiteSchema(siteCtx, locale, inLanguageTag),
    organizationSchema(siteCtx),
  ];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <JsonLd data={siteSchemas} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        {t("skipToContent")}
      </a>
      <Header locale={locale} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} />
      <HtmlDirSync />
      <RouteChangeTracker />
      <LoginTimestampSetter />
      <CookieConsentWrapper />
    </NextIntlClientProvider>
  );
}
