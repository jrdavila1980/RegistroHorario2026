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
      absence_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          end_date: string
          hours: number | null
          id: string
          overtime_end_time: string | null
          overtime_start_time: string | null
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          end_date: string
          hours?: number | null
          id?: string
          overtime_end_time?: string | null
          overtime_start_time?: string | null
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          end_date?: string
          hours?: number | null
          id?: string
          overtime_end_time?: string | null
          overtime_start_time?: string | null
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      holiday_calendars: {
        Row: {
          created_at: string
          id: string
          name: string
          region: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          calendar_id: string | null
          created_at: string
          date: string
          id: string
          name: string
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string
          date: string
          id?: string
          name: string
        }
        Update: {
          calendar_id?: string | null
          created_at?: string
          date?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "holiday_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_signatures: {
        Row: {
          created_at: string
          id: string
          month: number
          report_data: Json | null
          signature_data: string | null
          signed_at: string | null
          total_worked_minutes: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          report_data?: Json | null
          signature_data?: string | null
          signed_at?: string | null
          total_worked_minutes?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          report_data?: Json | null
          signature_data?: string | null
          signed_at?: string | null
          total_worked_minutes?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offices: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          radius_meters: number
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          radius_meters?: number
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          radius_meters?: number
        }
        Relationships: []
      }
      presence_logs: {
        Row: {
          created_at: string
          event_type: string
          gps_accuracy: number | null
          id: string
          ip_address: string | null
          is_within_geofence: boolean | null
          latitude: number | null
          longitude: number | null
          time_entry_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          gps_accuracy?: number | null
          id?: string
          ip_address?: string | null
          is_within_geofence?: boolean | null
          latitude?: number | null
          longitude?: number | null
          time_entry_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          gps_accuracy?: number | null
          id?: string
          ip_address?: string | null
          is_within_geofence?: boolean | null
          latitude?: number | null
          longitude?: number | null
          time_entry_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_logs_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          can_view_reports: boolean
          created_at: string
          department_id: string | null
          email: string
          employee_code: string | null
          expected_start_time: string
          first_name: string | null
          holiday_calendar_id: string | null
          id: string
          is_active: boolean
          last_name: string | null
          lunch_break_duration: number
          name: string
          office_id: string | null
          supervisor_id: string | null
          updated_at: string
          user_id: string
          work_agreement_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          can_view_reports?: boolean
          created_at?: string
          department_id?: string | null
          email: string
          employee_code?: string | null
          expected_start_time?: string
          first_name?: string | null
          holiday_calendar_id?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          lunch_break_duration?: number
          name: string
          office_id?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id: string
          work_agreement_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          can_view_reports?: boolean
          created_at?: string
          department_id?: string | null
          email?: string
          employee_code?: string | null
          expected_start_time?: string
          first_name?: string | null
          holiday_calendar_id?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          lunch_break_duration?: number
          name?: string
          office_id?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string
          work_agreement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_holiday_calendar_id_fkey"
            columns: ["holiday_calendar_id"]
            isOneToOne: false
            referencedRelation: "holiday_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_work_agreement_id_fkey"
            columns: ["work_agreement_id"]
            isOneToOne: false
            referencedRelation: "work_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_clock_permissions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          permission_date: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          permission_date: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          permission_date?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          message: string
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          message: string
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          message?: string
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          id: string
          lunch_end: string | null
          lunch_start: string | null
          status: Database["public"]["Enums"]["clock_status"]
          total_worked_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          status?: Database["public"]["Enums"]["clock_status"]
          total_worked_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          status?: Database["public"]["Enums"]["clock_status"]
          total_worked_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_agreements: {
        Row: {
          annual_hours: number
          created_at: string
          friday_reduced_hours: number | null
          id: string
          is_template: boolean
          name: string
          notes: string | null
          region: string
          sector: string
          summer_end_month: number | null
          summer_intensive: boolean
          summer_start_month: number | null
          vacation_days: number
          weekly_hours: number
        }
        Insert: {
          annual_hours?: number
          created_at?: string
          friday_reduced_hours?: number | null
          id?: string
          is_template?: boolean
          name: string
          notes?: string | null
          region?: string
          sector: string
          summer_end_month?: number | null
          summer_intensive?: boolean
          summer_start_month?: number | null
          vacation_days?: number
          weekly_hours?: number
        }
        Update: {
          annual_hours?: number
          created_at?: string
          friday_reduced_hours?: number | null
          id?: string
          is_template?: boolean
          name?: string
          notes?: string | null
          region?: string
          sector?: string
          summer_end_month?: number | null
          summer_intensive?: boolean
          summer_start_month?: number | null
          vacation_days?: number
          weekly_hours?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance_meters: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_supervised_by: {
        Args: { _supervisor_user_id: string; _user_id: string }
        Returns: boolean
      }
      notify_supervisor_unknown_location: {
        Args: { _event_type: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "employee" | "supervisor" | "admin"
      clock_status:
        | "not_started"
        | "checked_in"
        | "lunch_started"
        | "lunch_ended"
        | "checked_out"
      request_status: "pending" | "approved" | "rejected"
      request_type:
        | "vacation"
        | "absence"
        | "overtime"
        | "sick_leave"
        | "personal_day"
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
      app_role: ["employee", "supervisor", "admin"],
      clock_status: [
        "not_started",
        "checked_in",
        "lunch_started",
        "lunch_ended",
        "checked_out",
      ],
      request_status: ["pending", "approved", "rejected"],
      request_type: [
        "vacation",
        "absence",
        "overtime",
        "sick_leave",
        "personal_day",
      ],
    },
  },
} as const
