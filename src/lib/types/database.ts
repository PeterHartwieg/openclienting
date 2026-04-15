export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ContentStatus = "submitted" | "in_review" | "published" | "rejected";
export type ProblemStatus = "draft" | ContentStatus;
export type UserRole = "contributor" | "moderator" | "admin";
export type TagCategory = "industry" | "function" | "problem_category" | "company_size" | "technology";
export type TechnologyType = "software" | "hardware" | "platform" | "service";
export type Maturity = "emerging" | "growing" | "established";
export type SolutionStatus = "unsolved" | "has_approaches" | "successful_pilot";
export type EditTargetType =
  | "problem_template"
  | "requirement"
  | "pilot_framework"
  | "solution_approach"
  | "knowledge_article";

// Subset of EditTargetType that accepts open-source translations. Knowledge
// articles are excluded because they already store one row per (slug, locale)
// in the `knowledge_articles` table itself.
export type TranslationTargetType =
  | "problem_template"
  | "requirement"
  | "pilot_framework"
  | "solution_approach";

// { field_name: "translated value" }. Values are plain strings; the
// allowlist of fields per target_type lives in src/lib/content-translations/fields.ts.
export type TranslationFields = Record<string, string>;
// Diff shape for scalar-column targets (problem_template, requirement,
// pilot_framework, solution_approach). Values are plain strings; apply
// writes them straight back into text columns.
export type EditDiff = Record<string, { old: string | null; new: string | null }>;
// Diff shape for knowledge_article targets — values may be scalars or
// JSONB structures (tldr: string[], faq: {question,answer}[], etc.).
// Apply branches on target_type to pick the right writer.
export type KnowledgeArticleDiff = Record<string, { old: Json; new: Json }>;

export type KnowledgeArticleKind = "hub" | "spoke";
export interface KnowledgeArticleFaqItem {
  question: string;
  answer: string;
}
export interface KnowledgeArticleSection {
  title: string;
  body: string;
}
export type NotificationType =
  | "status_change"
  | "suggested_edit"
  | "comment_reply"
  | "verification_outcome"
  | "success_report_decision"
  | "revision_reverted";

