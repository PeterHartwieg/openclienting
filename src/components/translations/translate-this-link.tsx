import Link from "next/link";
import { Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { TranslationTargetType } from "@/lib/types/database";

interface TranslateThisLinkProps {
  locale: string;
  targetType: TranslationTargetType;
  targetId: string;
  className?: string;
}

/**
 * "Translate" button shown on each translatable content surface.
 * Routes to `/{locale}/translate/{targetType}/{targetId}` where
 * signed-in users can contribute a translation in any of the 30
 * supported languages.
 *
 * Styled as a small ghost button with a pen icon so it reads as
 * an editorial action on the same visual level as "Suggest edit".
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
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-label={t("ctaTranslateThis")}
    >
      <Pencil className="size-3.5" aria-hidden />
      {t("ctaTranslateThis")}
    </Link>
  );
}
