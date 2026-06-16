import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import { assertPublicSupabaseEnv, env } from '@/lib/env'
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
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
