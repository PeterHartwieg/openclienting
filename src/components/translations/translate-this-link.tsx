import Link from "next/link";
import { Languages } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { TranslationTargetType } from "@/lib/types/database";

interface TranslateThisLinkProps {
  locale: string;
  targetType: TranslationTargetType;
  targetId: string;
  className?: string;
}

/**
 * Small "Translate this" link shown on each translatable content surface.
 * Routes to `/{locale}/translate/{targetType}/{targetId}` where signed-in
 * users can contribute a translation in any of the 30 supported languages.
 *
 * Rendered on the server so the i18n string is inlined without a
 * client bundle hit.
 */
export async function TranslateThisLink({
  locale,
  targetType,
  targetId,
  className,
}: TranslateThisLinkProps) {
  const t = await getTranslations("translate");
  return (
    <Link
      href={`/${locale}/translate/${targetType}/${targetId}`}
      className={
        className ??
        "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      }
    >
      <Languages className="size-3.5" aria-hidden />
      {t("ctaTranslateThis")}
    </Link>
  );
}
