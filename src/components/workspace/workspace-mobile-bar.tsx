"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Bell,
  Menu,
  Send,
  ShieldCheck,
  X,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkspaceNav } from "./workspace-nav";
import { AnonymousNav } from "./anonymous-nav";
import { trackIaEvent } from "@/lib/analytics/ia-events";
import type {
  ModerationCounts,
  NavRole,
  WorkspaceCounts,
} from "@/lib/nav/config";

interface WorkspaceMobileBarProps {
  locale: string;
  user: { id: string } | null;
  role: NavRole | null;
  counts: WorkspaceCounts | null;
  moderationCounts?: ModerationCounts | null;
}

// ---------------------------------------------------------------------------
// Derive the highest-count moderation queue and its human-readable label key.
// Returns null when moderationCounts is absent or all queues are zero.
// ---------------------------------------------------------------------------
type QueueKey = keyof ModerationCounts;

const QUEUE_ORDER: QueueKey[] = [
  "problems",
  "requirements",
  "frameworks",
  "solutions",
  "successReports",
  "suggestedEdits",
  "organizationVerification",
  "liveRevisions",
  "knowledgeArticles",
  "translations",
];

function topQueue(
  moderationCounts: ModerationCounts,
): { key: QueueKey; count: number } | null {
  let best: { key: QueueKey; count: number } | null = null;
  for (const key of QUEUE_ORDER) {
    const count = moderationCounts[key];
    if (count > 0 && (best === null || count > best.count)) {
      best = { key, count };
    }
  }
  return best;
}

const QUEUE_HREF: Record<QueueKey, string> = {
  problems: "problems",
  requirements: "requirements",
  frameworks: "frameworks",
  solutions: "solutions",
  successReports: "success-reports",
  suggestedEdits: "suggested-edits",
  organizationVerification: "organization-verification",
  liveRevisions: "live-revisions",
  knowledgeArticles: "knowledge-articles",
  translations: "translations",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkspaceMobileBar({
  locale,
  user,
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
  const tDrawer = useTranslations("workspaceDrawer");

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

  const isMod = role === "moderator" || role === "admin";

  // Compute the review-queue deep-link destination and label once.
  const queueInfo =
    isMod && moderationCounts ? topQueue(moderationCounts) : null;
  const reviewHref = queueInfo
    ? `/${locale}/moderate/${QUEUE_HREF[queueInfo.key]}`
    : `/${locale}/moderate`;
  const reviewLabel = queueInfo
    ? tDrawer("reviewQueueWithCount", {
        count: queueInfo.count,
        queue: tDrawer(`queueLabels.${queueInfo.key}`),
      })
    : tDrawer("reviewQueue");

  const notifCount = counts?.unreadNotifications ?? 0;
  const notifAriaLabel =
    notifCount > 0
      ? tDrawer("notificationsWithCount", { count: notifCount })
      : tDrawer("notifications");

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
            {/* Drawer header */}
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

            <div className="flex-1 overflow-y-auto">
              {user && role && counts ? (
                <>
                  {/* --------------------------------------------------------
                      Block 1 — "Jump back in" (recent items placeholder)
                      TODO (Slice E): slot in the <RecentItems> primitive here
                      once it lands. Slice E will ship a reusable hook
                      (e.g. useRecentItems) and a companion component. Do NOT
                      build a localStorage implementation in this file — that
                      is Slice E's responsibility.
                  --------------------------------------------------------- */}

                  {/* --------------------------------------------------------
                      Block 2 — Primary task-flow items
                  --------------------------------------------------------- */}
                  <div className="px-3 py-4">
                    <ul className="flex flex-col gap-1">
                      {/* Submit a problem */}
                      <li>
                        <Link
                          href={`/${locale}/submit`}
                          onClick={() => {
                            trackIaEvent({
                              name: "ia_nav_click",
                              section: "submit",
                              shell: "workspace",
                              surface: "drawer",
                            });
                            setOpen(false);
                          }}
                          className={cn(
                            buttonVariants({ variant: "default", size: "sm" }),
                            "w-full justify-start gap-2.5",
                          )}
                        >
                          <Send className="size-4 shrink-0" aria-hidden />
                          {tDrawer("submitProblem")}
                        </Link>
                      </li>

                      {/* My submissions */}
                      <li>
                        <Link
                          href={`/${locale}/dashboard`}
                          onClick={() => {
                            trackIaEvent({
                              name: "ia_nav_click",
                              section: "dashboard",
                              shell: "workspace",
                              surface: "drawer",
                            });
                            setOpen(false);
                          }}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "w-full justify-start gap-2.5",
                          )}
                        >
                          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
                          {tDrawer("mySubmissions")}
                        </Link>
                      </li>

                      {/* Notifications */}
                      <li>
                        <Link
                          href={`/${locale}/dashboard/notifications`}
                          onClick={() => {
                            trackIaEvent({
                              name: "ia_nav_click",
                              section: "notifications",
                              shell: "workspace",
                              surface: "drawer",
                            });
                            setOpen(false);
                          }}
                          aria-label={notifAriaLabel}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "w-full justify-start gap-2.5",
                          )}
                        >
                          <Bell className="size-4 shrink-0" aria-hidden />
                          <span className="flex-1">{tDrawer("notifications")}</span>
                          {notifCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="h-5 min-w-5 justify-center px-1.5 text-[0.65rem] font-semibold"
                            >
                              {notifCount}
                            </Badge>
                          )}
                        </Link>
                      </li>

                      {/* Review queue — moderator/admin only */}
                      {isMod && (
                        <li>
                          <Link
                            href={reviewHref}
                            onClick={() => {
                              trackIaEvent({
                                name: "ia_nav_click",
                                section: "moderate",
                                shell: "workspace",
                                surface: "drawer",
                              });
                              setOpen(false);
                            }}
                            aria-label={reviewLabel}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "w-full justify-start gap-2.5",
                            )}
                          >
                            <ShieldCheck className="size-4 shrink-0" aria-hidden />
                            <span className="flex-1 truncate">{reviewLabel}</span>
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* --------------------------------------------------------
                      Block 3 — Full category nav (collapsed by default,
                      active group auto-expanded on mount)
                  --------------------------------------------------------- */}
                  <div className="border-t px-3 py-4">
                    <WorkspaceNav
                      locale={locale}
                      role={role}
                      counts={counts}
                      moderationCounts={moderationCounts}
                      onNavigate={() => setOpen(false)}
                      surface="drawer"
                      variant="mobile-collapsed"
                    />
                  </div>
                </>
              ) : (
                <div className="px-3 py-4">
                  <AnonymousNav
                    locale={locale}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
