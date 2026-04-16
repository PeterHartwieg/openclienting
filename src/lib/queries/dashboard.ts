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

export type DashboardOverview = {
  unreadNotifications: number;
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

function trunc(text: string | null | undefined, maxLen: number): string {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

const PENDING = ["submitted", "in_review"] as const;

// cache() so the layout (sidebar counts) and this page share one request if
// getDashboardOverview is called from multiple render paths in the same request.
export const getDashboardOverview = cache(
  async (userId: string): Promise<DashboardOverview> => {
    const supabase = await createClient();

    const [
      notifResult,
      probPending,
      reqPending,
      fwkPending,
      solPending,
      srPending,
      kaPending,
      probDraft,
      solDraft,
      orgsResult,
      probPublished,
      solPublished,
      srPublished,
      kaPublished,
    ] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false),

      supabase
        .from("problem_templates")
        .select("id, title, status, created_at", { count: "exact" })
        .eq("author_id", userId)
        .in("status", PENDING)
        .order("created_at", { ascending: false })
        .limit(3),

      supabase
        .from("requirements")
        .select("id, body, status, created_at", { count: "exact" })
        .eq("author_id", userId)
        .in("status", PENDING)
        .order("created_at", { ascending: false })
        .limit(3),

      supabase
        .from("pilot_frameworks")
        .select("id, scope, status, created_at", { count: "exact" })
        .eq("author_id", userId)
        .in("status", PENDING)
        .order("created_at", { ascending: false })
        .limit(3),

      supabase
        .from("solution_approaches")
        .select("id, title, status, created_at", { count: "exact" })
        .eq("author_id", userId)
        .in("status", PENDING)
        .order("created_at", { ascending: false })
        .limit(3),

      // success_reports.author_id was renamed to submitted_by_user_id in migration 014
      supabase
        .from("success_reports")
        .select("id, report_summary, status, created_at", { count: "exact" })
        .eq("submitted_by_user_id", userId)
        .in("status", PENDING)
        .order("created_at", { ascending: false })
        .limit(3),

      supabase
        .from("knowledge_articles")
        .select("id, title, status, created_at", { count: "exact" })
        .eq("author_id", userId)
        .in("status", PENDING)
        .order("created_at", { ascending: false })
        .limit(3),

      // Only problem_templates and solution_approaches support draft status
      supabase
        .from("problem_templates")
        .select("id, title, updated_at", { count: "exact" })
        .eq("author_id", userId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(3),

      supabase
        .from("solution_approaches")
        .select("id, title, updated_at", { count: "exact" })
        .eq("author_id", userId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(3),

      supabase
        .from("organization_memberships")
        .select(
          "id, role, membership_status, updated_at, organizations(id, name, slug, verification_status, logo_url)",
        )
        .eq("user_id", userId)
        .in("membership_status", ["active", "pending"])
        .order("updated_at", { ascending: false })
        .limit(3),

      supabase
        .from("problem_templates")
        .select("id, title, status, created_at")
        .eq("author_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("solution_approaches")
        .select("id, title, status, created_at")
        .eq("author_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("success_reports")
        .select("id, report_summary, status, created_at")
        .eq("submitted_by_user_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("knowledge_articles")
        .select("id, title, status, created_at")
        .eq("author_id", userId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const pendingCount =
      (probPending.count ?? 0) +
      (reqPending.count ?? 0) +
      (fwkPending.count ?? 0) +
      (solPending.count ?? 0) +
      (srPending.count ?? 0) +
      (kaPending.count ?? 0);

    const pendingRecent = [
      ...(probPending.data ?? []).map((r) => ({
        kind: "problem" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(reqPending.data ?? []).map((r) => ({
        kind: "requirement" as ContentKind,
        id: r.id as string,
        title: trunc(r.body as string, 60),
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(fwkPending.data ?? []).map((r) => ({
        kind: "framework" as ContentKind,
        id: r.id as string,
        title: trunc(r.scope as string | null, 60) || "Pilot Framework",
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(solPending.data ?? []).map((r) => ({
        kind: "solution" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(srPending.data ?? []).map((r) => ({
        kind: "success_report" as ContentKind,
        id: r.id as string,
        title: trunc(r.report_summary as string, 60),
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(kaPending.data ?? []).map((r) => ({
        kind: "knowledge_article" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);

    const draftsCount = (probDraft.count ?? 0) + (solDraft.count ?? 0);

    const draftRecent = [
      ...(probDraft.data ?? []).map((r) => ({
        kind: "problem" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        updatedAt: r.updated_at as string,
      })),
      ...(solDraft.data ?? []).map((r) => ({
        kind: "solution" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        updatedAt: r.updated_at as string,
      })),
    ]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3);

    const organizations = (orgsResult.data ?? [])
      .map((m) => {
        const org = m.organizations as unknown as {
          id: string;
          name: string;
          slug: string;
          verification_status: string;
          logo_url: string | null;
        } | null;
        return {
          id: org?.id ?? "",
          name: org?.name ?? "",
          slug: org?.slug ?? "",
          role: m.role as string,
          membershipStatus: m.membership_status as string,
          verificationStatus: org?.verification_status ?? "unverified",
          logoUrl: org?.logo_url ?? null,
        };
      })
      .filter((o) => o.id !== "");

    const recentSubmissions = [
      ...(probPublished.data ?? []).map((r) => ({
        kind: "problem" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(solPublished.data ?? []).map((r) => ({
        kind: "solution" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(srPublished.data ?? []).map((r) => ({
        kind: "success_report" as ContentKind,
        id: r.id as string,
        title: trunc(r.report_summary as string, 60),
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
      ...(kaPublished.data ?? []).map((r) => ({
        kind: "knowledge_article" as ContentKind,
        id: r.id as string,
        title: r.title as string,
        status: r.status as string,
        createdAt: r.created_at as string,
      })),
    ]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    return {
      unreadNotifications: notifResult.count ?? 0,
      pendingReview: { count: pendingCount, recent: pendingRecent },
      drafts: { count: draftsCount, recent: draftRecent },
      organizations,
      recentSubmissions,
    };
  },
);
