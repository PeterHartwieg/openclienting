import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModerationActions } from "@/components/moderate/moderation-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ModerationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  try {
    await requireRole("moderator");
  } catch {
    redirect(`/${locale}`);
  }

  const supabase = await createClient();

  const [{ data: problems }, { data: requirements }, { data: frameworks }] =
    await Promise.all([
      supabase
        .from("problem_templates")
        .select("id, title, status, created_at, profiles!problem_templates_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("requirements")
        .select("id, body, status, created_at, problem_id, profiles!requirements_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
      supabase
        .from("pilot_frameworks")
        .select("id, scope, status, created_at, problem_id, profiles!pilot_frameworks_author_id_fkey(display_name)")
        .in("status", ["submitted", "in_review"])
        .order("created_at", { ascending: true }),
    ]);

  const problemCount = problems?.length ?? 0;
  const reqCount = requirements?.length ?? 0;
  const fwCount = frameworks?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
        <Link
          href={`/${locale}/moderate/tags`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Manage Tags
        </Link>
      </div>

      <Tabs defaultValue="problems" className="mt-8">
        <TabsList>
          <TabsTrigger value="problems">
            Problems ({problemCount})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements ({reqCount})
          </TabsTrigger>
          <TabsTrigger value="frameworks">
            Frameworks ({fwCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-4 space-y-3">
          {problemCount === 0 ? (
            <p className="text-muted-foreground">No pending problems.</p>
          ) : (
            problems!.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/${locale}/moderate/problems/${p.id}`}>
                      <CardTitle className="text-base hover:underline">
                        {p.title}
                      </CardTitle>
                    </Link>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {(p.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="problem_templates"
                    targetId={p.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="requirements" className="mt-4 space-y-3">
          {reqCount === 0 ? (
            <p className="text-muted-foreground">No pending requirements.</p>
          ) : (
            requirements!.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {r.body.length > 100 ? r.body.slice(0, 100) + "..." : r.body}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    by {(r.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="requirements"
                    targetId={r.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="frameworks" className="mt-4 space-y-3">
          {fwCount === 0 ? (
            <p className="text-muted-foreground">No pending frameworks.</p>
          ) : (
            frameworks!.map((f) => (
              <Card key={f.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {f.scope
                      ? f.scope.length > 100
                        ? f.scope.slice(0, 100) + "..."
                        : f.scope
                      : "Pilot Framework"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    by {(f.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                    {new Date(f.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <ModerationActions
                    targetType="pilot_frameworks"
                    targetId={f.id}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
