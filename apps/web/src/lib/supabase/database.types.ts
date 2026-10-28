import type { ApplicationStage } from "@/lib/application-domain";

export type Database = {
  public: {
    Tables: {
      job_applications: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          role: string;
          stage: ApplicationStage;
          job_url: string | null;
          applied_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          company: string;
          role: string;
          stage?: ApplicationStage;
          job_url?: string | null;
          applied_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          company?: string;
          role?: string;
          stage?: ApplicationStage;
          job_url?: string | null;
          applied_at?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      saved_resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          resume_text: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          resume_text: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          title?: string;
          resume_text?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type JobApplicationRow =
  Database["public"]["Tables"]["job_applications"]["Row"];

export type SavedResumeRow =
  Database["public"]["Tables"]["saved_resumes"]["Row"];
