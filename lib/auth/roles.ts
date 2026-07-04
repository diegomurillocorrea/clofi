import { createAdminClient } from '@/lib/supabase/admin'
import { CLOFI_EMPLOYEE_ROLE_SLUG } from '@/lib/clofi/constants'

export const VENDEDOR_ONLY_PATH = '/marcar-asistencia' as const

interface RoleEmbed {
  slug: string
}

interface MemberRoleEmbed {
  roles: RoleEmbed | RoleEmbed[] | null
}

interface MemberWithRoles {
  id: string
  member_roles: MemberRoleEmbed[] | null
}

function embedSlug(roles: RoleEmbed | RoleEmbed[] | null | undefined): string | null {
  if (!roles) return null
  if (Array.isArray(roles)) return roles[0]?.slug ?? null
  return roles.slug ?? null
}

function collectRoleSlugs(members: MemberWithRoles[]): string[] {
  const slugs = new Set<string>()

  for (const member of members) {
    for (const memberRole of member.member_roles ?? []) {
      const slug = embedSlug(memberRole.roles)
      if (slug) {
        slugs.add(slug)
      }
    }
  }

  return [...slugs]
}

async function getMemberRoleSlugs(userId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organization_members')
    .select('id, member_roles(roles(slug))')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    throw error
  }

  return collectRoleSlugs((data ?? []) as MemberWithRoles[])
}

async function employeeEmailIsVendedor(email: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('employees')
    .select('id, roles(slug)')
    .eq('email', email)
    .eq('status', 'active')

  if (error) {
    throw error
  }

  return (data ?? []).some((row) => {
    const roles = row.roles as RoleEmbed | RoleEmbed[] | null
    return embedSlug(roles) === CLOFI_EMPLOYEE_ROLE_SLUG
  })
}

/**
 * True when the signed-in user should only access /marcar-asistencia.
 * Uses organization member roles; falls back to an active employee with the same email.
 */
export async function isVendedorOnlyUser(
  userId: string,
  email?: string | null,
): Promise<boolean> {
  try {
    const roleSlugs = await getMemberRoleSlugs(userId)

    if (roleSlugs.length > 0) {
      return roleSlugs.every((slug) => slug === CLOFI_EMPLOYEE_ROLE_SLUG)
    }

    if (!email) {
      return false
    }

    return await employeeEmailIsVendedor(email)
  } catch {
    return false
  }
}

export function isAllowedVendedorPath(pathname: string): boolean {
  return pathname === VENDEDOR_ONLY_PATH
}
