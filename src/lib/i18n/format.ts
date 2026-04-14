import { localeTags, type Locale } from "@/i18n/config";

type DateStyle = "short" | "medium" | "long" | "full";

function bcp47(locale: string): string {
  return localeTags[locale as Locale] ?? localeTags.en;
}

/**
 * Format a date for display using the active locale's BCP-47 tag.
 * Centralised wrapper so we never call `toLocaleDateString("en-US", …)` directly.
 */
export function formatDate(
  date: Date | string,
  locale: string,
  style: DateStyle = "long",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions =
    style === "short"
      ? { year: "numeric", month: "short", day: "numeric" }
      : style === "medium"
        ? { year: "numeric", month: "short", day: "numeric" }
        : style === "full"
          ? {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          : { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat(bcp47(locale), opts).format(d);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(bcp47(locale)).format(value);
}
