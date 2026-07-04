import { createAdminClient } from '@/lib/supabase/admin'
import { CLOFI_EMPLOYEE_ROLE_SLUG } from '@/lib/clofi/constants'
import {
  ClofiStoreError,
  getClofiSettings,
  resolveClofiOrganizationId,
  saveClofiSettings,
} from '@/lib/clofi/store'
import type { Employee } from '@/lib/types'

interface EmployeeRoleEmbed {
  name: string
  slug: string
}

interface EmployeeRow {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  status: 'active' | 'inactive'
  role_id: string | null
  created_at: string
  roles: EmployeeRoleEmbed | EmployeeRoleEmbed[] | null
}

const EMPLOYEE_SELECT =
  'id, organization_id, first_name, last_name, phone, email, status, role_id, created_at, roles(name, slug)'

function getSupabase() {
  return createAdminClient()
}

function fullName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(' ').trim()
}

export function splitFullName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function roleName(roles: EmployeeRow['roles']): string {
  if (!roles) return ''
  if (Array.isArray(roles)) return roles[0]?.name ?? ''
  return roles.name ?? ''
}

function roleSlug(roles: EmployeeRow['roles']): string {
  if (!roles) return ''
  if (Array.isArray(roles)) return roles[0]?.slug ?? ''
  return roles.slug ?? ''
}

function isVendedorRole(roles: EmployeeRow['roles']): boolean {
  return roleSlug(roles) === CLOFI_EMPLOYEE_ROLE_SLUG
}

function toDomainEmployee(row: EmployeeRow, hourlyRate: number): Employee {
  return {
    id: row.id,
    name: fullName(row.first_name, row.last_name),
    position: roleName(row.roles),
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    hourlyRate,
    status: row.status,
    startDate: new Date(row.created_at),
    roleId: row.role_id ?? undefined,
  }
}

async function resolveRoleId(organizationId: string): Promise<string | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('slug', CLOFI_EMPLOYEE_ROLE_SLUG)
    .maybeSingle()

  if (error) {
    throw new ClofiStoreError(error.message, 'ROLES_FETCH_FAILED')
  }

  return data?.id ?? null
}

async function getPayrollRates(): Promise<Record<string, number>> {
  try {
    const settings = await getClofiSettings()
    return settings.payroll_rates
  } catch {
    return {}
  }
}

export async function listEmployees(): Promise<Employee[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_SELECT)
    .order('first_name')

  if (error) {
    throw new ClofiStoreError(error.message, 'EMPLOYEES_FETCH_FAILED')
  }

  const rates = await getPayrollRates()

  return (data ?? [])
    .filter((row) => isVendedorRole((row as EmployeeRow).roles))
    .map((row) => toDomainEmployee(row as EmployeeRow, rates[row.id] ?? 0))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new ClofiStoreError(error.message, 'EMPLOYEES_FETCH_FAILED')
  }

  if (!data || !isVendedorRole((data as EmployeeRow).roles)) {
    return null
  }

  const rates = await getPayrollRates()
  return toDomainEmployee(data as EmployeeRow, rates[data.id] ?? 0)
}

/** Active Vendedor employee whose email matches (case-insensitive). */
export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  const employees = await listEmployees()
  return (
    employees.find(
      (employee) =>
        employee.status === 'active' &&
        employee.email?.trim().toLowerCase() === normalized,
    ) ?? null
  )
}

export async function saveEmployee(employee: Employee): Promise<Employee> {
  const { firstName, lastName } = splitFullName(employee.name)
  if (!firstName) {
    throw new ClofiStoreError('El nombre es requerido', 'NAME_REQUIRED')
  }

  const supabase = getSupabase()

  if (employee.id) {
    const { data: existing, error: existingError } = await supabase
      .from('employees')
      .select('id, organization_id, role_id')
      .eq('id', employee.id)
      .maybeSingle()

    if (existingError) {
      throw new ClofiStoreError(existingError.message, 'EMPLOYEES_FETCH_FAILED')
    }

    if (!existing) {
      throw new ClofiStoreError('Empleado no encontrado', 'EMPLOYEE_NOT_FOUND')
    }

    const { data, error } = await supabase
      .from('employees')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: employee.phone.trim() || null,
        email: employee.email?.trim() || null,
        status: employee.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employee.id)
      .select(EMPLOYEE_SELECT)
      .single()

    if (error) {
      throw new ClofiStoreError(error.message, 'EMPLOYEE_UPDATE_FAILED')
    }

    const settings = await getClofiSettings()
    settings.payroll_rates[data.id] = employee.hourlyRate
    await saveClofiSettings(settings)

    return toDomainEmployee(data as EmployeeRow, employee.hourlyRate)
  }

  const organizationId = await resolveClofiOrganizationId()
  const roleId = await resolveRoleId(organizationId)

  const { data, error } = await supabase
    .from('employees')
    .insert({
      organization_id: organizationId,
      first_name: firstName,
      last_name: lastName,
      phone: employee.phone.trim() || null,
      email: employee.email?.trim() || null,
      status: employee.status,
      role_id: roleId,
      updated_at: new Date().toISOString(),
    })
    .select(EMPLOYEE_SELECT)
    .single()

  if (error) {
    throw new ClofiStoreError(error.message, 'EMPLOYEE_INSERT_FAILED')
  }

  const settings = await getClofiSettings()
  settings.payroll_rates[data.id] = employee.hourlyRate
  await saveClofiSettings(settings)

  return toDomainEmployee(data as EmployeeRow, employee.hourlyRate)
}

export async function deleteEmployee(id: string): Promise<void> {
  const existing = await getEmployeeById(id)
  if (!existing) {
    throw new ClofiStoreError('Empleado no encontrado', 'EMPLOYEE_NOT_FOUND')
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('employees').delete().eq('id', id)

  if (error) {
    throw new ClofiStoreError(error.message, 'EMPLOYEE_DELETE_FAILED')
  }

  try {
    const settings = await getClofiSettings()
    delete settings.payroll_rates[id]
    settings.attendance = settings.attendance.filter((item) => item.employee_id !== id)
    await saveClofiSettings(settings)
  } catch {
    // Settings are optional when cleaning up a deleted employee.
  }
}
