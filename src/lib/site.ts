import type { Metadata } from "next";
import { defaultLocale, locales } from "@/i18n/config";

const SITE_NAME = "OpenClienting";
const SITE_DESCRIPTION =
  "Open-source venture clienting knowledge base for SMEs and startups to share problem templates, pilot frameworks, and verified outcomes.";
const SITE_URL_FALLBACK = "https://openclienting.org";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (!configuredUrl) {
    return new URL(SITE_URL_FALLBACK);
  }

  const normalizedUrl = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return new URL(normalizedUrl);
}

/**
 * Build self-referential hreflang alternates for a localized page.
 *
 * The canonical URL must point at the *current* locale's page, not the
 * default locale — otherwise crawlers treat non-default locales as duplicates
 * of the default and deindex the translations. The `languages` map still
 * lists every locale (plus x-default → default locale) so Google can link
 * the equivalent translations together.
 */
export function getLanguageAlternates(locale: string, pathname = "") {
  const languages = Object.fromEntries(
    locales.map((l) => [l, `/${l}${pathname}`]),
  );

  return {
    canonical: `/${locale}${pathname}`,
    languages: {
      ...languages,
      "x-default": `/${defaultLocale}${pathname}`,
    },
  } satisfies NonNullable<Metadata["alternates"]>;
}

export const siteConfig = {
  name: SITE_NAME,
  shortName: SITE_NAME,
  description: SITE_DESCRIPTION,
};
