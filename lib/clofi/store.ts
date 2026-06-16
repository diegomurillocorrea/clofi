import { createAdminClient } from '@/lib/supabase/admin'
import { getClofiOrganizationId } from '@/lib/env'
import { CLOFI_PAYROLL_CURRENCY } from '@/lib/clofi/constants'
import {
  DEFAULT_CLOFI_SETTINGS,
  parseClofiSettings,
  type ClofiSettings,
} from '@/lib/clofi/settings-schema'

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

export async function getClofiSettings(): Promise<ClofiSettings> {
  const organizationId = getClofiOrganizationId()
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
    return { ...DEFAULT_CLOFI_SETTINGS }
  }

  return parseClofiSettings(data.settings)
}

export async function saveClofiSettings(clofi: ClofiSettings): Promise<void> {
  const organizationId = getClofiOrganizationId()
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
  }

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
