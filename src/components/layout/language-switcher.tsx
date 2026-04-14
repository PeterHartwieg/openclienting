"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { locales, localeNames, type Locale } from "@/i18n/config";

/**
 * Footer language switcher. Swaps the locale segment of the current pathname
 * and persists the choice via next-intl's NEXT_LOCALE cookie. Search params
 * and the URL fragment are preserved so filtered/search pages don't lose
 * their state when the user toggles language.
 */
export function LanguageSwitcher() {
  const t = useTranslations("languageSwitcher");
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string }>();
  const [isPending, startTransition] = useTransition();

  function handleSelect(nextLocale: Locale) {
    if (nextLocale === activeLocale) return;
    // Strip the current locale prefix and prepend the new one. We use the raw
    // pathname rather than next-intl's helper because this component is
    // used outside the [locale] route group.
    const currentPrefix = `/${params.locale ?? activeLocale}`;
    const stripped = pathname.startsWith(currentPrefix)
      ? pathname.slice(currentPrefix.length) || "/"
      : pathname;
    const basePath = `/${nextLocale}${stripped === "/" ? "" : stripped}`;

    // Preserve query string and hash fragment so e.g. /en/problems?q=erp
    // becomes /de/problems?q=erp instead of /de/problems. usePathname() and
    // useSearchParams() never expose the hash, so we read it from the
    // browser at click time (always safe — handlers run client-side).
    const query = searchParams?.toString() ?? "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const target = `${basePath}${query ? `?${query}` : ""}${hash}`;

    startTransition(() => {
      // Set the cookie so future visits remember the choice. Wrapped in the
      // transition so this side-effect happens during navigation, not render.
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      router.replace(target);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
            disabled={isPending}
            aria-label={t("switchTo")}
          />
        }
      >
        <Globe className="mr-1.5 h-3.5 w-3.5" />
        {localeNames[activeLocale as Locale] ?? activeLocale.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSelect(loc)}
            data-active={loc === activeLocale}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
