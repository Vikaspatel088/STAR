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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_time: string
          id: string
          latitude: number | null
          longitude: number | null
          monument_id: string
          ticket_id: string
          tourist_id: string
        }
        Insert: {
          check_in_time?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          monument_id: string
          ticket_id: string
          tourist_id: string
        }
        Update: {
          check_in_time?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          monument_id?: string
          ticket_id?: string
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_monument_id_fkey"
            columns: ["monument_id"]
            isOneToOne: false
            referencedRelation: "monuments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourists"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          coupon_type: string
          created_at: string
          id: string
          is_redeemed: boolean
          tourist_id: string
        }
        Insert: {
          code: string
          coupon_type: string
          created_at?: string
          id?: string
          is_redeemed?: boolean
          tourist_id: string
        }
        Update: {
          code?: string
          coupon_type?: string
          created_at?: string
          id?: string
          is_redeemed?: boolean
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourists"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_monuments: {
        Row: {
          guide_id: string
          id: string
          monument_id: string
        }
        Insert: {
          guide_id: string
          id?: string
          monument_id: string
        }
        Update: {
          guide_id?: string
          id?: string
          monument_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_monuments_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tour_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_monuments_monument_id_fkey"
            columns: ["monument_id"]
            isOneToOne: false
            referencedRelation: "monuments"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_ratings: {
        Row: {
          behaviour_rating: number
          comment: string | null
          created_at: string
          guide_id: string
          id: string
          language_rating: number
          responsibility_rating: number
          tourist_id: string
        }
        Insert: {
          behaviour_rating: number
          comment?: string | null
          created_at?: string
          guide_id: string
          id?: string
          language_rating: number
          responsibility_rating: number
          tourist_id: string
        }
        Update: {
          behaviour_rating?: number
          comment?: string | null
          created_at?: string
          guide_id?: string
          id?: string
          language_rating?: number
          responsibility_rating?: number
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_ratings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tour_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_ratings_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourists"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          amenities: string[] | null
          city: string
          created_at: string
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          price_range: string | null
          rating: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          city: string
          created_at?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          price_range?: string | null
          rating?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          city?: string
          created_at?: string
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          price_range?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      monuments: {
        Row: {
          city: string
          created_at: string
          description: string | null
          foreign_price: number
          id: string
          image_url: string | null
          indian_price: number
          latitude: number | null
          longitude: number | null
          name: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          description?: string | null
          foreign_price: number
          id?: string
          image_url?: string | null
          indian_price: number
          latitude?: number | null
          longitude?: number | null
          name: string
          state?: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          foreign_price?: number
          id?: string
          image_url?: string | null
          indian_price?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          state?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          contact_number: string
          contact_person: string
          created_at: string
          id: string
          name: string
          organisation_id: string
          organisation_type: string
          user_id: string
        }
        Insert: {
          contact_number: string
          contact_person: string
          created_at?: string
          id?: string
          name: string
          organisation_id: string
          organisation_type: string
          user_id: string
        }
        Update: {
          contact_number?: string
          contact_person?: string
          created_at?: string
          id?: string
          name?: string
          organisation_id?: string
          organisation_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sos_events: {
        Row: {
          admin_notes: string | null
          battery_percent: number | null
          created_at: string
          emergency_type: string
          id: string
          latitude: number | null
          longitude: number | null
          resolved_at: string | null
          status: string
          tourist_id: string
        }
        Insert: {
          admin_notes?: string | null
          battery_percent?: number | null
          created_at?: string
          emergency_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          resolved_at?: string | null
          status?: string
          tourist_id: string
        }
        Update: {
          admin_notes?: string | null
          battery_percent?: number | null
          created_at?: string
          emergency_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          resolved_at?: string | null
          status?: string
          tourist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sos_events_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourists"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          is_used: boolean
          monument_id: string
          price: number
          qr_code: string
          ticket_type: string
          tourist_id: string
          visit_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean
          monument_id: string
          price: number
          qr_code: string
          ticket_type: string
          tourist_id: string
          visit_date: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean
          monument_id?: string
          price?: number
          qr_code?: string
          ticket_type?: string
          tourist_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_monument_id_fkey"
            columns: ["monument_id"]
            isOneToOne: false
            referencedRelation: "monuments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tourist_id_fkey"
            columns: ["tourist_id"]
            isOneToOne: false
            referencedRelation: "tourists"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_guides: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          created_at: string
          experience_years: number
          hourly_rate: number
          id: string
          is_verified: boolean
          languages: string[]
          name: string
          phone: string
          total_ratings: number | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          created_at?: string
          experience_years: number
          hourly_rate: number
          id?: string
          is_verified?: boolean
          languages: string[]
          name: string
          phone: string
          total_ratings?: number | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          created_at?: string
          experience_years?: number
          hourly_rate?: number
          id?: string
          is_verified?: boolean
          languages?: string[]
          name?: string
          phone?: string
          total_ratings?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tourists: {
        Row: {
          created_at: string
          digital_tourist_id: string
          emergency_contact: string
          id: string
          id_hash: string
          tourist_type: string
          trip_type: string
          user_id: string
          xp_points: number
        }
        Insert: {
          created_at?: string
          digital_tourist_id: string
          emergency_contact: string
          id?: string
          id_hash: string
          tourist_type: string
          trip_type: string
          user_id: string
          xp_points?: number
        }
        Update: {
          created_at?: string
          digital_tourist_id?: string
          emergency_contact?: string
          id?: string
          id_hash?: string
          tourist_type?: string
          trip_type?: string
          user_id?: string
          xp_points?: number
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
      app_role: "tourist" | "tour_guide" | "admin" | "organisation"
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
      app_role: ["tourist", "tour_guide", "admin", "organisation"],
    },
  },
} as const
