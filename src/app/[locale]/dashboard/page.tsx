import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
    title: t("metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();
  const [{ data: submissions }, { data: solutionApproaches }, { data: notifications }] = await Promise.all([
    supabase
      .from("problem_templates")
      .select("id, title, status, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("solution_approaches")
      .select("id, title, status, created_at, problem_id")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/dashboard/organizations`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("organizations")}
          </Link>
          <Link
            href={`/${locale}/dashboard/settings`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {t("settings")}
          </Link>
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            {t("submitProblem")}
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            {t("notifications")} ({t("unread", { count: unreadCount })})
          </h2>
          <div className="mt-4 space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={cn(!n.read && "border-primary/30 bg-primary/5")}>
                <CardContent className="flex items-center gap-3 py-3">
                  {!n.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    {n.link ? (
                      <Link href={n.link} className="text-sm font-medium hover:underline">
                        {n.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{n.title}</p>
                    )}
                    {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(n.created_at, locale, "short")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold">{t("yourSubmissions")}</h2>

        {!submissions || submissions.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">{t("noProblems")}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {submissions.map((sub) => (
              <Link key={sub.id} href={`/${locale}/problems/${sub.id}`}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sub.title}</CardTitle>
                      <StatusBadge status={sub.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("submittedAt", { date: formatDate(sub.created_at, locale, "medium") })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">{t("yourSolutionApproaches")}</h2>

        {!solutionApproaches || solutionApproaches.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">{t("noApproaches")}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {solutionApproaches.map((sa) => (
              <Link key={sa.id} href={`/${locale}/problems/${sa.problem_id}`}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sa.title}</CardTitle>
                      <StatusBadge status={sa.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("submittedAt", { date: formatDate(sa.created_at, locale, "medium") })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
