const PUBLIC_PATHS = new Set(['/login', '/auth/callback'])

/** Routes reachable without an authenticated session. */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true
  }
  if (pathname.startsWith('/auth/')) {
    return true
  }
  // Employee self-service kiosk — no admin login required
  if (pathname === '/marcar-asistencia') {
    return true
  }
  return false
}

export function sanitizeNextPath(value: string | null, fallback = '/'): string {
  if (!value) {
    return fallback
  }
  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }
  if (value.includes(':') || value.includes('\n') || value.includes('\r')) {
    return fallback
  }
  if (value === '/login') {
    return fallback
  }
  return value
}
