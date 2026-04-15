import Link from "next/link";
import { Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { getLanguageLabel } from "@/i18n/languages";

interface ShowOriginalToggleProps {
  /** Current URL locale (the visitor's chosen language). */
  locale: string;
  /** Path the toggle links back to (without query string). */
  pathname: string;
  /** Whether the page is currently rendering original-language content. */
  showingOriginal: boolean;
  /**
   * Distinct source languages found across the problem tree. When all
   * source rows share one language we surface it in the label so the
   * visitor knows what they're switching into; otherwise the button is
   * left language-agnostic.
   */
  sourceLanguages: readonly string[];
  className?: string;
}

/**
 * Page-level toggle that flips the problem detail view between the
 * locale-translated content and the original-language source. Rendered
 * only on problem-related pages (problem + requirements + frameworks +
 * solution approaches) — the only surfaces the open-source translation
 * pipeline covers.
 *
 * Implemented as a server-rendered <Link> that adds or removes the
 * `?original=1` query param. State lives in the URL so the toggle
 * survives navigation, sharing, and reloads, and so the page can stay
 * a Server Component end-to-end (matching the project's "use client
 * only when needed" rule).
 *
 * The caller decides whether to render this at all — only show when
 * there is actually something to translate (i.e. some row in the tree
 * has a source_language different from the current locale).
 */
export async function ShowOriginalToggle({
  locale,
  pathname,
  showingOriginal,
  sourceLanguages,
  className,
}: ShowOriginalToggleProps) {
  const t = await getTranslations({ locale, namespace: "translate" });

  const href = showingOriginal ? pathname : `${pathname}?original=1`;

  // If there's exactly one distinct source language across the tree we can
  // promise the visitor what they'll get. With multiple, stay generic.
  const singleSource =
    sourceLanguages.length === 1 ? sourceLanguages[0] : null;

  const label = showingOriginal
    ? t("showTranslatedVersion")
    : singleSource
      ? t("showOriginalIn", { language: getLanguageLabel(singleSource) })
      : t("showOriginal");

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-8 gap-1.5 px-3 text-xs",
        className,
      )}
      aria-pressed={showingOriginal}
    >
      <Languages className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
