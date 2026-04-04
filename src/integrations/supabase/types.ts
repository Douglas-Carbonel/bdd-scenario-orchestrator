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
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          api_key: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          api_key?: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          api_key?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          actual_duration: number | null
          assignee_id: string | null
          company_id: string
          created_at: string
          estimated_duration: number
          execution_type: string
          feature: string
          given_steps: Json
          id: string
          priority: Database["public"]["Enums"]["priority"]
          product_id: string | null
          sprint_id: string | null
          status: Database["public"]["Enums"]["scenario_status"]
          suite_id: string | null
          tags: Json
          then_steps: Json
          title: string
          updated_at: string
          when_steps: Json
        }
        Insert: {
          actual_duration?: number | null
          assignee_id?: string | null
          company_id: string
          created_at?: string
          estimated_duration?: number
          execution_type?: string
          feature: string
          given_steps?: Json
          id?: string
          priority?: Database["public"]["Enums"]["priority"]
          product_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["scenario_status"]
          suite_id?: string | null
          tags?: Json
          then_steps?: Json
          title: string
          updated_at?: string
          when_steps?: Json
        }
        Update: {
          actual_duration?: number | null
          assignee_id?: string | null
          company_id?: string
          created_at?: string
          estimated_duration?: number
          execution_type?: string
          feature?: string
          given_steps?: Json
          id?: string
          priority?: Database["public"]["Enums"]["priority"]
          product_id?: string | null
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["scenario_status"]
          suite_id?: string | null
          tags?: Json
          then_steps?: Json
          title?: string
          updated_at?: string
          when_steps?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          company_id: string
          created_at: string
          end_date: string
          id: string
          name: string
          product_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["sprint_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          name: string
          product_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["sprint_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          product_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["sprint_status"]
        }
        Relationships: [
          {
            foreignKeyName: "sprints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar: string | null
          company_id: string
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          avatar?: string | null
          company_id: string
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          avatar?: string | null
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration: number | null
          error_message: string | null
          evidence_urls: string[] | null
          executed_by: string
          id: string
          logs: Json | null
          scenario_id: string
          started_at: string
          status: Database["public"]["Enums"]["test_run_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          evidence_urls?: string[] | null
          executed_by: string
          id?: string
          logs?: Json | null
          scenario_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["test_run_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration?: number | null
          error_message?: string | null
          evidence_urls?: string[] | null
          executed_by?: string
          id?: string
          logs?: Json | null
          scenario_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["test_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      test_suites: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          order: number
          parent_id: string | null
          product_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          order?: number
          parent_id?: string | null
          product_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          order?: number
          parent_id?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_suites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_suites_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "test_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
      priority: "critical" | "high" | "medium" | "low"
      scenario_status: "draft" | "ready" | "running" | "passed" | "failed"
      sprint_status: "planned" | "active" | "completed"
      test_run_status: "running" | "passed" | "failed"
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
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected"],
      priority: ["critical", "high", "medium", "low"],
      scenario_status: ["draft", "ready", "running", "passed", "failed"],
      sprint_status: ["planned", "active", "completed"],
      test_run_status: ["running", "passed", "failed"],
    },
  },
} as const
