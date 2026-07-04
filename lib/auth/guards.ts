import { createClient } from '@/lib/supabase/server'
import { isVendedorOnlyUser } from '@/lib/auth/roles'

/** Blocks admin-only mutations for Vendedor-only sessions. */
export async function assertAdminAccess(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  if (await isVendedorOnlyUser(user.id, user.email)) {
    throw new Error('No tienes permiso para esta acción')
  }
}
