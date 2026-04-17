import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { MarkAllReadButton } from "@/components/dashboard/mark-all-read-button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/i18n/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return {
    title: `${t("overview.notifications.title")} — OpenClienting`,
    robots: { index: false, follow: false },
  };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const user = await getCurrentUser();

  if (!user) redirect(`/${locale}`);

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];
  const unreadCount = items.filter((n) => !(n.read as boolean)).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/dashboard`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {t("title")}
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("overview.notifications.title")}
        </h1>
        <MarkAllReadButton
          unreadCount={unreadCount}
          label={t("overview.notifications.markAllRead")}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          state="match"
          message={t("overview.notifications.empty")}
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.id}
              className={cn(
                !(n.read as boolean) && "ring-primary/40",
              )}
            >
              <CardContent className="flex items-start gap-3 py-3">
                {!(n.read as boolean) && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                <div className={cn("flex-1 min-w-0", (n.read as boolean) && "pl-5")}>
                  {n.link ? (
                    <Link
                      href={n.link as string}
                      className="text-sm font-medium hover:underline"
                    >
                      {n.title as string}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{n.title as string}</p>
                  )}
                  {n.body && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {n.body as string}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(n.created_at as string, locale, "short")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
