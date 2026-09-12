export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string;
          description: string | null;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_name: string | null;
          changes: Json | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: string;
          ip: string | null;
          summary: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_name?: string | null;
          changes?: Json | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: string;
          ip?: string | null;
          summary?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_name?: string | null;
          changes?: Json | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          ip?: string | null;
          summary?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      breeds: {
        Row: {
          code: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          livestock_type_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          livestock_type_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          livestock_type_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "breeds_livestock_type_id_fkey";
            columns: ["livestock_type_id"];
            isOneToOne: false;
            referencedRelation: "livestock_types";
            referencedColumns: ["id"];
          },
        ];
      };
      cages: {
        Row: {
          capacity: number | null;
          code: string;
          created_at: string;
          id: string;
          length_m: number | null;
          livestock_type_id: string | null;
          location: string | null;
          name: string;
          notes: string | null;
          photo_url: string | null;
          status: Database["public"]["Enums"]["cage_status"];
          updated_at: string;
          width_m: number | null;
        };
        Insert: {
          capacity?: number | null;
          code: string;
          created_at?: string;
          id?: string;
          length_m?: number | null;
          livestock_type_id?: string | null;
          location?: string | null;
          name: string;
          notes?: string | null;
          photo_url?: string | null;
          status?: Database["public"]["Enums"]["cage_status"];
          updated_at?: string;
          width_m?: number | null;
        };
        Update: {
          capacity?: number | null;
          code?: string;
          created_at?: string;
          id?: string;
          length_m?: number | null;
          livestock_type_id?: string | null;
          location?: string | null;
          name?: string;
          notes?: string | null;
          photo_url?: string | null;
          status?: Database["public"]["Enums"]["cage_status"];
          updated_at?: string;
          width_m?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "cages_livestock_type_id_fkey";
            columns: ["livestock_type_id"];
            isOneToOne: false;
            referencedRelation: "livestock_types";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_reports: {
        Row: {
          cage_id: string;
          condition: string;
          created_at: string;
          created_by: string | null;
          feed_type_id: string | null;
          feed_used: number | null;
          group_id: string | null;
          id: string;
          mortality: number;
          mortality_cause: string | null;
          notes: string | null;
          population_note: string | null;
          production_quantity: number | null;
          production_type_id: string | null;
          report_date: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          updated_at: string;
          weather: string | null;
        };
        Insert: {
          cage_id: string;
          condition?: string;
          created_at?: string;
          created_by?: string | null;
          feed_type_id?: string | null;
          feed_used?: number | null;
          group_id?: string | null;
          id?: string;
          mortality?: number;
          mortality_cause?: string | null;
          notes?: string | null;
          population_note?: string | null;
          production_quantity?: number | null;
          production_type_id?: string | null;
          report_date?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          weather?: string | null;
        };
        Update: {
          cage_id?: string;
          condition?: string;
          created_at?: string;
          created_by?: string | null;
          feed_type_id?: string | null;
          feed_used?: number | null;
          group_id?: string | null;
          id?: string;
          mortality?: number;
          mortality_cause?: string | null;
          notes?: string | null;
          population_note?: string | null;
          production_quantity?: number | null;
          production_type_id?: string | null;
          report_date?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          updated_at?: string;
          weather?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_reports_cage_id_fkey";
            columns: ["cage_id"];
            isOneToOne: false;
            referencedRelation: "cages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_reports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_reports_feed_type_id_fkey";
            columns: ["feed_type_id"];
            isOneToOne: false;
            referencedRelation: "feed_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_reports_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "livestock_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_reports_production_type_id_fkey";
            columns: ["production_type_id"];
            isOneToOne: false;
            referencedRelation: "production_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      feed_transactions: {
        Row: {
          cage_id: string | null;
          created_at: string;
          created_by: string | null;
          feed_type_id: string;
          group_id: string | null;
          id: string;
          invoice_no: string | null;
          notes: string | null;
          quantity: number;
          supplier: string | null;
          total_price: number | null;
          txn_date: string;
          txn_type: Database["public"]["Enums"]["feed_txn_type"];
          unit_price: number | null;
          updated_at: string;
        };
        Insert: {
          cage_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          feed_type_id: string;
          group_id?: string | null;
          id?: string;
          invoice_no?: string | null;
          notes?: string | null;
          quantity: number;
          supplier?: string | null;
          total_price?: number | null;
          txn_date?: string;
          txn_type: Database["public"]["Enums"]["feed_txn_type"];
          unit_price?: number | null;
          updated_at?: string;
        };
        Update: {
          cage_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          feed_type_id?: string;
          group_id?: string | null;
          id?: string;
          invoice_no?: string | null;
          notes?: string | null;
          quantity?: number;
          supplier?: string | null;
          total_price?: number | null;
          txn_date?: string;
          txn_type?: Database["public"]["Enums"]["feed_txn_type"];
          unit_price?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feed_transactions_cage_id_fkey";
            columns: ["cage_id"];
            isOneToOne: false;
            referencedRelation: "cages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_transactions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_transactions_feed_type_id_fkey";
            columns: ["feed_type_id"];
            isOneToOne: false;
            referencedRelation: "feed_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feed_transactions_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "livestock_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      feed_types: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          low_stock_threshold: number;
          name: string;
          price_per_unit: number;
          sku: string | null;
          unit: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          low_stock_threshold?: number;
          name: string;
          price_per_unit?: number;
          sku?: string | null;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          low_stock_threshold?: number;
          name?: string;
          price_per_unit?: number;
          sku?: string | null;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      health_records: {
        Row: {
          affected_count: number;
          cage_id: string | null;
          cost: number | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          dosage: string | null;
          follow_up_date: string | null;
          group_id: string | null;
          health_type: Database["public"]["Enums"]["health_type"];
          id: string;
          medication: string | null;
          record_date: string;
          resolved_at: string | null;
          severity: string | null;
          status: string;
          title: string;
          updated_at: string;
          veterinarian: string | null;
        };
        Insert: {
          affected_count?: number;
          cage_id?: string | null;
          cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          dosage?: string | null;
          follow_up_date?: string | null;
          group_id?: string | null;
          health_type: Database["public"]["Enums"]["health_type"];
          id?: string;
          medication?: string | null;
          record_date?: string;
          resolved_at?: string | null;
          severity?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          veterinarian?: string | null;
        };
        Update: {
          affected_count?: number;
          cage_id?: string | null;
          cost?: number | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          dosage?: string | null;
          follow_up_date?: string | null;
          group_id?: string | null;
          health_type?: Database["public"]["Enums"]["health_type"];
          id?: string;
          medication?: string | null;
          record_date?: string;
          resolved_at?: string | null;
          severity?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          veterinarian?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "health_records_cage_id_fkey";
            columns: ["cage_id"];
            isOneToOne: false;
            referencedRelation: "cages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "health_records_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "health_records_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "livestock_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      livestock_events: {
        Row: {
          counterparty: string | null;
          created_at: string;
          created_by: string | null;
          destination_cage_id: string | null;
          event_date: string;
          event_type: Database["public"]["Enums"]["event_type"];
          female_count: number;
          group_id: string;
          id: string;
          invoice_no: string | null;
          male_count: number;
          notes: string | null;
          reason: string | null;
          total_price: number | null;
          unit_price: number | null;
          unsexed_count: number;
          updated_at: string;
          weight: number | null;
          weight_unit: string;
        };
        Insert: {
          counterparty?: string | null;
          created_at?: string;
          created_by?: string | null;
          destination_cage_id?: string | null;
          event_date?: string;
          event_type: Database["public"]["Enums"]["event_type"];
          female_count?: number;
          group_id: string;
          id?: string;
          invoice_no?: string | null;
          male_count?: number;
          notes?: string | null;
          reason?: string | null;
          total_price?: number | null;
          unit_price?: number | null;
          unsexed_count?: number;
          updated_at?: string;
          weight?: number | null;
          weight_unit?: string;
        };
        Update: {
          counterparty?: string | null;
          created_at?: string;
          created_by?: string | null;
          destination_cage_id?: string | null;
          event_date?: string;
          event_type?: Database["public"]["Enums"]["event_type"];
          female_count?: number;
          group_id?: string;
          id?: string;
          invoice_no?: string | null;
          male_count?: number;
          notes?: string | null;
          reason?: string | null;
          total_price?: number | null;
          unit_price?: number | null;
          unsexed_count?: number;
          updated_at?: string;
          weight?: number | null;
          weight_unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "livestock_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "livestock_events_destination_cage_id_fkey";
            columns: ["destination_cage_id"];
            isOneToOne: false;
            referencedRelation: "cages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "livestock_events_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "livestock_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      livestock_groups: {
        Row: {
          birth_batch: string | null;
          breed_id: string | null;
          cage_id: string;
          created_at: string;
          ended_at: string | null;
          female_count: number;
          id: string;
          livestock_type_id: string;
          male_count: number;
          name: string;
          notes: string | null;
          source: string | null;
          started_at: string;
          status: Database["public"]["Enums"]["group_status"];
          supports_individual: boolean;
          unsexed_count: number;
          updated_at: string;
        };
        Insert: {
          birth_batch?: string | null;
          breed_id?: string | null;
          cage_id: string;
          created_at?: string;
          ended_at?: string | null;
          female_count?: number;
          id?: string;
          livestock_type_id: string;
          male_count?: number;
          name: string;
          notes?: string | null;
          source?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["group_status"];
          supports_individual?: boolean;
          unsexed_count?: number;
          updated_at?: string;
        };
        Update: {
          birth_batch?: string | null;
          breed_id?: string | null;
          cage_id?: string;
          created_at?: string;
          ended_at?: string | null;
          female_count?: number;
          id?: string;
          livestock_type_id?: string;
          male_count?: number;
          name?: string;
          notes?: string | null;
          source?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["group_status"];
          supports_individual?: boolean;
          unsexed_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "livestock_groups_breed_id_fkey";
            columns: ["breed_id"];
            isOneToOne: false;
            referencedRelation: "breeds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "livestock_groups_cage_id_fkey";
            columns: ["cage_id"];
            isOneToOne: false;
            referencedRelation: "cages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "livestock_groups_livestock_type_id_fkey";
            columns: ["livestock_type_id"];
            isOneToOne: false;
            referencedRelation: "livestock_types";
            referencedColumns: ["id"];
          },
        ];
      };
      livestock_individuals: {
        Row: {
          birth_date: string | null;
          created_at: string;
          eartag: string;
          group_id: string;
          id: string;
          notes: string | null;
          sex: string;
          status: string;
          updated_at: string;
          weight: number | null;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          eartag: string;
          group_id: string;
          id?: string;
          notes?: string | null;
          sex: string;
          status?: string;
          updated_at?: string;
          weight?: number | null;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          eartag?: string;
          group_id?: string;
          id?: string;
          notes?: string | null;
          sex?: string;
          status?: string;
          updated_at?: string;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "livestock_individuals_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "livestock_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      livestock_types: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      production_records: {
        Row: {
          cage_id: string | null;
          created_at: string;
          created_by: string | null;
          group_id: string | null;
          id: string;
          notes: string | null;
          production_type_id: string;
          quality_grade: string | null;
          quantity: number;
          record_date: string;
          unit_snapshot: string | null;
          updated_at: string;
          weight_kg: number | null;
        };
        Insert: {
          cage_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          notes?: string | null;
          production_type_id: string;
          quality_grade?: string | null;
          quantity: number;
          record_date?: string;
          unit_snapshot?: string | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          cage_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          notes?: string | null;
          production_type_id?: string;
          quality_grade?: string | null;
          quantity?: number;
          record_date?: string;
          unit_snapshot?: string | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "production_records_cage_id_fkey";
            columns: ["cage_id"];
            isOneToOne: false;
            referencedRelation: "cages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_records_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_records_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "livestock_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "production_records_production_type_id_fkey";
            columns: ["production_type_id"];
            isOneToOne: false;
            referencedRelation: "production_types";
            referencedColumns: ["id"];
          },
        ];
      };
      production_types: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          livestock_type_id: string | null;
          name: string;
          unit: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          livestock_type_id?: string | null;
          name: string;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          livestock_type_id?: string | null;
          name?: string;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "production_types_livestock_type_id_fkey";
            columns: ["livestock_type_id"];
            isOneToOne: false;
            referencedRelation: "livestock_types";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["account_status"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_cage_population: {
        Row: {
          cage_code: string | null;
          cage_id: string | null;
          cage_name: string | null;
          cage_status: Database["public"]["Enums"]["cage_status"] | null;
          female: number | null;
          groups_count: number | null;
          male: number | null;
          total: number | null;
          unsexed: number | null;
        };
        Relationships: [];
      };
      v_feed_stock: {
        Row: {
          feed_name: string | null;
          feed_type_id: string | null;
          low_stock_threshold: number | null;
          stock: number | null;
          total_in_value: number | null;
          unit: string | null;
        };
        Relationships: [];
      };
      v_health_open: {
        Row: {
          affected_count: number | null;
          cage_id: string | null;
          cost: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          dosage: string | null;
          follow_up_date: string | null;
          group_id: string | null;
          health_type: Database["public"]["Enums"]["health_type"] | null;
          id: string | null;
          medication: string | null;
          record_date: string | null;
          resolved_at: string | null;
          severity: string | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          veterinarian: string | null;
        };
        Relationships: [];
      };
      v_production_daily: {
        Row: {
          production_type_id: string | null;
          record_date: string | null;
          records: number | null;
          total_qty: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      account_status: "active" | "inactive";
      cage_status: "active" | "inactive" | "maintenance";
      event_type:
        | "birth"
        | "death"
        | "incoming"
        | "outgoing"
        | "sale"
        | "transfer"
        | "slaughter"
        | "other";
      feed_txn_type: "in" | "consumption" | "adjustment";
      group_status: "active" | "closed";
      health_type: "illness" | "treatment" | "vaccination" | "checkup";
      user_role: "admin" | "petugas";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  TableName extends
    keyof Database["public"]["Tables"] | keyof Database["public"]["Views"],
> =
  Database["public"]["Tables"] extends Record<TableName, { Row: infer R }>
    ? R
    : Database["public"]["Views"] extends Record<TableName, { Row: infer R }>
      ? R
      : never;
