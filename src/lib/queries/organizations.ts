import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function getUserOrganizations(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      role,
      membership_status,
      organizations (
        id,
        name,
        slug,
        website,
        description,
        logo_url,
        employee_count,
        verification_status,
        created_by
      )
    `)
    .eq("user_id", userId)
    .in("membership_status", ["pending", "active"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOrganizationWithMembers(organizationId: string) {
  const supabase = await createClient();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();

  if (orgError) throw orgError;

  const { data: members, error: memError } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      user_id,
      role,
      membership_status,
      created_at,
      profiles (display_name)
    `)
    .eq("organization_id", organizationId)
    .in("membership_status", ["pending", "active"])
    .order("created_at", { ascending: true });

  if (memError) throw memError;

  return { org, members: members ?? [] };
}

// Orgs awaiting moderator verification, with creator display name + email.
// Email lives in the private profile_contacts table (migration 026) and is
// only readable by moderators via RLS, so we fetch it in a second round
// trip keyed by creator id rather than joining under the public profiles
// relationship.
export async function getPendingVerifications() {
  const supabase = await createClient();

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      website,
      description,
      verification_status,
      created_at,
      created_by,
      profiles (display_name)
    `)
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPendingVerifications error:", error);
    return [];
  }

  const rows = orgs ?? [];
  const creatorIds = Array.from(
    new Set(
      rows
        .map((o) => (o as { created_by?: string | null }).created_by)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const emailsById = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: contacts, error: contactsError } = await supabase
      .from("profile_contacts")
      .select("user_id, email")
      .in("user_id", creatorIds);

    if (contactsError) {
      console.error("getPendingVerifications contacts error:", contactsError);
    } else {
      for (const c of contacts ?? []) {
        emailsById.set(c.user_id, c.email);
      }
    }
  }

  return rows.map((org) => {
    const createdBy = (org as { created_by?: string | null }).created_by ?? null;
    return {
      ...org,
      creator_email: createdBy ? emailsById.get(createdBy) ?? null : null,
    };
  });
}

export async function getPendingMemberships() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      user_id,
      role,
      membership_status,
      created_at,
      profiles (display_name),
      organizations (id, name, slug)
    `)
    .eq("membership_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPendingMemberships error:", error);
    return [];
  }
  return data ?? [];
}

export async function getVerifiedOrganizations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, website, description")
    .eq("verification_status", "verified")
    .order("name", { ascending: true });

  if (error) {
    console.error("getVerifiedOrganizations error:", error);
    return [];
  }
  return data ?? [];
}

// ============================================================
// Public directory + profile queries (Phase 6 — GEO)
// ============================================================
//
// These readers back the public `/{locale}/organizations` directory, the
// per-org profile page, and the Markdown alternative. They use the anon
// Supabase client (`createPublicClient`) so the wrappers stay outside
// Next.js' dynamic-function set and can be cached via `unstable_cache`.
// RLS still gates rows (`verification_status = 'verified'`), but we also
// filter explicitly on the column as defense-in-depth: the cache must
// never contain unverified orgs even if RLS changes later.
//
// Anonymity: when aggregating contributed content for a profile we apply
// the per-row `is_org_anonymous` flag — an org may have some submissions
// attributed to it and others hidden by contributor choice. Hidden rows
// are filtered server-side so they never reach the profile builder.

export interface VerifiedOrganizationDirectoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  employee_count: number | null;
  updated_at: string | null;
}

export const getVerifiedOrganizationsDirectory = unstable_cache(
  async (): Promise<VerifiedOrganizationDirectoryRow[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id, slug, name, description, website, logo_url, employee_count, updated_at",
      )
      .eq("verification_status", "verified")
      .order("name", { ascending: true });

    if (error) {
      console.error("getVerifiedOrganizationsDirectory error:", error);
      return [];
    }
    return data ?? [];
  },
  ["organizations:verified-directory"],
  { revalidate: 3600, tags: ["organizations"] },
);

export interface OrganizationProfile {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  employee_count: number | null;
  verification_status: string;
  created_at: string;
  updated_at: string | null;
}

export const getVerifiedOrganizationBySlug = unstable_cache(
  async (slug: string): Promise<OrganizationProfile | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("organizations")
      .select(
        "id, slug, name, description, website, logo_url, employee_count, verification_status, created_at, updated_at",
      )
      .eq("slug", slug)
      .eq("verification_status", "verified")
      .maybeSingle();

    if (error) return null;
    return data;
  },
  ["organizations:profile"],
  { revalidate: 3600, tags: ["organizations"] },
);

export interface OrgContributedProblem {
  id: string;
  title: string;
  description: string;
  solution_status: string | null;
  updated_at: string | null;
  created_at: string;
}

export interface OrgContributedSolutionApproach {
  id: string;
  title: string;
  description: string;
  technology_type: string | null;
  maturity: string | null;
  upvote_count: number;
  created_at: string;
  problem_id: string;
  problem_title: string;
}

export interface OrgContributedSuccessReport {
  id: string;
  report_summary: string;
  verification_status: string | null;
  created_at: string;
  solution_approach_id: string;
  solution_approach_title: string;
  problem_id: string;
  problem_title: string;
}

export interface OrganizationContributions {
  problems: OrgContributedProblem[];
  solutionApproaches: OrgContributedSolutionApproach[];
  verifiedSuccessReports: OrgContributedSuccessReport[];
}

