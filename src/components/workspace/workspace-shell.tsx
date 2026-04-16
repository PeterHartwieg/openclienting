import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceMobileBar } from "./workspace-mobile-bar";
import type {
  ModerationCounts,
  NavRole,
  WorkspaceCounts,
} from "@/lib/nav/config";

interface WorkspaceShellProps {
  locale: string;
  role: NavRole;
  counts: WorkspaceCounts;
  /**
   * Optional. Provided by the moderation layout so the sidebar can render
   * per-queue badges; omitted (null/undefined) elsewhere so the contributor
   * groups stay unchanged when outside moderation.
   */
  moderationCounts?: ModerationCounts | null;
  children: React.ReactNode;
}

/**
 * Two-column workspace layout used for authenticated task-heavy areas.
 * Desktop: persistent sidebar on the start edge, content flows on the end.
 * Mobile: compact top bar triggers a drawer holding the same nav.
 *
 * This shell is intentionally kept agnostic of page content; page components
 * still own their own `<h1>` and inner width constraints.
 */
export function WorkspaceShell({
  locale,
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
        <WorkspaceNav
          locale={locale}
          role={role}
          counts={counts}
          moderationCounts={moderationCounts}
        />
      </aside>
      <div className="min-w-0 flex-1">
        <WorkspaceMobileBar
          locale={locale}
          role={role}
          counts={counts}
          moderationCounts={moderationCounts}
        />
        {children}
      </div>
    </div>
  );
}
