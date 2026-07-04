import { createClient } from '@/lib/supabase/server'
import { getEmployeeByEmail } from '@/lib/clofi/employees'
import type { Employee } from '@/lib/types'

/** Employee linked to the signed-in user (by email). */
export async function getSessionEmployee(): Promise<Employee | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return null
  }

  return getEmployeeByEmail(user.email)
}
