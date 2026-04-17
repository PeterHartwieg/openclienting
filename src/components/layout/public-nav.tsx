"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isNavItemActive, publicNavItems } from "@/lib/nav/config";
import { trackIaEvent } from "@/lib/analytics/ia-events";

export function PublicNav({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations();
  const items = publicNavItems(locale);

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const active = isNavItemActive(pathname, item, locale);
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={() =>
              trackIaEvent({
                name: "ia_nav_click",
                section: item.id,
                shell: "public",
                surface: "header",
              })
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(item.labelKey)}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
