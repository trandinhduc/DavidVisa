export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          app_id: string
          arrival_date: string
          contact_address: string | null
          created_at: string
          email: string | null
          emergency_address: string | null
          emergency_name: string | null
          emergency_relationship: string | null
          emergency_telephone: string | null
          entry_gate: string | null
          entry_type: string | null
          exit_gate: string | null
          first_name: string | null
          id: string
          intended_date_of_entry: string | null
          intended_length_of_stay: string | null
          last_name: string | null
          passport_expiry_date: string | null
          passport_issue_date: string | null
          passport_path: string | null
          passport_type: string | null
          permanent_address: string | null
          place_of_birth: string | null
          portrait_path: string | null
          province_city: string | null
          purpose_of_entry: string | null
          registration_duration: number | null
          religion: string | null
          residential_address_in_vietnam: string | null
          status: string
          telephone: string | null
          updated_at: string
          visa_valid_from: string | null
          ward_commune: string | null
        }
        Insert: {
          app_id?: string
          arrival_date: string
          contact_address?: string | null
          created_at?: string
          email?: string | null
          emergency_address?: string | null
          emergency_name?: string | null
          emergency_relationship?: string | null
          emergency_telephone?: string | null
          entry_gate?: string | null
          entry_type?: string | null
          exit_gate?: string | null
          first_name?: string | null
          id?: string
          intended_date_of_entry?: string | null
          intended_length_of_stay?: string | null
          last_name?: string | null
          passport_expiry_date?: string | null
          passport_issue_date?: string | null
          passport_path?: string | null
          passport_type?: string | null
          permanent_address?: string | null
          place_of_birth?: string | null
          portrait_path?: string | null
          province_city?: string | null
          purpose_of_entry?: string | null
          registration_duration?: number | null
          religion?: string | null
          residential_address_in_vietnam?: string | null
          status?: string
          telephone?: string | null
          updated_at?: string
          visa_valid_from?: string | null
          ward_commune?: string | null
        }
        Update: {
          app_id?: string
          arrival_date?: string
          contact_address?: string | null
          created_at?: string
          email?: string | null
          emergency_address?: string | null
          emergency_name?: string | null
          emergency_relationship?: string | null
          emergency_telephone?: string | null
          entry_gate?: string | null
          entry_type?: string | null
          exit_gate?: string | null
          first_name?: string | null
          id?: string
          intended_date_of_entry?: string | null
          intended_length_of_stay?: string | null
          last_name?: string | null
          passport_expiry_date?: string | null
          passport_issue_date?: string | null
          passport_path?: string | null
          passport_type?: string | null
          permanent_address?: string | null
          place_of_birth?: string | null
          portrait_path?: string | null
          province_city?: string | null
          purpose_of_entry?: string | null
          registration_duration?: number | null
          religion?: string | null
          residential_address_in_vietnam?: string | null
          status?: string
          telephone?: string | null
          updated_at?: string
          visa_valid_from?: string | null
          ward_commune?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          application_id: string
          attempt: number
          channel: string
          created_at: string
          id: string
          status: string
          type: string
        }
        Insert: {
          application_id: string
          attempt?: number
          channel: string
          created_at?: string
          id?: string
          status: string
          type: string
        }
        Update: {
          application_id?: string
          attempt?: number
          channel?: string
          created_at?: string
          id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

