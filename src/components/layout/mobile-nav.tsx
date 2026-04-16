"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNavItemActive, publicNavItems } from "@/lib/nav/config";

interface MobileNavProps {
  locale: string;
  authSlot: React.ReactNode;
}

export function MobileNav({ locale, authSlot }: MobileNavProps) {
  const pathname = usePathname();
  // Derive open-ness from the pathname so browser back/forward resets it
  // without an effect. `openAt` records which pathname the menu was opened
  // for; any route change naturally collapses the menu.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (next: boolean) => setOpenAt(next ? pathname : null);
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const items = publicNavItems(locale);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? tCommon("close") : tNav("openMenu")}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 top-16 z-40 w-full border-b bg-background/95 backdrop-blur-md md:hidden">
          <nav
            aria-label="Primary"
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3"
          >
            {items.map((item) => {
              const active = isNavItemActive(pathname, item, locale);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
            <Link
              href={`/${locale}/submit`}
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ size: "sm" }), "mt-2 w-fit")}
            >
              {tNav("submit")}
            </Link>
            <div className="mt-3 border-t pt-3">{authSlot}</div>
          </nav>
        </div>
      )}
    </>
  );
}
