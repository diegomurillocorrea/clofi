'use server'

import { createClient } from '@/lib/supabase/server'
import {
  isVendedorOnlyUser,
  VENDEDOR_ONLY_PATH,
} from '@/lib/auth/roles'
import { sanitizeNextPath } from '@/lib/auth/routes'

/** Post-login destination: Vendedor users always go to the attendance kiosk. */
export async function resolvePostLoginPath(next: string | null): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return '/login'
  }

  if (await isVendedorOnlyUser(user.id, user.email)) {
    return VENDEDOR_ONLY_PATH
  }

  return sanitizeNextPath(next)
}
