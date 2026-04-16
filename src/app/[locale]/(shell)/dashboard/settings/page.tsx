import { redirect } from "next/navigation";

// Notification preferences now live on the Account page. Kept as a
// permanent 308 redirect so old dashboard links, emails, and bookmarks
// still land in the right place.
export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/account#notifications`);
}
