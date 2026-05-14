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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_name: string
          entity_type: string
          id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_name: string
          entity_type: string
          id?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_name?: string
          entity_type?: string
          id?: string
          performed_by?: string | null
        }
        Relationships: []
      }
      business_staff: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          discord_avatar: string | null
          discord_display_name: string | null
          discord_id: string
          discord_username: string
          id: string
          notes: string
          synced_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          discord_avatar?: string | null
          discord_display_name?: string | null
          discord_id: string
          discord_username: string
          id?: string
          notes?: string
          synced_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          discord_avatar?: string | null
          discord_display_name?: string | null
          discord_id?: string
          discord_username?: string
          id?: string
          notes?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          discord_role_id: string | null
          id: string
          image_url: string | null
          name: string
          pole: Database["public"]["Enums"]["pole_type"]
          sort_order: number
        }
        Insert: {
          created_at?: string
          discord_role_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          pole: Database["public"]["Enums"]["pole_type"]
          sort_order?: number
        }
        Update: {
          created_at?: string
          discord_role_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          pole?: Database["public"]["Enums"]["pole_type"]
          sort_order?: number
        }
        Relationships: []
      }
      discord_members: {
        Row: {
          active: boolean
          created_at: string
          discord_avatar: string | null
          discord_display_name: string | null
          discord_id: string
          discord_username: string
          id: string
          notes: string
          role: string
          synced_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discord_avatar?: string | null
          discord_display_name?: string | null
          discord_id: string
          discord_username: string
          id?: string
          notes?: string
          role: string
          synced_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discord_avatar?: string | null
          discord_display_name?: string | null
          discord_id?: string
          discord_username?: string
          id?: string
          notes?: string
          role?: string
          synced_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      map_zones: {
        Row: {
          color: string
          created_at: string
          geometry: Json
          id: string
          name: string
          shape_type: string
        }
        Insert: {
          color?: string
          created_at?: string
          geometry: Json
          id?: string
          name: string
          shape_type?: string
        }
        Update: {
          color?: string
          created_at?: string
          geometry?: Json
          id?: string
          name?: string
          shape_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          discord_avatar: string | null
          discord_id: string
          discord_username: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_avatar?: string | null
          discord_id: string
          discord_username: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_avatar?: string | null
          discord_id?: string
          discord_username?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          balance_after: number
          balance_before: number
          business_id: string
          business_name: string
          created_at: string
          created_by: string | null
          hours_co_patron: number
          hours_em: Json | null
          hours_patron: number
          id: string
          notes: string | null
          staff_count: number
          status: string
          week_start: string
        }
        Insert: {
          balance_after?: number
          balance_before?: number
          business_id: string
          business_name: string
          created_at?: string
          created_by?: string | null
          hours_co_patron?: number
          hours_em?: Json | null
          hours_patron?: number
          id?: string
          notes?: string | null
          staff_count?: number
          status?: string
          week_start: string
        }
        Update: {
          balance_after?: number
          balance_before?: number
          business_id?: string
          business_name?: string
          created_at?: string
          created_by?: string | null
          hours_co_patron?: number
          hours_em?: Json | null
          hours_patron?: number
          id?: string
          notes?: string | null
          staff_count?: number
          status?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      soiree_checks: {
        Row: {
          business_id: string
          created_at: string
          day_index: number
          id: string
          note: string
          status: number
          week_start: string
        }
        Insert: {
          business_id: string
          created_at?: string
          day_index: number
          id?: string
          note?: string
          status?: number
          week_start: string
        }
        Update: {
          business_id?: string
          created_at?: string
          day_index?: number
          id?: string
          note?: string
          status?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "soiree_checks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      soiree_notes: {
        Row: {
          business_id: string
          created_at: string
          id: string
          note: string
          week_start: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          note?: string
          week_start: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          note?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "soiree_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_poles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pole_to_role: {
        Args: { p: Database["public"]["Enums"]["pole_type"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "restauration"
        | "production"
        | "utilitaire"
        | "justice"
        | "evenementiel"
        | "ems"
        | "police"
      pole_type:
        | "Restauration"
        | "Production"
        | "Utilitaire"
        | "Justice"
        | "Évènementiel"
        | "EMS"
        | "Police"
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
      app_role: [
        "admin",
        "restauration",
        "production",
        "utilitaire",
        "justice",
        "evenementiel",
        "ems",
        "police",
      ],
      pole_type: [
        "Restauration",
        "Production",
        "Utilitaire",
        "Justice",
        "Évènementiel",
        "EMS",
        "Police",
      ],
    },
  },
} as const
