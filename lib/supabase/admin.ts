import { createClient } from '@supabase/supabase-js'
import { assertPublicSupabaseEnv, env, getServiceRoleKey } from '@/lib/env'
import type { Database } from '@/lib/database.types'

/**
 * Server-only Supabase client with service role (bypasses RLS).
 * Use only in trusted server code (e.g. Clofi store mutations).
 */
export function createAdminClient() {
  assertPublicSupabaseEnv()
  return createClient<Database>(env.supabaseUrl, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
