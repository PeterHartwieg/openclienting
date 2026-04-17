import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ContentKind =
  | "problem"
  | "requirement"
  | "framework"
  | "solution"
  | "success_report"
  | "knowledge_article";

export type RecentNotification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type DashboardOverview = {
  unreadNotifications: number;
  recentNotifications: RecentNotification[];
  pendingReview: {
    count: number;
    recent: Array<{
      kind: ContentKind;
      id: string;
      title: string;
      status: string;
      createdAt: string;
    }>;
  };
  drafts: {
    count: number;
    recent: Array<{
      kind: ContentKind;
      id: string;
      title: string;
      updatedAt: string;
    }>;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    membershipStatus: string;
    verificationStatus: string;
    logoUrl: string | null;
  }>;
  recentSubmissions: Array<{
    kind: ContentKind;
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
};

// cache() so the layout (sidebar counts) and this page share one request if
// getDashboardOverview is called from multiple render paths in the same request.
export const getDashboardOverview = cache(
  async (userId: string): Promise<DashboardOverview> => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_dashboard_overview", {
      p_user: userId,
    });

    if (error) {
      throw new Error(`getDashboardOverview RPC failed: ${error.message}`);
    }

    return data as DashboardOverview;
  },
);
