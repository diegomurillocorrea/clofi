import { ClofiConfigError } from '@/components/clofi-config-error'

export function getClofiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'No se pudo cargar los datos de Clofi.'
}

export function renderClofiError(error: unknown) {
  return <ClofiConfigError message={getClofiErrorMessage(error)} />
}
