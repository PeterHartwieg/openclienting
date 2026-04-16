import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";
import { getWorkspaceCounts } from "@/lib/nav/counts";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { NavRole } from "@/lib/nav/config";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}`);
  }

  const role = (user.profile?.role ?? "contributor") as NavRole;
  const counts = await getWorkspaceCounts(user.id);

  return (
    <WorkspaceShell locale={locale} role={role} counts={counts}>
      {children}
    </WorkspaceShell>
  );
}
