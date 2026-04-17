import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

// ---------------------------------------------------------------------------
// Shape returned by the loader — built from actual success_reports columns.
// Reporter identity (submitted_by_user_id) is intentionally excluded.
// ---------------------------------------------------------------------------
export interface FeaturedStory {
  /** featured_success_report.id — used to identify the feature row */
  id: string;
  /** The underlying success report id (for linking to the detail page) */
  success_report_id: string;
  locale: string;
  display_order: number;
  /** The solution_approach_id this report belongs to */
  solution_approach_id: string;
  /** Narrative summary authored by the reporter */
  report_summary: string;
  pilot_date_range: string | null;
  deployment_scope: string | null;
  kpi_summary: string | null;
  evidence_notes: string | null;
  /**
   * Anonymity-resolved display label for the organization.
   * "anonymousOrg" sentinel when is_publicly_anonymous OR is_org_anonymous;
   * the caller renders the localized "Anonymous organization" string.
   */
  organization_display: string | "anonymousOrg";
  verification_status: string;
  /** true when the report was verified */
  is_verified: boolean;
}

// ---------------------------------------------------------------------------
// Internal row type coming back from Supabase
// ---------------------------------------------------------------------------
interface RawRow {
  id: string;
  success_report_id: string;
  locale: string;
  display_order: number;
  success_reports: {
    id: string;
    solution_approach_id: string;
    report_summary: string;
    pilot_date_range: string | null;
    deployment_scope: string | null;
    kpi_summary: string | null;
    evidence_notes: string | null;
    is_publicly_anonymous: boolean;
    is_org_anonymous: boolean;
    verification_status: string;
    organizations: { name: string } | null;
  } | null;
}

function mapRow(raw: RawRow | null): FeaturedStory | null {
  if (!raw || !raw.success_reports) return null;
  const sr = raw.success_reports;

  const isAnonymous = sr.is_publicly_anonymous || sr.is_org_anonymous;
  const organization_display: string =
    isAnonymous || !sr.organizations?.name
      ? "anonymousOrg"
      : sr.organizations.name;

  return {
    id: raw.id,
    success_report_id: raw.success_report_id,
    locale: raw.locale,
    display_order: raw.display_order,
    solution_approach_id: sr.solution_approach_id,
    report_summary: sr.report_summary,
    pilot_date_range: sr.pilot_date_range,
    deployment_scope: sr.deployment_scope,
    kpi_summary: sr.kpi_summary,
    evidence_notes: sr.evidence_notes,
    organization_display,
    verification_status: sr.verification_status,
    is_verified: sr.verification_status === "verified",
  };
}

// ---------------------------------------------------------------------------
// Select projection shared between locale-specific and any-locale fallback
// ---------------------------------------------------------------------------
const SELECT = `
  id, success_report_id, locale, display_order,
  success_reports!featured_success_report_success_report_id_fkey (
    id, solution_approach_id,
    report_summary, pilot_date_range, deployment_scope,
    kpi_summary, evidence_notes,
    is_publicly_anonymous, is_org_anonymous,
    verification_status,
    organizations!success_reports_submitted_by_organization_id_fkey (name)
  )
` as const;

// ---------------------------------------------------------------------------
// Public loader — one featured story per locale, with any-locale fallback.
// Cached for 1 hour; busted when a moderator calls featureSuccessReport or
// unfeatureSuccessReport (both call updateTag("featured_success_report")).
// Uses the public (anon-key) Supabase client so RLS applies without a user
// session — the fsr_public_read policy gates visibility to live rows only.
// ---------------------------------------------------------------------------
export const getFeaturedStory = (locale: string) =>
  unstable_cache(
    async (): Promise<FeaturedStory | null> => {
      const supabase = createPublicClient();

      // 1. Try locale-specific row first
      const { data: localeRow, error: localeError } = await supabase
        .from("featured_success_report")
        .select(SELECT)
        .eq("locale", locale)
        .is("unfeatured_at", null)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (localeError) throw localeError;
      if (localeRow) return mapRow(localeRow as unknown as RawRow);

      // 2. Fallback: any-locale (picks lowest display_order)
      const { data: anyRow, error: anyError } = await supabase
        .from("featured_success_report")
        .select(SELECT)
        .is("unfeatured_at", null)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (anyError) throw anyError;
      return mapRow(anyRow as unknown as RawRow);
    },
    ["featured-success-report", locale],
    { revalidate: 3600, tags: ["featured_success_report"] },
  )();
