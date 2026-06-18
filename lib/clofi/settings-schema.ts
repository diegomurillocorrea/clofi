import type { Employee, AttendanceRecord } from '@/lib/types'
import { getLocalDateKey } from '@/lib/utils-custom'

/** Datos de Clofi almacenados en organization_settings.settings.clofi */
export interface ClofiSettings {
  employees: ClofiEmployeeRecord[]
  attendance: ClofiAttendanceRecord[]
}

export interface ClofiEmployeeRecord {
  id: string
  name: string
  position: string
  phone: string
  email?: string
  hourly_rate: number
  status: 'active' | 'inactive'
  start_date: string
  /** Vinculo opcional con organization_members.id */
  member_id?: string | null
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
  employees: [],
  attendance: [],
}

export function toEmployee(record: ClofiEmployeeRecord): Employee {
  return {
    id: record.id,
    name: record.name,
    position: record.position,
    phone: record.phone,
    email: record.email,
    hourlyRate: record.hourly_rate,
    status: record.status,
    startDate: new Date(record.start_date),
    memberId: record.member_id ?? undefined,
  }
}

export function fromEmployee(employee: Employee): ClofiEmployeeRecord {
  return {
    id: employee.id,
    name: employee.name,
    position: employee.position,
    phone: employee.phone,
    email: employee.email,
    hourly_rate: employee.hourlyRate,
    status: employee.status,
    start_date: employee.startDate.toISOString().split('T')[0],
    member_id: employee.memberId ?? null,
  }
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

export function parseClofiSettings(settings: unknown): ClofiSettings {
  if (!settings || typeof settings !== 'object') {
    return { ...DEFAULT_CLOFI_SETTINGS }
  }

  const root = settings as Record<string, unknown>
  const clofi = root.clofi

  if (!clofi || typeof clofi !== 'object') {
    return { ...DEFAULT_CLOFI_SETTINGS }
  }

  const data = clofi as Partial<ClofiSettings>

  return {
    employees: Array.isArray(data.employees) ? data.employees : [],
    attendance: Array.isArray(data.attendance) ? data.attendance : [],
  }
}
