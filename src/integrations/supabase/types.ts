export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      interview_rounds: {
        Row: {
          created_at: string
          id: string
          job_id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["round_outcome"] | null
          questions: Json | null
          round_date: string | null
          round_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["round_outcome"] | null
          questions?: Json | null
          round_date?: string | null
          round_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["round_outcome"] | null
          questions?: Json | null
          round_date?: string | null
          round_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_rounds_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applied_at: string | null
          company: string
          created_at: string
          follow_up_at: string | null
          id: string
          jd_text: string | null
          notes: string | null
          saved_at: string | null
          stage: Database["public"]["Enums"]["job_stage"]
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          created_at?: string
          follow_up_at?: string | null
          id?: string
          jd_text?: string | null
          notes?: string | null
          saved_at?: string | null
          stage?: Database["public"]["Enums"]["job_stage"]
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          created_at?: string
          follow_up_at?: string | null
          id?: string
          jd_text?: string | null
          notes?: string | null
          saved_at?: string | null
          stage?: Database["public"]["Enums"]["job_stage"]
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      practice_events: {
        Row: {
          audio_url: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          feedback: Json | null
          id: string
          question_text: string | null
          rubric: Json | null
          session_id: string
          transcript_text: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          feedback?: Json | null
          id?: string
          question_text?: string | null
          rubric?: Json | null
          session_id: string
          transcript_text?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          feedback?: Json | null
          id?: string
          question_text?: string | null
          rubric?: Json | null
          session_id?: string
          transcript_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          created_at: string
          difficulty: Database["public"]["Enums"]["practice_difficulty"]
          duration_minutes: number | null
          id: string
          job_id: string | null
          mode: Database["public"]["Enums"]["practice_mode"]
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["practice_difficulty"]
          duration_minutes?: number | null
          id?: string
          job_id?: string | null
          mode?: Database["public"]["Enums"]["practice_mode"]
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: Database["public"]["Enums"]["practice_difficulty"]
          duration_minutes?: number | null
          id?: string
          job_id?: string | null
          mode?: Database["public"]["Enums"]["practice_mode"]
          status?: Database["public"]["Enums"]["session_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          links: Json | null
          location: string | null
          preferences: Json | null
          projects: Json | null
          seniority: string | null
          skills: Json | null
          target_roles: string[] | null
          updated_at: string
          user_id: string
          work_history: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          links?: Json | null
          location?: string | null
          preferences?: Json | null
          projects?: Json | null
          seniority?: string | null
          skills?: Json | null
          target_roles?: string[] | null
          updated_at?: string
          user_id: string
          work_history?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          links?: Json | null
          location?: string | null
          preferences?: Json | null
          projects?: Json | null
          seniority?: string | null
          skills?: Json | null
          target_roles?: string[] | null
          updated_at?: string
          user_id?: string
          work_history?: Json | null
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          ats_report: Json | null
          ats_score: number | null
          content: Json | null
          created_at: string
          id: string
          job_id: string | null
          name: string
          user_id: string
        }
        Insert: {
          ats_report?: Json | null
          ats_score?: number | null
          content?: Json | null
          created_at?: string
          id?: string
          job_id?: string | null
          name: string
          user_id: string
        }
        Update: {
          ats_report?: Json | null
          ats_score?: number | null
          content?: Json | null
          created_at?: string
          id?: string
          job_id?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          action: string | null
          created_at: string
          id: string
          metrics: Json | null
          result: string | null
          situation: string | null
          tags: Json | null
          task: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          id?: string
          metrics?: Json | null
          result?: string | null
          situation?: string | null
          tags?: Json | null
          task?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          metrics?: Json | null
          result?: string | null
          situation?: string | null
          tags?: Json | null
          task?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      event_type:
        | "question_asked"
        | "user_response"
        | "ai_feedback"
        | "session_start"
        | "session_end"
      job_stage:
        | "saved"
        | "applied"
        | "screening"
        | "phone_screen"
        | "technical"
        | "onsite"
        | "final"
        | "offer"
        | "accepted"
        | "rejected"
        | "withdrawn"
      practice_difficulty: "easy" | "medium" | "hard"
      practice_mode:
        | "behavioral"
        | "technical"
        | "case_study"
        | "mixed"
        | "custom"
      round_outcome:
        | "pending"
        | "passed"
        | "failed"
        | "cancelled"
        | "rescheduled"
      session_status: "in_progress" | "completed" | "abandoned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_type: [
        "question_asked",
        "user_response",
        "ai_feedback",
        "session_start",
        "session_end",
      ],
      job_stage: [
        "saved",
        "applied",
        "screening",
        "phone_screen",
        "technical",
        "onsite",
        "final",
        "offer",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      practice_difficulty: ["easy", "medium", "hard"],
      practice_mode: [
        "behavioral",
        "technical",
        "case_study",
        "mixed",
        "custom",
      ],
      round_outcome: [
        "pending",
        "passed",
        "failed",
        "cancelled",
        "rescheduled",
      ],
      session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
