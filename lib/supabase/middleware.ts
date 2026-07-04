import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/database.types'
import {
  isAllowedVendedorPath,
  isVendedorOnlyUser,
  VENDEDOR_ONLY_PATH,
} from '@/lib/auth/roles'
import { isPublicPath, sanitizeNextPath } from '@/lib/auth/routes'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pathname = request.nextUrl.pathname
  // Server Actions need an action payload, not a redirect response.
  const isServerAction =
    request.method === 'POST' && request.headers.has('next-action')

  let supabaseResponse = NextResponse.next({ request })

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const isVendedorOnly = await isVendedorOnlyUser(user.id, user.email)

    if (isVendedorOnly) {
      if (
        !isServerAction &&
        (pathname === '/login' || !isAllowedVendedorPath(pathname))
      ) {
        return NextResponse.redirect(new URL(VENDEDOR_ONLY_PATH, request.url))
      }
      return supabaseResponse
    }

    if (!isServerAction && pathname === '/login') {
      const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'))
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  if (!user && !isPublicPath(pathname) && !isServerAction) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}
