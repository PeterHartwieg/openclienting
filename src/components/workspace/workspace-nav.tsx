"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  workspaceNavGroups,
  type ModerationCounts,
  type NavRole,
  type WorkspaceCounts,
} from "@/lib/nav/config";
import {
  trackIaEvent,
  navItemIdToSection,
  type IaSurface,
} from "@/lib/analytics/ia-events";

interface WorkspaceNavProps {
  locale: string;
  role: NavRole;
  counts: WorkspaceCounts;
  moderationCounts?: ModerationCounts | null;
  onNavigate?: () => void;
  surface?: IaSurface;
  className?: string;
}

export function WorkspaceNav({
  locale,
  role,
  counts,
  moderationCounts,
  onNavigate,
  surface = "sidebar",
  className,
}: WorkspaceNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const groups = workspaceNavGroups(locale, {
    role,
    counts,
    moderationCounts,
    pathname,
  });

  return (
    <nav aria-label="Workspace" className={cn("flex flex-col gap-5", className)}>
      {groups.map((group) => (
        <div key={group.id}>
          <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t(group.labelKey)}
          </h3>
          <ul className="mt-1 flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(pathname, item, locale);
              const label = t(item.labelKey);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      trackIaEvent({
                        name: "ia_nav_click",
                        section: navItemIdToSection(item.id),
                        shell: "workspace",
                        surface,
                      });
                      onNavigate?.();
                    }}
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
                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-5 justify-center px-1.5 text-[0.65rem] font-semibold"
                      >
                        {item.badge.count}
                      </Badge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
