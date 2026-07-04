import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import { assertPublicSupabaseEnv, env } from '@/lib/env'
import {
  isVendedorOnlyUser,
  VENDEDOR_ONLY_PATH,
} from '@/lib/auth/roles'
import { sanitizeNextPath } from '@/lib/auth/routes'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const errParam = searchParams.get('error_description') ?? searchParams.get('error')

  if (errParam && !searchParams.get('code')) {
    const safe = encodeURIComponent(errParam.slice(0, 400))
    return NextResponse.redirect(`${origin}/login?error=${safe}`)
  }

  const code = searchParams.get('code')
  const next = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    assertPublicSupabaseEnv()
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const destination =
        user && (await isVendedorOnlyUser(user.id, user.email))
          ? VENDEDOR_ONLY_PATH
          : next

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
