export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ContentStatus = "submitted" | "in_review" | "published" | "rejected";
export type ProblemStatus = "draft" | ContentStatus;
export type UserRole = "contributor" | "moderator" | "admin";
export type TagCategory = "industry" | "function" | "problem_category" | "company_size" | "technology";

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
    };
  };
}