/**
 * Aggregate published, non-anonymous content attributed to one organization
 * id. Used by the public profile page and the Markdown alternative.
 *
 * Every query filters on BOTH `status = 'published'` AND
 * `is_org_anonymous = false` so hidden attribution never leaks. A contributor
 * who submitted the same solution under both named and anonymous identities
 * will show only the named row here — exactly the behavior the HTML problem
 * page already follows.
 *
 * Success reports use `submitted_by_organization_id` (pilot client), which is
 * a separate column from `author_organization_id`. This matches the data
 * model: an org can be the pilot *client* of a solution they did not build.
 */
export const getOrganizationContributions = unstable_cache(
  async (orgId: string): Promise<OrganizationContributions> => {
    const supabase = createPublicClient();

    const [problemsRes, approachesRes, reportsRes] = await Promise.all([
      supabase
        .from("problem_templates")
        .select(
          "id, title, description, solution_status, updated_at, created_at",
        )
        .eq("author_organization_id", orgId)
        .eq("is_org_anonymous", false)
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      supabase
        .from("solution_approaches")
        .select(
          "id, title, description, technology_type, maturity, upvote_count, created_at, problem_id, problem_templates!inner(id, title, status)",
        )
        .eq("author_organization_id", orgId)
        .eq("is_org_anonymous", false)
        .eq("status", "published")
        .eq("problem_templates.status", "published")
        .order("upvote_count", { ascending: false }),
      supabase
        .from("success_reports")
        .select(
          "id, report_summary, verification_status, created_at, solution_approach_id, solution_approaches!inner(id, title, problem_id, status, problem_templates!inner(id, title, status))",
        )
        .eq("submitted_by_organization_id", orgId)
        .eq("is_org_anonymous", false)
        .eq("status", "published")
        .eq("verification_status", "verified")
        .eq("solution_approaches.status", "published")
        .eq("solution_approaches.problem_templates.status", "published")
        .order("created_at", { ascending: false }),
    ]);

    if (problemsRes.error) {
      console.error("getOrganizationContributions problems:", problemsRes.error);
    }
    if (approachesRes.error) {
      console.error(
        "getOrganizationContributions approaches:",
        approachesRes.error,
      );
    }
    if (reportsRes.error) {
      console.error(
        "getOrganizationContributions reports:",
        reportsRes.error,
      );
    }

    const approachRows = (approachesRes.data ?? []) as Array<{
      id: string;
      title: string;
      description: string;
      technology_type: string | null;
      maturity: string | null;
      upvote_count: number;
      created_at: string;
      problem_id: string;
      problem_templates: { id: string; title: string } | { id: string; title: string }[] | null;
    }>;

    const reportRows = (reportsRes.data ?? []) as Array<{
      id: string;
      report_summary: string;
      verification_status: string | null;
      created_at: string;
      solution_approach_id: string;
      solution_approaches:
        | {
            id: string;
            title: string;
            problem_id: string;
            problem_templates: { id: string; title: string } | { id: string; title: string }[] | null;
          }
        | Array<{
            id: string;
            title: string;
            problem_id: string;
            problem_templates: { id: string; title: string } | { id: string; title: string }[] | null;
          }>
        | null;
    }>;

    // PostgREST join shape can surface as either an object or an array of
    // objects depending on relationship cardinality inference. Normalize to
    // a single object so downstream consumers have one shape to reason about.
    const firstOrObj = <T>(x: T | T[] | null | undefined): T | null => {
      if (!x) return null;
      return Array.isArray(x) ? x[0] ?? null : x;
    };

    return {
      problems: problemsRes.data ?? [],
      solutionApproaches: approachRows
        .map((row) => {
          const pt = firstOrObj(row.problem_templates);
          if (!pt) return null;
          return {
            id: row.id,
            title: row.title,
            description: row.description,
            technology_type: row.technology_type,
            maturity: row.maturity,
            upvote_count: row.upvote_count,
            created_at: row.created_at,
            problem_id: row.problem_id,
            problem_title: pt.title,
          } satisfies OrgContributedSolutionApproach;
        })
        .filter((x): x is OrgContributedSolutionApproach => x !== null),
      verifiedSuccessReports: reportRows
        .map((row) => {
          const sa = firstOrObj(row.solution_approaches);
          if (!sa) return null;
          const pt = firstOrObj(sa.problem_templates);
          if (!pt) return null;
          return {
            id: row.id,
            report_summary: row.report_summary,
            verification_status: row.verification_status,
            created_at: row.created_at,
            solution_approach_id: sa.id,
            solution_approach_title: sa.title,
            problem_id: sa.problem_id,
            problem_title: pt.title,
          } satisfies OrgContributedSuccessReport;
        })
        .filter((x): x is OrgContributedSuccessReport => x !== null),
    };
  },
  ["organizations:contributions"],
  {
    revalidate: 3600,
    tags: [
      "organizations",
      "problem_templates",
      "solution_approaches",
      "success_reports",
    ],
  },
);

// Returns orgs where the current user has active membership AND the org is verified.
// Used to gate success report submission.
export async function getUserVerifiedMemberships(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_memberships")
    .select(`
      id,
      role,
      organizations!inner (
        id,
        name
      )
    `)
    .eq("user_id", userId)
    .eq("membership_status", "active")
    .eq("organizations.verification_status", "verified");

  if (error) {
    console.error("getUserVerifiedMemberships error:", error);
    return [];
  }

  return (data ?? []).map((m) => {
    const org = m.organizations as unknown as { id: string; name: string };
    return { membershipId: m.id, role: m.role, orgId: org.id, orgName: org.name };
  });
}
