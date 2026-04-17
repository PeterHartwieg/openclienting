import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { ModerationQueueTracker } from "@/components/analytics/moderation-queue-tracker";

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
  await requireRole("moderator").catch(() => redirect(`/${locale}`));

  return (
    <>
      <ModerationQueueTracker />
      {children}
    </>
  );
}
