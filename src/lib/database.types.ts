// أنواع قاعدة البيانات — مولّدة يدويًا من supabase/schema.sql + schema_v2.sql
// (تُستبدل بـ `supabase gen types typescript` بعد ربط المشروع)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus =
  | "new"
  | "in_progress"
  | "ready"
  | "delivered"
  | "cancelled";

export type FabricType =
  | "boucle"
  | "velvet"
  | "chenille"
  | "corduroy"
  | "leather"
  | "linen"
  | "jacquard"
  | "other";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          slug: string;
          name_ar: string;
          name_fr: string | null;
          sort_order: number;
        };
        Insert: {
          id?: number;
          slug: string;
          name_ar: string;
          name_fr?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      furniture_types: {
        Row: {
          id: number;
          category_id: number;
          slug: string;
          name_ar: string;
          name_fr: string | null;
          svg_file: string | null;
          min_length: number;
          max_length: number;
          min_width: number;
          max_width: number;
          min_height: number;
          max_height: number;
          is_round: boolean;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          category_id: number;
          slug: string;
          name_ar: string;
          name_fr?: string | null;
          svg_file?: string | null;
          min_length: number;
          max_length: number;
          min_width: number;
          max_width: number;
          min_height: number;
          max_height: number;
          is_round?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["furniture_types"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "furniture_types_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: number;
          category_id: number;
          slug: string;
          name: string;
          description: string | null;
          is_visible: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          category_id: number;
          slug: string;
          name: string;
          description?: string | null;
          is_visible?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: number;
          product_id: number;
          url: string;
          alt_text: string | null;
          is_main: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          product_id: number;
          url: string;
          alt_text?: string | null;
          is_main?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      fabrics: {
        Row: {
          id: number;
          name: string;
          thumbnail_url: string;
          texture_url: string;
          dominant_color: string | null;
          fabric_type: FabricType;
          code: string | null;
          supplier: string | null;
          is_print: boolean;
          is_available: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          name: string;
          thumbnail_url: string;
          texture_url: string;
          dominant_color?: string | null;
          fabric_type?: FabricType;
          code?: string | null;
          supplier?: string | null;
          is_print?: boolean;
          is_available?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["fabrics"]["Insert"]>;
        Relationships: [];
      };
      fabric_furniture_types: {
        Row: { fabric_id: number; furniture_type_id: number };
        Insert: { fabric_id: number; furniture_type_id: number };
        Update: {
          fabric_id?: number;
          furniture_type_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fabric_furniture_types_fabric_id_fkey";
            columns: ["fabric_id"];
            referencedRelation: "fabrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fabric_furniture_types_furniture_type_id_fkey";
            columns: ["furniture_type_id"];
            referencedRelation: "furniture_types";
            referencedColumns: ["id"];
          },
        ];
      };
      wood_finishes: {
        Row: {
          id: number;
          name: string;
          color_hex: string;
          is_available: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          name: string;
          color_hex: string;
          is_available?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["wood_finishes"]["Insert"]>;
        Relationships: [];
      };
      option_groups: {
        Row: {
          id: number;
          furniture_type_id: number;
          key: string;
          name_ar: string;
          name_fr: string | null;
          is_required: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          furniture_type_id: number;
          key: string;
          name_ar: string;
          name_fr?: string | null;
          is_required?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["option_groups"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "option_groups_furniture_type_id_fkey";
            columns: ["furniture_type_id"];
            referencedRelation: "furniture_types";
            referencedColumns: ["id"];
          },
        ];
      };
      option_values: {
        Row: {
          id: number;
          group_id: number;
          key: string;
          name_ar: string;
          name_fr: string | null;
          is_available: boolean;
          sort_order: number;
        };
        Insert: {
          id?: number;
          group_id: number;
          key: string;
          name_ar: string;
          name_fr?: string | null;
          is_available?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["option_values"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "option_values_group_id_fkey";
            columns: ["group_id"];
            referencedRelation: "option_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          phone: string;
          address: string | null;
          notes: string | null;
          budget: number | null;
          agreed_price: number | null;
          internal_note: string | null;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_name: string;
          phone: string;
          address?: string | null;
          notes?: string | null;
          budget?: number | null;
          agreed_price?: number | null;
          internal_note?: string | null;
          status?: OrderStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          furniture_type_id: number;
          fabric_id: number | null;
          wood_finish_id: number | null;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          quantity: number;
          notes: string | null;
          snapshot_path: string | null;
          options: Json;
        };
        Insert: {
          id?: string;
          order_id: string;
          furniture_type_id: number;
          fabric_id?: number | null;
          wood_finish_id?: number | null;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          quantity: number;
          notes?: string | null;
          snapshot_path?: string | null;
          options?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_furniture_type_id_fkey";
            columns: ["furniture_type_id"];
            referencedRelation: "furniture_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_fabric_id_fkey";
            columns: ["fabric_id"];
            referencedRelation: "fabrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_wood_finish_id_fkey";
            columns: ["wood_finish_id"];
            referencedRelation: "wood_finishes";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_log: {
        Row: {
          id: number;
          order_id: string;
          old_status: OrderStatus | null;
          new_status: OrderStatus;
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: string;
          old_status?: OrderStatus | null;
          new_status: OrderStatus;
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_status_log"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_status_log_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_log: {
        Row: {
          id: number;
          order_id: string | null;
          channel: string;
          success: boolean;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id?: string | null;
          channel: string;
          success: boolean;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_log"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "notification_log_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limits: {
        Row: { ip_hash: string; created_at: string };
        Insert: { ip_hash: string; created_at?: string };
        Update: { ip_hash?: string; created_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_order: {
        Args: { p_customer: Json; p_items: Json };
        Returns: Json;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ── صفوف مُستخدمة كثيرًا (اختصار) ──────────────────────
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type FurnitureType =
  Database["public"]["Tables"]["furniture_types"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type Fabric = Database["public"]["Tables"]["fabrics"]["Row"];
export type WoodFinish = Database["public"]["Tables"]["wood_finishes"]["Row"];
export type OptionGroup = Database["public"]["Tables"]["option_groups"]["Row"];
export type OptionValue = Database["public"]["Tables"]["option_values"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderStatusLogEntry =
  Database["public"]["Tables"]["order_status_log"]["Row"];
export type NotificationLogEntry =
  Database["public"]["Tables"]["notification_log"]["Row"];
