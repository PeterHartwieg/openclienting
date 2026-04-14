"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const cycle = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0" disabled>
        <Monitor className="h-4 w-4" />
        <span className="sr-only">{t("themeToggle")}</span>
      </Button>
    );
  }

  const current = (theme ?? "system") as keyof typeof icons;
  const Icon = icons[current] ?? Monitor;
  const nextIndex = (cycle.indexOf(current) + 1) % cycle.length;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 px-0"
      onClick={() => setTheme(cycle[nextIndex])}
      aria-label={t("themeToggle")}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{t("themeToggle")}</span>
    </Button>
  );
}
