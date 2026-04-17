import { unstable_cache } from "next/cache";
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

export const getModerationHistoryFor = (targetType: string, targetId: string) =>
  unstable_cache(
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("moderation_event")
        .select("id, action, decision, notes, before_status, after_status, created_at, reviewer_id")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ModerationEvent[];
    },
    ["moderation-history", targetType, targetId],
    { revalidate: 3600, tags: ["moderation_events"] },
  )();
