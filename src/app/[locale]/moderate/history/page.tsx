import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EditHistoryPage({
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
  const { data: edits } = await supabase
    .from("edit_history")
    .select("id, target_type, target_id, diff, created_at, profiles!edit_history_author_id_fkey(display_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Edit History</h1>
      <p className="mt-2 text-muted-foreground">
        Audit log of author edits on published content.
      </p>

      <div className="mt-8 space-y-3">
        {(!edits || edits.length === 0) ? (
          <p className="text-muted-foreground">No edits recorded yet.</p>
        ) : (
          edits.map((edit) => {
            const diff = edit.diff as Record<string, { old: string | null; new: string | null }>;
            return (
              <Card key={edit.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{edit.target_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      by {(edit.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unknown"} ·{" "}
                      {new Date(edit.created_at).toLocaleString()}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-mono text-muted-foreground">
                    {edit.target_id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(diff).map(([field, values]) => (
                      <div key={field} className="rounded border p-2 text-sm">
                        <p className="font-medium">{field}</p>
                        <div className="mt-1 grid gap-1 sm:grid-cols-2">
                          <div className="rounded bg-red-500/10 p-1.5 text-xs">
                            <span className="font-medium text-red-600 dark:text-red-400">Old: </span>
                            {values.old ?? "(empty)"}
                          </div>
                          <div className="rounded bg-green-500/10 p-1.5 text-xs">
                            <span className="font-medium text-green-600 dark:text-green-400">New: </span>
                            {values.new ?? "(empty)"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
