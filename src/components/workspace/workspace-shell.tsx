import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceMobileBar } from "./workspace-mobile-bar";
import { AnonymousNav } from "./anonymous-nav";
import { FirstLoginActionTracker } from "@/components/analytics/first-login-action-tracker";
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
        <FirstLoginActionTracker locale={locale} />
        {children}
      </div>
    </div>
  );
}
