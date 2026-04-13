import Link from "next/link";
import { redirect } from "next/navigation";
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

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/dashboard/settings`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Settings
          </Link>
          <Link
            href={`/${locale}/submit`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Submit Problem
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">
            Notifications ({notifications.filter((n) => !n.read).length} unread)
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
                    {new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Your Submissions</h2>

        {!submissions || submissions.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t submitted any problems yet.
            </p>
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
                      Submitted{" "}
                      {new Date(sub.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">Your Solution Approaches</h2>

        {!solutionApproaches || solutionApproaches.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              You haven&apos;t proposed any solution approaches yet.
            </p>
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
                      Submitted{" "}
                      {new Date(sa.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
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
