export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MemberStatus = 'active' | 'inactive' | 'invited' | 'suspended'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          timezone: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          timezone?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          organization_id: string
          currency_code: string
          tax_label: string
          default_tax_rate: number
          allow_negative_stock: boolean
          settings: Json
          updated_at: string
          logo_url: string | null
          primary_color: string
          accent_color: string
          primary_color_light: string
          primary_color_dark: string
          accent_color_light: string
          accent_color_dark: string
          muted_color_light: string
          muted_color_dark: string
          shell_background_light: string
          shell_background_dark: string
          shell_surface_light: string
          shell_surface_dark: string
          panel_wallpaper_url: string | null
        }
        Insert: {
          organization_id: string
          currency_code?: string
          tax_label?: string
          default_tax_rate?: number
          allow_negative_stock?: boolean
          settings?: Json
          updated_at?: string
          logo_url?: string | null
          primary_color?: string
          accent_color?: string
          primary_color_light?: string
          primary_color_dark?: string
          accent_color_light?: string
          accent_color_dark?: string
          muted_color_light?: string
          muted_color_dark?: string
          shell_background_light?: string
          shell_background_dark?: string
          shell_surface_light?: string
          shell_surface_dark?: string
          panel_wallpaper_url?: string | null
        }
        Update: {
          organization_id?: string
          currency_code?: string
          tax_label?: string
          default_tax_rate?: number
          allow_negative_stock?: boolean
          settings?: Json
          updated_at?: string
          logo_url?: string | null
          primary_color?: string
          accent_color?: string
          primary_color_light?: string
          primary_color_dark?: string
          accent_color_light?: string
          accent_color_dark?: string
          muted_color_light?: string
          muted_color_dark?: string
          shell_background_light?: string
          shell_background_dark?: string
          shell_surface_light?: string
          shell_surface_dark?: string
          panel_wallpaper_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'organization_settings_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          display_name: string | null
          status: MemberStatus
          invited_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          display_name?: string | null
          status?: MemberStatus
          invited_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          display_name?: string | null
          status?: MemberStatus
          invited_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          actor_member_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          actor_member_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          actor_member_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      member_status: MemberStatus
    }
    CompositeTypes: Record<never, never>
  }
}
