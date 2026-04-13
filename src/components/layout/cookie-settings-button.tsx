"use client";

import { openCookieSettings } from "@/components/shared/cookie-consent";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Cookie Settings
    </button>
  );
}
