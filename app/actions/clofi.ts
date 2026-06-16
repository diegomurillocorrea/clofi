'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import {
  fromAttendanceRecord,
  fromEmployee,
  toAttendanceRecord,
  toEmployee,
} from '@/lib/clofi/settings-schema'
import { getClofiSettings, saveClofiSettings } from '@/lib/clofi/store'
import type { AttendanceRecord, Employee } from '@/lib/types'

function revalidateClofiPaths() {
  revalidatePath('/')
  revalidatePath('/employees')
  revalidatePath('/attendance')
  revalidatePath('/history')
  revalidatePath('/reports')
  revalidatePath('/marcar-asistencia')
}

export async function getEmployees(): Promise<Employee[]> {
  const settings = await getClofiSettings()
  return settings.employees.map(toEmployee)
}

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const settings = await getClofiSettings()
  return settings.attendance.map(toAttendanceRecord)
}

export async function saveEmployeeAction(employee: Employee): Promise<Employee> {
  const settings = await getClofiSettings()
  const record = fromEmployee(employee)
  if (!record.id) {
    record.id = randomUUID()
  }
  const index = settings.employees.findIndex((item) => item.id === record.id)

  if (index >= 0) {
    settings.employees[index] = record
  } else {
    settings.employees.push({ ...record, id: record.id || randomUUID() })
  }

  await saveClofiSettings(settings)
  revalidateClofiPaths()

  const saved = settings.employees.find((item) => item.id === record.id) ?? settings.employees.at(-1)!
  return toEmployee(saved)
}

export async function createEmployeeAction(
  employee: Omit<Employee, 'id'>,
): Promise<Employee> {
  return saveEmployeeAction({ ...employee, id: randomUUID() })
}

export async function deleteEmployeeAction(id: string): Promise<void> {
  const settings = await getClofiSettings()
  settings.employees = settings.employees.filter((item) => item.id !== id)
  settings.attendance = settings.attendance.filter((item) => item.employee_id !== id)
  await saveClofiSettings(settings)
  revalidateClofiPaths()
}

export async function saveAttendanceRecordAction(
  record: AttendanceRecord,
): Promise<AttendanceRecord> {
  const settings = await getClofiSettings()
  const stored = fromAttendanceRecord(record)
  const index = settings.attendance.findIndex((item) => item.id === stored.id)

  if (index >= 0) {
    settings.attendance[index] = stored
  } else {
    settings.attendance.push({ ...stored, id: stored.id || randomUUID() })
  }

  await saveClofiSettings(settings)
  revalidateClofiPaths()

  const saved =
    settings.attendance.find((item) => item.id === stored.id) ??
    settings.attendance.at(-1)!
  return toAttendanceRecord(saved)
}

export async function deleteAttendanceRecordAction(id: string): Promise<void> {
  const settings = await getClofiSettings()
  settings.attendance = settings.attendance.filter((item) => item.id !== id)
  await saveClofiSettings(settings)
  revalidateClofiPaths()
}
