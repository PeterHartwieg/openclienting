"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceNav } from "./workspace-nav";
import type {
  ModerationCounts,
  NavRole,
  WorkspaceCounts,
} from "@/lib/nav/config";

interface WorkspaceMobileBarProps {
  locale: string;
  role: NavRole;
  counts: WorkspaceCounts;
  moderationCounts?: ModerationCounts | null;
}

export function WorkspaceMobileBar({
  locale,
  role,
  counts,
  moderationCounts,
}: WorkspaceMobileBarProps) {
  const pathname = usePathname();
  // Derive open-ness from the pathname so browser back/forward resets it
  // without an effect. `openAt` records which pathname the drawer was
  // opened for; any route change naturally collapses it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (next: boolean) => setOpenAt(next ? pathname : null);
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tWorkspace = useTranslations("workspace");

  // Prevent background scroll while the drawer is open. This syncs React
  // state out to the DOM, which is the intended use of useEffect.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-16 z-30 flex items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur-md lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={tNav("openMenu")}
          aria-expanded={open}
          aria-controls="workspace-drawer"
        >
          <Menu className="size-4" aria-hidden />
          <span>{tWorkspace("title")}</span>
        </Button>
      </div>

      {open ? (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-black/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            id="workspace-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={tWorkspace("title")}
            className="fixed inset-y-0 start-0 top-16 z-40 flex w-72 max-w-[85vw] flex-col border-e bg-background shadow-xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">
                {tWorkspace("title")}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label={tCommon("close")}
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <WorkspaceNav
                locale={locale}
                role={role}
                counts={counts}
                moderationCounts={moderationCounts}
                onNavigate={() => setOpen(false)}
              />
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