// --- New trust-model types ---
export type OrganizationVerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type MembershipStatus = "pending" | "active" | "rejected" | "revoked";
export type MembershipRole = "member" | "admin";
export type VerificationTargetType = "organization" | "membership";
export type VerificationDecision = "approved" | "rejected";
export type SuccessReportVerificationStatus = "submitted" | "under_review" | "verified" | "rejected";
export type RevisionStatus = "pending_recheck" | "approved" | "reverted";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          name_de: string | null;
          slug: string;
          category: TagCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_de?: string | null;
          slug: string;
          category: TagCategory;
          created_at?: string;
        };
        Update: {
          name?: string;
          name_de?: string | null;
          slug?: string;
          category?: TagCategory;
        };
      };
      problem_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          author_id: string;
          is_publicly_anonymous: boolean;
          is_org_anonymous: boolean;
          author_organization_id: string | null;
          status: ProblemStatus;
          solution_status: SolutionStatus;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          author_id: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ProblemStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ProblemStatus;
          rejection_reason?: string | null;
          updated_at?: string;
        };
      };
      problem_tags: {
        Row: {
          problem_id: string;
          tag_id: string;
        };
        Insert: {
          problem_id: string;
          tag_id: string;
        };
        Update: {
          problem_id?: string;
          tag_id?: string;
        };
      };
      requirements: {
        Row: {
          id: string;
          problem_id: string;
          body: string;
          author_id: string;
          is_publicly_anonymous: boolean;
          is_org_anonymous: boolean;
          author_organization_id: string | null;
          status: ContentStatus;
          upvote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          body: string;
          author_id: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ContentStatus;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ContentStatus;
          upvote_count?: number;
          updated_at?: string;
        };
      };
      pilot_frameworks: {
        Row: {
          id: string;
          problem_id: string;
          scope: string | null;
          suggested_kpis: string | null;
          success_criteria: string | null;
          common_pitfalls: string | null;
          duration: string | null;
          resource_commitment: string | null;
          author_id: string;
          is_publicly_anonymous: boolean;
          is_org_anonymous: boolean;
          author_organization_id: string | null;
          status: ContentStatus;
          upvote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          scope?: string | null;
          suggested_kpis?: string | null;
          success_criteria?: string | null;
          common_pitfalls?: string | null;
          duration?: string | null;
          resource_commitment?: string | null;
          author_id: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ContentStatus;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          scope?: string | null;
          suggested_kpis?: string | null;
          success_criteria?: string | null;
          common_pitfalls?: string | null;
          duration?: string | null;
          resource_commitment?: string | null;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ContentStatus;
          upvote_count?: number;
          updated_at?: string;
        };
      };
      solution_approaches: {
        Row: {
          id: string;
          problem_id: string;
          title: string;
          description: string;
          technology_type: TechnologyType;
          maturity: Maturity;
          complexity: string | null;
          price_range: string | null;
          author_id: string;
          is_publicly_anonymous: boolean;
          is_org_anonymous: boolean;
          author_organization_id: string | null;
          status: ProblemStatus;
          upvote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          title: string;
          description: string;
          technology_type: TechnologyType;
          maturity: Maturity;
          complexity?: string | null;
          price_range?: string | null;
          author_id: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ProblemStatus;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          technology_type?: TechnologyType;
          maturity?: Maturity;
          complexity?: string | null;
          price_range?: string | null;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          status?: ProblemStatus;
          upvote_count?: number;
          updated_at?: string;
        };
      };
      success_reports: {
        Row: {
          id: string;
          solution_approach_id: string;
          report_summary: string;
          pilot_date_range: string | null;
          deployment_scope: string | null;
          kpi_summary: string | null;
          evidence_notes: string | null;
          optional_attachment_refs: Json;
          submitted_by_user_id: string;
          submitted_by_organization_id: string | null;
          is_publicly_anonymous: boolean;
          is_org_anonymous: boolean;
          status: ContentStatus;
          verification_status: SuccessReportVerificationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          solution_approach_id: string;
          report_summary: string;
          pilot_date_range?: string | null;
          deployment_scope?: string | null;
          kpi_summary?: string | null;
          evidence_notes?: string | null;
          optional_attachment_refs?: Json;
          submitted_by_user_id: string;
          submitted_by_organization_id?: string | null;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          status?: ContentStatus;
          verification_status?: SuccessReportVerificationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          report_summary?: string;
          pilot_date_range?: string | null;
          deployment_scope?: string | null;
          kpi_summary?: string | null;
          evidence_notes?: string | null;
          optional_attachment_refs?: Json;
          submitted_by_organization_id?: string | null;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          status?: ContentStatus;
          verification_status?: SuccessReportVerificationStatus;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          problem_id: string;
          body: string;
          author_id: string;
          is_publicly_anonymous: boolean;
          is_org_anonymous: boolean;
          author_organization_id: string | null;
          parent_comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          body: string;
          author_id: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
          parent_comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
          is_publicly_anonymous?: boolean;
          is_org_anonymous?: boolean;
          author_organization_id?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          target_type: string;
          target_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: string;
          target_id: string;
          created_at?: string;
        };
        Update: never;
      };
      knowledge_articles: {
        Row: {
          id: string;
          slug: string;
          locale: string;
          kind: KnowledgeArticleKind;
          title: string;
          short_label: string | null;
          lede: string;
          meta_title: string;
          meta_description: string;
          tldr_title: string | null;
          tldr: string[];
          detail_title: string | null;
          detail_intro: string | null;
          detail_bullets: string[];
          faq_title: string | null;
          faq: KnowledgeArticleFaqItem[];
          sections: KnowledgeArticleSection[];
          tags: string[];
          sort_order: number;
          status: ContentStatus;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          locale: string;
          kind: KnowledgeArticleKind;
          title: string;
          short_label?: string | null;
          lede: string;
          meta_title: string;
          meta_description: string;
          tldr_title?: string | null;
          tldr?: string[];
          detail_title?: string | null;
          detail_intro?: string | null;
          detail_bullets?: string[];
          faq_title?: string | null;
          faq?: KnowledgeArticleFaqItem[];
          sections?: KnowledgeArticleSection[];
          tags?: string[];
          sort_order?: number;
          status?: ContentStatus;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          locale?: string;
          kind?: KnowledgeArticleKind;
          title?: string;
          short_label?: string | null;
          lede?: string;
          meta_title?: string;
          meta_description?: string;
          tldr_title?: string | null;
          tldr?: string[];
          detail_title?: string | null;
          detail_intro?: string | null;
          detail_bullets?: string[];
          faq_title?: string | null;
          faq?: KnowledgeArticleFaqItem[];
          sections?: KnowledgeArticleSection[];
          tags?: string[];
          sort_order?: number;
          status?: ContentStatus;
          updated_at?: string;
        };
      };
      suggested_edits: {
        Row: {
          id: string;
          target_type: EditTargetType;
          target_id: string;
          diff: EditDiff;
          author_id: string;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_type: EditTargetType;
          target_id: string;
          diff: EditDiff;
          author_id: string;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ContentStatus;
          updated_at?: string;
        };
      };
      content_translations: {
        Row: {
          id: string;
          target_type: TranslationTargetType;
          target_id: string;
          language: string;
          fields: TranslationFields;
          source_version: string | null;
          status: ContentStatus;
          author_id: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          target_type: TranslationTargetType;
          target_id: string;
          language: string;
          fields: TranslationFields;
          source_version?: string | null;
          status?: ContentStatus;
          author_id: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          fields?: TranslationFields;
          status?: ContentStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
      };
      edit_history: {
        Row: {
          id: string;
          target_type: EditTargetType;
          target_id: string;
          author_id: string;
          diff: EditDiff;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: EditTargetType;
          target_id: string;
          author_id: string;
          diff: EditDiff;
          created_at?: string;
        };
        Update: never;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          website: string | null;
          logo_url: string | null;
          employee_count: number | null;
          verification_status: OrganizationVerificationStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          employee_count?: number | null;
          verification_status?: OrganizationVerificationStatus;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          website?: string | null;
          logo_url?: string | null;
          employee_count?: number | null;
          verification_status?: OrganizationVerificationStatus;
          updated_at?: string;
        };
      };
      organization_memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: MembershipRole;
          membership_status: MembershipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: MembershipRole;
          membership_status?: MembershipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: MembershipRole;
          membership_status?: MembershipStatus;
          updated_at?: string;
        };
      };
      verification_reviews: {
        Row: {
          id: string;
          target_type: VerificationTargetType;
          target_id: string;
          reviewer_id: string;
          decision: VerificationDecision;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: VerificationTargetType;
          target_id: string;
          reviewer_id: string;
          decision: VerificationDecision;
          notes?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      content_revisions: {
        Row: {
          id: string;
          target_type: EditTargetType;
          target_id: string;
          author_id: string;
          diff: EditDiff;
          snapshot: Json | null;
          revision_status: RevisionStatus;
          reviewer_id: string | null;
          reviewed_at: string | null;
          reviewer_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: EditTargetType;
          target_id: string;
          author_id: string;
          diff: EditDiff;
          snapshot?: Json | null;
          revision_status?: RevisionStatus;
          reviewer_id?: string | null;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
          created_at?: string;
        };
        Update: {
          revision_status?: RevisionStatus;
          reviewer_id?: string | null;
          reviewed_at?: string | null;
          reviewer_notes?: string | null;
        };
      };
      notification_preferences: {
        Row: {
          user_id: string;
          email_status_changes: boolean;
          email_suggested_edits: boolean;
          email_comment_replies: boolean;
          email_verification_outcomes: boolean;
          email_success_report_decisions: boolean;
          email_revision_reverted: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_status_changes?: boolean;
          email_suggested_edits?: boolean;
          email_comment_replies?: boolean;
          email_verification_outcomes?: boolean;
          email_success_report_decisions?: boolean;
          email_revision_reverted?: boolean;
        };
        Update: {
          email_status_changes?: boolean;
          email_suggested_edits?: boolean;
          email_comment_replies?: boolean;
          email_verification_outcomes?: boolean;
          email_success_report_decisions?: boolean;
          email_revision_reverted?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
      };
    };
  };
}
