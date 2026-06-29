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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          catatan: string | null
          code: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          instansi_id: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          catatan?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          instansi_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          catatan?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          instansi_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_instansi_id_fkey"
            columns: ["instansi_id"]
            isOneToOne: false
            referencedRelation: "instansi"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_summary: {
        Row: {
          event_id: string | null
          generated_at: string
          harapan: string | null
          id: string
          kebijakan_id: string | null
          kekhawatiran: string | null
          mayoritas_setuju: string | null
          mayoritas_tidak_setuju: string | null
          rekomendasi: string | null
          ringkasan: string
          sentiment_negatif: number | null
          sentiment_netral: number | null
          sentiment_positif: number | null
          total_komentar: number | null
        }
        Insert: {
          event_id?: string | null
          generated_at?: string
          harapan?: string | null
          id?: string
          kebijakan_id?: string | null
          kekhawatiran?: string | null
          mayoritas_setuju?: string | null
          mayoritas_tidak_setuju?: string | null
          rekomendasi?: string | null
          ringkasan: string
          sentiment_negatif?: number | null
          sentiment_netral?: number | null
          sentiment_positif?: number | null
          total_komentar?: number | null
        }
        Update: {
          event_id?: string | null
          generated_at?: string
          harapan?: string | null
          id?: string
          kebijakan_id?: string | null
          kekhawatiran?: string | null
          mayoritas_setuju?: string | null
          mayoritas_tidak_setuju?: string | null
          rekomendasi?: string | null
          ringkasan?: string
          sentiment_negatif?: number | null
          sentiment_netral?: number | null
          sentiment_positif?: number | null
          total_komentar?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_summary_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_voting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summary_kebijakan_id_fkey"
            columns: ["kebijakan_id"]
            isOneToOne: false
            referencedRelation: "kebijakan"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banner: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          judul: string
          link: string | null
          subjudul: string | null
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          judul: string
          link?: string | null
          subjudul?: string | null
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          judul?: string
          link?: string | null
          subjudul?: string | null
          updated_at?: string
          urutan?: number
        }
        Relationships: []
      }
      bookmark: {
        Row: {
          created_at: string
          id: string
          kebijakan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kebijakan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kebijakan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmark_kebijakan_id_fkey"
            columns: ["kebijakan_id"]
            isOneToOne: false
            referencedRelation: "kebijakan"
            referencedColumns: ["id"]
          },
        ]
      }
      event_kebijakan: {
        Row: {
          created_at: string
          event_id: string
          kebijakan_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          kebijakan_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          kebijakan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_kebijakan_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_voting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_kebijakan_kebijakan_id_fkey"
            columns: ["kebijakan_id"]
            isOneToOne: false
            referencedRelation: "kebijakan"
            referencedColumns: ["id"]
          },
        ]
      }
      event_voting: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deskripsi: string | null
          id: string
          instansi_id: string | null
          is_auto_generated: boolean
          judul: string
          share_count: number
          slug: string
          status: Database["public"]["Enums"]["event_status"]
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          thumbnail_url: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deskripsi?: string | null
          id?: string
          instansi_id?: string | null
          is_auto_generated?: boolean
          judul: string
          share_count?: number
          slug: string
          status?: Database["public"]["Enums"]["event_status"]
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deskripsi?: string | null
          id?: string
          instansi_id?: string | null
          is_auto_generated?: boolean
          judul?: string
          share_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["event_status"]
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_voting_instansi_id_fkey"
            columns: ["instansi_id"]
            isOneToOne: false
            referencedRelation: "instansi"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          jawaban: string
          kategori: string | null
          pertanyaan: string
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          jawaban: string
          kategori?: string | null
          pertanyaan: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          jawaban?: string
          kategori?: string | null
          pertanyaan?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: []
      }
      instansi: {
        Row: {
          created_at: string
          deleted_at: string | null
          deskripsi: string | null
          email: string | null
          id: string
          logo_url: string | null
          nama: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deskripsi?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nama: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deskripsi?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nama?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      kategori: {
        Row: {
          created_at: string
          deleted_at: string | null
          deskripsi: string | null
          id: string
          ikon: string | null
          nama: string
          slug: string
          updated_at: string
          warna: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deskripsi?: string | null
          id?: string
          ikon?: string | null
          nama: string
          slug: string
          updated_at?: string
          warna?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deskripsi?: string | null
          id?: string
          ikon?: string | null
          nama?: string
          slug?: string
          updated_at?: string
          warna?: string | null
        }
        Relationships: []
      }
      kebijakan: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deskripsi: string | null
          dokumen_url: string | null
          id: string
          instansi_id: string | null
          judul: string
          kategori_id: string | null
          konten: string | null
          share_count: number
          slug: string
          status: Database["public"]["Enums"]["kebijakan_status"]
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          thumbnail_url: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deskripsi?: string | null
          dokumen_url?: string | null
          id?: string
          instansi_id?: string | null
          judul: string
          kategori_id?: string | null
          konten?: string | null
          share_count?: number
          slug: string
          status?: Database["public"]["Enums"]["kebijakan_status"]
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deskripsi?: string | null
          dokumen_url?: string | null
          id?: string
          instansi_id?: string | null
          judul?: string
          kategori_id?: string | null
          konten?: string | null
          share_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["kebijakan_status"]
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kebijakan_instansi_id_fkey"
            columns: ["instansi_id"]
            isOneToOne: false
            referencedRelation: "instansi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kebijakan_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori"
            referencedColumns: ["id"]
          },
        ]
      }
      komentar: {
        Row: {
          created_at: string
          deleted_at: string | null
          event_id: string | null
          id: string
          kebijakan_id: string | null
          konten: string
          parent_id: string | null
          sentiment: Database["public"]["Enums"]["sentiment_label"] | null
          sentiment_score: number | null
          status: Database["public"]["Enums"]["komentar_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          id?: string
          kebijakan_id?: string | null
          konten: string
          parent_id?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_label"] | null
          sentiment_score?: number | null
          status?: Database["public"]["Enums"]["komentar_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          id?: string
          kebijakan_id?: string | null
          konten?: string
          parent_id?: string | null
          sentiment?: Database["public"]["Enums"]["sentiment_label"] | null
          sentiment_score?: number | null
          status?: Database["public"]["Enums"]["komentar_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komentar_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_voting"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komentar_kebijakan_id_fkey"
            columns: ["kebijakan_id"]
            isOneToOne: false
            referencedRelation: "kebijakan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komentar_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "komentar"
            referencedColumns: ["id"]
          },
        ]
      }
      laporan: {
        Row: {
          alasan: string
          created_at: string
          id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alasan: string
          created_at?: string
          id?: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alasan?: string
          created_at?: string
          id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifikasi: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          instansi_id: string | null
          kota: string | null
          phone: string | null
          provinsi: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          instansi_id?: string | null
          kota?: string | null
          phone?: string | null
          provinsi?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          instansi_id?: string | null
          kota?: string | null
          phone?: string | null
          provinsi?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_instansi_fk"
            columns: ["instansi_id"]
            isOneToOne: false
            referencedRelation: "instansi"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          instansi_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instansi_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instansi_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_instansi_fk"
            columns: ["instansi_id"]
            isOneToOne: false
            referencedRelation: "instansi"
            referencedColumns: ["id"]
          },
        ]
      }
      voting: {
        Row: {
          alasan: string | null
          created_at: string
          event_id: string
          id: string
          pilihan: Database["public"]["Enums"]["vote_choice"]
          user_id: string
        }
        Insert: {
          alasan?: string | null
          created_at?: string
          event_id: string
          id?: string
          pilihan: Database["public"]["Enums"]["vote_choice"]
          user_id: string
        }
        Update: {
          alasan?: string | null
          created_at?: string
          event_id?: string
          id?: string
          pilihan?: Database["public"]["Enums"]["vote_choice"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voting_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_voting"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      redeem_admin_invite: { Args: { _code: string }; Returns: Json }
      slugify: { Args: { value: string }; Returns: string }
      trending_score: { Args: { _kebijakan_id: string }; Returns: number }
      user_instansi: { Args: { _user_id: string }; Returns: string }
      write_audit: {
        Args: {
          _action: string
          _metadata: Json
          _resource_id: string
          _resource_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "admin_instansi" | "masyarakat"
      event_status: "draft" | "aktif" | "ditutup" | "dibatalkan"
      kebijakan_status:
        | "draft"
        | "published"
        | "voting_aktif"
        | "voting_ditutup"
        | "ditinjau"
        | "ditindaklanjuti"
        | "selesai"
      komentar_status: "pending" | "approved" | "rejected"
      notif_type:
        | "voting_baru"
        | "voting_hampir_berakhir"
        | "hasil_voting"
        | "komentar_dibalas"
        | "pengumuman"
      sentiment_label: "positif" | "netral" | "negatif"
      vote_choice: "setuju" | "netral" | "tidak_setuju"
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
      app_role: ["super_admin", "admin_instansi", "masyarakat"],
      event_status: ["draft", "aktif", "ditutup", "dibatalkan"],
      kebijakan_status: [
        "draft",
        "published",
        "voting_aktif",
        "voting_ditutup",
        "ditinjau",
        "ditindaklanjuti",
        "selesai",
      ],
      komentar_status: ["pending", "approved", "rejected"],
      notif_type: [
        "voting_baru",
        "voting_hampir_berakhir",
        "hasil_voting",
        "komentar_dibalas",
        "pengumuman",
      ],
      sentiment_label: ["positif", "netral", "negatif"],
      vote_choice: ["setuju", "netral", "tidak_setuju"],
    },
  },
} as const
