import { getCurrentUser } from "@/lib/auth/roles";
import { getWorkspaceCounts } from "@/lib/nav/counts";
import { getModerationCounts } from "@/lib/queries/moderation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { NavRole } from "@/lib/nav/config";

export default async function ShellLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  let role: NavRole | null = null;
  let counts = null;
  let moderationCounts = null;

  if (user) {
    role = (user.profile?.role ?? "contributor") as NavRole;
    const isModOrAdmin = role === "moderator" || role === "admin";
    [counts, moderationCounts] = await Promise.all([
      getWorkspaceCounts(user.id),
      isModOrAdmin ? getModerationCounts() : Promise.resolve(null),
    ]);
  }

  return (
    <WorkspaceShell
      locale={locale}
      user={user}
      role={role}
      counts={counts}
      moderationCounts={moderationCounts}
    >
      {children}
    </WorkspaceShell>
  );
}
