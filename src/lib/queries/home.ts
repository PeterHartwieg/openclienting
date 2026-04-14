import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export const getHomePageStats = unstable_cache(
  async () => {
    const supabase = createPublicClient();

    const [
      { count: successfulPilotCount, error: successfulPilotError },
      { count: verifiedReportCount, error: verifiedReportError },
      { count: approachCount, error: approachError },
      { data: industryTagsData, error: industryTagsError },
    ] = await Promise.all([
      supabase
        .from("problem_templates")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .eq("solution_status", "successful_pilot"),
      supabase
        .from("success_reports")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "verified"),
      supabase
        .from("solution_approaches")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("tags").select("*").eq("category", "industry"),
    ]);

    if (successfulPilotError) throw successfulPilotError;
    if (verifiedReportError) throw verifiedReportError;
    if (approachError) throw approachError;
    if (industryTagsError) throw industryTagsError;

    return {
      successfulPilotCount: successfulPilotCount ?? 0,
      verifiedReportCount: verifiedReportCount ?? 0,
      approachCount: approachCount ?? 0,
      industryTagsData: industryTagsData ?? [],
    };
  },
  ["home:stats"],
  {
    revalidate: 300,
    tags: ["problem_templates", "success_reports", "solution_approaches", "tags"],
  },
);
