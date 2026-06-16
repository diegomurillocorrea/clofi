import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { assertPublicSupabaseEnv, env } from '@/lib/env'
import type { Database } from '@/lib/database.types'

export async function createClient() {
  assertPublicSupabaseEnv()
  const cookieStore = await cookies()

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // is responsible for refreshing the session.
        }
      },
    },
  })
}
