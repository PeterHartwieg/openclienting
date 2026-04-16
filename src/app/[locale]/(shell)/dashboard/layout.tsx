import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/roles";

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

  return <>{children}</>;
}
