import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { getWorkspaceCounts } from "@/lib/nav/counts";
import { getModerationCounts } from "@/lib/queries/moderation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { NavRole } from "@/lib/nav/config";

export default async function ModerateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Gate: anyone reaching a /moderate route must be a moderator or admin.
  // requireRole throws on failure; redirect (which itself throws `never`)
  // sends them home rather than surfacing an error boundary.
  const user = await requireRole("moderator").catch(() =>
    redirect(`/${locale}`),
  );

  const role = (user.profile?.role ?? "moderator") as NavRole;

  const [counts, moderationCounts] = await Promise.all([
    getWorkspaceCounts(user.id),
    getModerationCounts(),
  ]);

  return (
    <WorkspaceShell
      locale={locale}
      role={role}
      counts={counts}
      moderationCounts={moderationCounts}
    >
      {children}
    </WorkspaceShell>
  );
}
