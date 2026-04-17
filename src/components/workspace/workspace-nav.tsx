"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  isNavItemActive,
  workspaceNavGroups,
  type ModerationCounts,
  type NavGroup,
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
  /**
   * "desktop"          — all groups always expanded (current default behavior)
   * "mobile-collapsed" — groups collapsed by default; the group containing the
   *                      active route is auto-expanded on mount.
   */
  variant?: "desktop" | "mobile-collapsed";
}

export function WorkspaceNav({
  locale,
  role,
  counts,
  moderationCounts,
  onNavigate,
  surface = "sidebar",
  className,
  variant = "desktop",
}: WorkspaceNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const groups = workspaceNavGroups(locale, {
    role,
    counts,
    moderationCounts,
    pathname,
  });

  if (variant === "mobile-collapsed") {
    return (
      <CollapsibleGroupNav
        groups={groups}
        locale={locale}
        pathname={pathname}
        surface={surface}
        onNavigate={onNavigate}
        className={className}
        t={t}
      />
    );
  }

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

// ---------------------------------------------------------------------------
// Internal: collapsible group rendering for mobile-collapsed variant
// ---------------------------------------------------------------------------

function groupContainsActive(
  group: NavGroup,
  pathname: string,
  locale: string,
): boolean {
  return group.items.some((item) => isNavItemActive(pathname, item, locale));
}

interface CollapsibleGroupNavProps {
  groups: NavGroup[];
  locale: string;
  pathname: string;
  surface: IaSurface;
  onNavigate?: () => void;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, ...args: any[]) => string;
}

function CollapsibleGroupNav({
  groups,
  locale,
  pathname,
  surface,
  onNavigate,
  className,
  t,
}: CollapsibleGroupNavProps) {
  // Initialise open state: auto-expand whichever group contains the active route.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const group of groups) {
      if (groupContainsActive(group, pathname, locale)) {
        initial.add(group.id);
      }
    }
    return initial;
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const tDrawer = t;

  return (
    <nav
      aria-label={t("workspaceDrawer.allNavLabel")}
      className={cn("flex flex-col gap-1", className)}
    >
      {groups.map((group) => {
        const isOpen = openGroups.has(group.id);
        const groupLabel = t(group.labelKey);
        const controlsId = `drawer-group-${group.id}`;

        return (
          <div key={group.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={controlsId}
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
              aria-label={
                isOpen
                  ? tDrawer("workspaceDrawer.collapseGroup", { group: groupLabel })
                  : tDrawer("workspaceDrawer.expandGroup", { group: groupLabel })
              }
            >
              <span>{groupLabel}</span>
              <ChevronDown
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-150",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {isOpen && (
              <ul id={controlsId} className="mt-0.5 flex flex-col gap-0.5">
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
            )}
          </div>
        );
      })}
    </nav>
  );
}
