import type { AttendanceRecord } from '@/lib/types'
import { getLocalDateKey } from '@/lib/utils-custom'

/**
 * Datos de Clofi en organization_settings.settings.clofi.
 * Empleados viven en public.employees; aquí solo asistencia y tarifas Clofi.
 */
export interface ClofiSettings {
  attendance: ClofiAttendanceRecord[]
  /** Tarifa horaria (USD) por public.employees.id */
  payroll_rates: Record<string, number>
}

export interface ClofiAttendanceRecord {
  id: string
  employee_id: string
  date: string
  entry_time: string
  exit_time: string
  hours_worked: number
  daily_salary: number
  observations?: string
  entry_signature?: string
  exit_signature?: string
}

export const DEFAULT_CLOFI_SETTINGS: ClofiSettings = {
  attendance: [],
  payroll_rates: {},
}

/** Fresh settings object (never share references with DEFAULT_CLOFI_SETTINGS). */
export function emptyClofiSettings(): ClofiSettings {
  return { attendance: [], payroll_rates: {} }
}

export function toAttendanceRecord(record: ClofiAttendanceRecord): AttendanceRecord {
  return {
    id: record.id,
    employeeId: record.employee_id,
    date: new Date(record.date + 'T12:00:00'),
    entryTime: record.entry_time.slice(0, 5),
    exitTime: record.exit_time ? record.exit_time.slice(0, 5) : '',
    hoursWorked: record.hours_worked,
    dailySalary: record.daily_salary,
    observations: record.observations,
    entrySignature: record.entry_signature,
    exitSignature: record.exit_signature,
  }
}

export function fromAttendanceRecord(record: AttendanceRecord): ClofiAttendanceRecord {
  const date =
    record.date instanceof Date
      ? getLocalDateKey(record.date)
      : String(record.date).split('T')[0]

  return {
    id: record.id,
    employee_id: record.employeeId,
    date,
    entry_time: record.entryTime,
    exit_time: record.exitTime || '',
    hours_worked: record.hoursWorked,
    daily_salary: record.dailySalary,
    observations: record.observations,
    entry_signature: record.entrySignature,
    exit_signature: record.exitSignature,
  }
}

function parsePayrollRates(raw: unknown): Record<string, number> {
  const rates: Record<string, number> = {}

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [employeeId, value] of Object.entries(raw as Record<string, unknown>)) {
      const rate = typeof value === 'number' ? value : Number(value)
      if (Number.isFinite(rate) && rate >= 0) {
        rates[employeeId] = rate
      }
    }
  }

  return rates
}

export function parseClofiSettings(settings: unknown): ClofiSettings {
  if (!settings || typeof settings !== 'object') {
    return emptyClofiSettings()
  }

  const root = settings as Record<string, unknown>
  const clofi = root.clofi

  if (!clofi || typeof clofi !== 'object') {
    return emptyClofiSettings()
  }

  const data = clofi as Record<string, unknown>
  const payrollRates = parsePayrollRates(data.payroll_rates)

  // Legacy: tarifas que vivían en settings.clofi.employees
  if (Array.isArray(data.employees)) {
    for (const item of data.employees) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const id = typeof row.id === 'string' ? row.id : null
      const rate =
        typeof row.hourly_rate === 'number' ? row.hourly_rate : Number(row.hourly_rate)
      if (id && Number.isFinite(rate) && payrollRates[id] === undefined) {
        payrollRates[id] = rate
      }
    }
  }

  return {
    attendance: Array.isArray(data.attendance)
      ? [...(data.attendance as ClofiAttendanceRecord[])]
      : [],
    payroll_rates: payrollRates,
  }
}
