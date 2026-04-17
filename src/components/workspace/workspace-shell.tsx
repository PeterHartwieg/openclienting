import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceMobileBar } from "./workspace-mobile-bar";
import { AnonymousNav } from "./anonymous-nav";
import { FirstLoginActionTracker } from "@/components/analytics/first-login-action-tracker";
import { GlobalSearch } from "./global-search";
import { RecentNavTracker } from "./recent-nav-tracker";
import type {
  ModerationCounts,
  NavRole,
  WorkspaceCounts,
} from "@/lib/nav/config";

interface WorkspaceShellProps {
  locale: string;
  /** Null for anonymous visitors — renders sign-in CTA + discovery nav instead. */
  user: { id: string } | null;
  role: NavRole | null;
  counts: WorkspaceCounts | null;
  moderationCounts?: ModerationCounts | null;
  children: React.ReactNode;
}

export function WorkspaceShell({
  locale,
  user,
  role,
  counts,
  moderationCounts,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="mx-auto flex max-w-7xl items-start">
      <aside
        aria-label="Workspace navigation"
        className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-e px-4 py-6 lg:block"
      >
        {user && role && counts ? (
          <WorkspaceNav
            locale={locale}
            role={role}
            counts={counts}
            moderationCounts={moderationCounts}
          />
        ) : (
          <AnonymousNav locale={locale} />
        )}
      </aside>
      <div className="min-w-0 flex-1">
        <WorkspaceMobileBar
          locale={locale}
          user={user}
          role={role}
          counts={counts}
          moderationCounts={moderationCounts}
        />
        {/* Desktop search bar — visible md+ only (below mobile bar breakpoint) */}
        <div className="hidden border-b px-4 py-2 md:flex md:items-center lg:px-6">
          <GlobalSearch locale={locale} />
        </div>
        {/* TODO(feat/ia-mobile-drawer): slot <GlobalSearch> and recent items
            into the mobile drawer when Slice D merges. The useRecentNav hook
            is importable from @/lib/hooks/use-recent-nav. */}
        <FirstLoginActionTracker locale={locale} />
        {user && <RecentNavTracker locale={locale} />}
        {children}
      </div>
    </div>
  );
}
