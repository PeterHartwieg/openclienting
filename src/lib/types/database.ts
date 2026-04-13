export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ContentStatus = "submitted" | "in_review" | "published" | "rejected";
export type ProblemStatus = "draft" | ContentStatus;
export type UserRole = "contributor" | "moderator" | "admin";
export type TagCategory = "industry" | "function" | "problem_category" | "company_size" | "technology";
export type TechnologyType = "software" | "hardware" | "platform" | "service";
export type Maturity = "emerging" | "growing" | "established";
export type SolutionStatus = "unsolved" | "has_approaches" | "successful_pilot";
export type EditTargetType = "problem_template" | "requirement" | "pilot_framework" | "solution_approach";
export type EditDiff = Record<string, { old: string | null; new: string | null }>;
export type NotificationType = "status_change" | "suggested_edit" | "comment_reply";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: TagCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category: TagCategory;
          created_at?: string;
        };
        Update: {
          name?: string;
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
          anonymous: boolean;
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
          anonymous?: boolean;
          status?: ProblemStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          anonymous?: boolean;
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
          anonymous: boolean;
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
          anonymous?: boolean;
          status?: ContentStatus;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          anonymous?: boolean;
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
          anonymous: boolean;
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
          anonymous?: boolean;
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
          anonymous?: boolean;
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
          anonymous: boolean;
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
          anonymous?: boolean;
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
          anonymous?: boolean;
          status?: ProblemStatus;
          upvote_count?: number;
          updated_at?: string;
        };
      };
      success_reports: {
        Row: {
          id: string;
          solution_approach_id: string;
          body: string;
          author_id: string;
          anonymous: boolean;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          solution_approach_id: string;
          body: string;
          author_id: string;
          anonymous?: boolean;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          anonymous?: boolean;
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
      notification_preferences: {
        Row: {
          user_id: string;
          email_status_changes: boolean;
          email_suggested_edits: boolean;
          email_comment_replies: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_status_changes?: boolean;
          email_suggested_edits?: boolean;
          email_comment_replies?: boolean;
        };
        Update: {
          email_status_changes?: boolean;
          email_suggested_edits?: boolean;
          email_comment_replies?: boolean;
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
