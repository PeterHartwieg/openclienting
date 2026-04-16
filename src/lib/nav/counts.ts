import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceCounts } from "./config";

/**
 * Fetch the workspace nav badge counts for the current user.
 * Cheap head-count queries — RLS guarantees user isolation.
 */
export async function getWorkspaceCounts(userId: string): Promise<WorkspaceCounts> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) {
    return { unreadNotifications: 0 };
  }

  return {
    unreadNotifications: count ?? 0,
  };
}
