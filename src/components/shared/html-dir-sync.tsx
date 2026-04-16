"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { isRtl } from "@/i18n/languages";

/**
 * Keeps <html lang> and <html dir> in sync with the active locale during
 * client-side navigation (including browser back/forward).
 *
 * The root layout sets these attributes server-side, but Next.js never
 * re-renders the root <html> shell on client transitions — so they go stale
 * when the user navigates between locales without a full page reload.
 *
 * This component lives inside NextIntlClientProvider (locale layout) so
 * useLocale() always reflects the current route's locale.
 */
export function HtmlDirSync() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
