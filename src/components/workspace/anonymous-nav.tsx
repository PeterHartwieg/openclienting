"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LoginDialog } from "@/components/auth/login-dialog";
import {
  isNavItemActive,
  publicNavItems,
  publicCtaItem,
} from "@/lib/nav/config";

interface AnonymousNavProps {
  locale: string;
  onNavigate?: () => void;
  className?: string;
}

export function AnonymousNav({ locale, onNavigate, className }: AnonymousNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const items = [...publicNavItems(locale), publicCtaItem(locale)];

  return (
    <nav aria-label="Discover" className={cn("flex flex-col gap-5", className)}>
      <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
        <p className="text-sm font-medium">{t("workspace.anonymous.ctaTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("workspace.anonymous.ctaSubtitle")}</p>
        <LoginDialog />
      </div>

      <div>
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("workspace.anonymous.discoverLabel")}
        </h3>
        <ul className="mt-1 flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(pathname, item, locale);
            const label = t(item.labelKey);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
                  <span className="flex-1 truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
