"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  locale: string;
  authSlot: React.ReactNode;
}

export function MobileNav({ locale, authSlot }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? tCommon("close") : t("openMenu")}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="absolute left-0 top-16 z-40 w-full border-b bg-background/95 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
            <Link
              href={`/${locale}/problems`}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              {t("browseProblems")}
            </Link>
            <Link
              href={`/${locale}/submit`}
              className={cn(buttonVariants({ size: "sm" }), "w-fit")}
              onClick={() => setOpen(false)}
            >
              {t("submitProblem")}
            </Link>
            <div className="mt-2 border-t pt-2">{authSlot}</div>
          </nav>
        </div>
      )}
    </>
  );
}
