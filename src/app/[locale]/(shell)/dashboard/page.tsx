import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { getDashboardOverview, type ContentKind, type RecentNotification } from "@/lib/queries/dashboard";
import { MarkAllReadButton } from "@/components/dashboard/mark-all-read-button";
import { getModerationCounts } from "@/lib/queries/moderation";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/i18n/format";
import { TrackedCardLink } from "@/components/analytics/tracked-card-link";
import { JumpBackInCard } from "@/components/dashboard/jump-back-in-card";

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

  const role = (user.profile?.role ?? "contributor") as string;
  const isModerator = role === "moderator" || role === "admin";

  const [data, moderationCounts] = await Promise.all([
    getDashboardOverview(user.id),
    // getModerationCounts is cache()-wrapped; for moderators this is a cache
    // hit since the shell layout already called it for the sidebar badges.
    isModerator ? getModerationCounts() : Promise.resolve(null),
  ]);

  const totalModeration = moderationCounts
    ? Object.values(moderationCounts).reduce((a, b) => a + b, 0)
    : 0;

  const kindLabel: Record<ContentKind, string> = {
    problem: t("overview.kindLabels.problem"),
    requirement: t("overview.kindLabels.requirement"),
    framework: t("overview.kindLabels.framework"),
    solution: t("overview.kindLabels.solution"),
    success_report: t("overview.kindLabels.successReport"),
    knowledge_article: t("overview.kindLabels.knowledgeArticle"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {/* ── 1. Notifications ── top, spans 2 cols on sm+ */}
        <div className="sm:col-span-2 h-full">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>{t("overview.notifications.title")}</CardTitle>
                  {data.unreadNotifications > 0 && (
                    <Badge variant="secondary">{data.unreadNotifications}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MarkAllReadButton
                    unreadCount={data.unreadNotifications}
                    label={t("overview.notifications.markAllRead")}
                  />
                  <TrackedCardLink
                    href={`/${locale}/dashboard/notifications`}
                    card="unread-notifications"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    {t("overview.notifications.viewAll")}
                  </TrackedCardLink>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("overview.notifications.empty")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.recentNotifications.map((n: RecentNotification) => (
                    <li key={n.id} className="flex items-start gap-3">
                      {!n.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className={cn("min-w-0 flex-1", n.read && "pl-5")}>
                        {n.link ? (
                          <Link
                            href={n.link}
                            className="text-sm font-medium hover:underline"
                          >
                            {n.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">{n.title}</p>
                        )}
                        {n.body && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(n.createdAt, locale, "short")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 2. Pending Review ── */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("overview.pendingReview.title")}</CardTitle>
              {data.pendingReview.count > 0 && (
                <Badge variant="secondary">{data.pendingReview.count}</Badge>
              )}
            </div>
            <CardDescription>
              {t("overview.pendingReview.itemCount", {
                count: data.pendingReview.count,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.pendingReview.count === 0 ? (
              <EmptyState
                state="both"
                message={t("overview.pendingReview.empty")}
                className="py-6"
              />
            ) : (
              <ul className="space-y-3">
                {data.pendingReview.recent.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                        >
                          {kindLabel[item.kind]}
                        </Badge>
                        <span className="truncate text-sm">{item.title}</span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── 3. Drafts ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("overview.drafts.title")}</CardTitle>
              {data.drafts.count > 0 && (
                <Badge variant="secondary">{data.drafts.count}</Badge>
              )}
            </div>
            <CardDescription>
              {t("overview.drafts.itemCount", { count: data.drafts.count })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.drafts.count === 0 ? (
              <EmptyState
                state="both"
                message={t("overview.drafts.empty")}
                action={
                  <Link
                    href={`/${locale}/submit`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    {t("overview.drafts.startDraft")}
                  </Link>
                }
                className="py-6"
              />
            ) : (
              <ul className="space-y-3">
                {data.drafts.recent.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                        >
                          {kindLabel[item.kind]}
                        </Badge>
                        <span className="truncate text-sm">{item.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(item.updatedAt, locale, "short")}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-transparent bg-muted text-muted-foreground"
                    >
                      {t("overview.drafts.draftLabel")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── 4. Organizations ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("overview.organizations.title")}</CardTitle>
              <TrackedCardLink
                href={`/${locale}/dashboard/organizations`}
                card="recent-orgs"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {t("overview.organizations.viewAll")}
              </TrackedCardLink>
            </div>
          </CardHeader>
          <CardContent>
            {data.organizations.length === 0 ? (
              <EmptyState
                state="corporate"
                message={t("overview.organizations.empty")}
                action={
                  <Link
                    href={`/${locale}/dashboard/organizations/join`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    {t("overview.organizations.joinOrCreate")}
                  </Link>
                }
                className="py-6"
              />
            ) : (
              <ul className="space-y-2">
                {data.organizations.map((org) => (
                  <li key={org.id}>
                    <TrackedCardLink
                      href={`/${locale}/dashboard/organizations/${org.id}`}
                      card="recent-orgs"
                      className="-mx-1 flex items-center gap-3 rounded-md p-1 transition-colors hover:bg-muted/50"
                    >
                      {org.logoUrl ? (
                        <Image
                          src={org.logoUrl}
                          alt=""
                          width={28}
                          height={28}
                          className="h-7 w-7 shrink-0 rounded border object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {org.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        {org.verificationStatus === "verified" && (
                          <Badge
                            variant="outline"
                            className="border-green-200 bg-green-50 text-xs text-green-700"
                          >
                            {t("overview.organizations.verified")}
                          </Badge>
                        )}
                        {org.membershipStatus === "pending" && (
                          <Badge variant="outline" className="text-xs">
                            {t("overview.organizations.pendingMembership")}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {org.role}
                        </Badge>
                      </div>
                    </TrackedCardLink>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── 5. Recent Submissions ── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("overview.recentSubmissions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSubmissions.length === 0 ? (
              <EmptyState
                state="startup"
                message={t("overview.recentSubmissions.empty")}
                action={
                  <Link
                    href={`/${locale}/submit`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                    )}
                  >
                    {t("overview.quickActions.submitProblem")}
                  </Link>
                }
                className="py-6"
              />
            ) : (
              <ul className="space-y-3">
                {data.recentSubmissions.map((item) => (
                  <li
                    key={`${item.kind}-${item.id}`}
                    className="flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                        >
                          {kindLabel[item.kind]}
                        </Badge>
                        <span className="truncate text-sm">{item.title}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(item.createdAt, locale, "short")}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ── 6. Quick Actions ── always full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("overview.quickActions.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <TrackedCardLink
                  href={`/${locale}/submit`}
                  card="quick-action"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  {t("overview.quickActions.submitProblem")}
                </TrackedCardLink>
                <TrackedCardLink
                  href={`/${locale}/problems`}
                  card="quick-action"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  {t("overview.quickActions.proposeSolution")}
                </TrackedCardLink>
                <TrackedCardLink
                  href={`/${locale}/dashboard/organizations/new`}
                  card="quick-action"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  {t("overview.quickActions.createOrg")}
                </TrackedCardLink>
                <TrackedCardLink
                  href={`/${locale}/problems`}
                  card="quick-action"
                  className={cn(buttonVariants({ variant: "ghost" }))}
                >
                  {t("overview.quickActions.browseProblems")}
                </TrackedCardLink>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 7. Jump back in ── client-rendered, hides itself when empty */}
        <JumpBackInCard />

        {/* ── 8. Moderation ── only for moderator / admin */}
        {isModerator && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("overview.moderation.title")}</CardTitle>
                {totalModeration > 0 && (
                  <Badge variant="secondary">{totalModeration}</Badge>
                )}
              </div>
              <CardDescription>
                {t("overview.moderation.pendingCount", {
                  count: totalModeration,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrackedCardLink
                href={`/${locale}/moderate`}
                card="moderator-queue-summary"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {t("overview.moderation.viewQueues")}
              </TrackedCardLink>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
