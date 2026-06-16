/**
 * Public env — static NEXT_PUBLIC_* access so Next.js inlines values in the client bundle.
 * Never use process.env[variableName] for NEXT_PUBLIC_* vars.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const

export function assertPublicSupabaseEnv(): void {
  if (!env.supabaseUrl) {
    throw new Error('❌ Missing required env var: NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!env.supabaseAnonKey) {
    throw new Error('❌ Missing required env var: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

/** Server-only — never expose to the client. */
export function getServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) {
    throw new Error('❌ Missing required env var: SUPABASE_SERVICE_ROLE_KEY')
  }
  return value
}

export function getClofiOrganizationId(): string {
  const id = process.env.CLOFI_ORGANIZATION_ID
  if (!id) {
    throw new Error(
      '❌ Missing CLOFI_ORGANIZATION_ID — copia el UUID de public.organizations en .env.local',
    )
  }
  return id
}
