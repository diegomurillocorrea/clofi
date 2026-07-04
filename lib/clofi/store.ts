import { createAdminClient } from '@/lib/supabase/admin'
import { CLOFI_PAYROLL_CURRENCY } from '@/lib/clofi/constants'
import {
  emptyClofiSettings,
  parseClofiSettings,
  type ClofiSettings,
} from '@/lib/clofi/settings-schema'
import type { Json } from '@/lib/database.types'

export class ClofiStoreError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'ClofiStoreError'
  }
}

function getSupabase() {
  return createAdminClient()
}

/**
 * Resolves an organization from the database (employees first, then active orgs).
 * Used only for organization_settings (asistencia / tarifas), not for listing employees.
 */
export async function resolveClofiOrganizationId(): Promise<string> {
  const supabase = getSupabase()

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('organization_id')
    .limit(1)
    .maybeSingle()

  if (employeeError) {
    throw new ClofiStoreError(employeeError.message, 'ORG_FETCH_FAILED')
  }

  if (employee?.organization_id) {
    return employee.organization_id
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (organizationError) {
    throw new ClofiStoreError(organizationError.message, 'ORG_FETCH_FAILED')
  }

  if (!organization) {
    throw new ClofiStoreError(
      'No hay organizaciones activas en la base de datos',
      'ORG_NOT_FOUND',
    )
  }

  return organization.id
}

export async function getClofiSettings(): Promise<ClofiSettings> {
  const organizationId = await resolveClofiOrganizationId()
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (error) {
    throw new ClofiStoreError(error.message, 'SETTINGS_FETCH_FAILED')
  }

  if (!data) {
    return emptyClofiSettings()
  }

  return parseClofiSettings(data.settings)
}

export async function saveClofiSettings(clofi: ClofiSettings): Promise<void> {
  const organizationId = await resolveClofiOrganizationId()
  const supabase = getSupabase()

  const { data: existing, error: fetchError } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (fetchError) {
    throw new ClofiStoreError(fetchError.message, 'SETTINGS_FETCH_FAILED')
  }

  const currentSettings =
    existing?.settings && typeof existing.settings === 'object'
      ? (existing.settings as Record<string, unknown>)
      : {}

  const nextSettings = {
    ...currentSettings,
    clofi,
  } as unknown as Json

  if (existing) {
    const { error } = await supabase
      .from('organization_settings')
      .update({ settings: nextSettings })
      .eq('organization_id', organizationId)

    if (error) {
      throw new ClofiStoreError(error.message, 'SETTINGS_UPDATE_FAILED')
    }
    return
  }

  const { error } = await supabase.from('organization_settings').insert({
    organization_id: organizationId,
    settings: nextSettings,
  })

  if (error) {
    throw new ClofiStoreError(error.message, 'SETTINGS_INSERT_FAILED')
  }
}

/** Clofi payroll is always denominated in USD. */
export async function getOrganizationCurrency(): Promise<string> {
  return CLOFI_PAYROLL_CURRENCY
}
