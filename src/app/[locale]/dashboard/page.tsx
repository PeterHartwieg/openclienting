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
  const { data: submissions } = await supabase
    .from("problem_templates")
    .select("id, title, status, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link
          href={`/${locale}/submit`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Submit Problem
        </Link>
      </div>

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
    </div>
  );
}
