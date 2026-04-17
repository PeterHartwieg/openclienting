import { createClient } from "@/lib/supabase/server";

export interface ModerationEvent {
  id: string;
  action: string;
  decision: string | null;
  notes: string | null;
  before_status: string | null;
  after_status: string | null;
  created_at: string;
  reviewer_id: string;
}

// createClient() calls cookies() which cannot be used inside unstable_cache().
// Using a plain async function here is correct — moderation history is
// moderator-only and changes on every moderation action, so cross-request
// caching would also risk leaking stale state. Per-request React.cache
// deduplication is applied by the call sites.
export const getModerationHistoryFor = async (targetType: string, targetId: string): Promise<ModerationEvent[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moderation_event")
    .select("id, action, decision, notes, before_status, after_status, created_at, reviewer_id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModerationEvent[];
};
