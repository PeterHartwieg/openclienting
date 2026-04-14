"use client";

import { useTranslations } from "next-intl";
import { openCookieSettings } from "@/components/shared/cookie-consent";

export function CookieSettingsButton() {
  const t = useTranslations("footer");
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {t("cookieSettings")}
    </button>
  );
}
