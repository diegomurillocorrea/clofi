'use server'

import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { assertAdminAccess } from '@/lib/auth/guards'
import { getSessionEmployee } from '@/lib/auth/session-employee'
import {
  fromAttendanceRecord,
  toAttendanceRecord,
} from '@/lib/clofi/settings-schema'
import {
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  saveEmployee,
} from '@/lib/clofi/employees'
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

/** Only the kiosk — avoids revalidating admin routes Vendedor cannot access. */
function revalidateKioskPath() {
  revalidatePath('/marcar-asistencia')
}

export async function getEmployees(): Promise<Employee[]> {
  return listEmployees()
}

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const settings = await getClofiSettings()
  return settings.attendance
    .map((record) => toAttendanceRecord(record))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function saveEmployeeAction(employee: Employee): Promise<Employee> {
  await assertAdminAccess()
  const saved = await saveEmployee(employee)
  revalidateClofiPaths()
  return saved
}

export async function createEmployeeAction(
  employee: Omit<Employee, 'id'>,
): Promise<Employee> {
  await assertAdminAccess()
  return saveEmployeeAction({ ...employee, id: '' })
}

export async function deleteEmployeeAction(id: string): Promise<void> {
  await assertAdminAccess()
  await deleteEmployee(id)
  revalidateClofiPaths()
}

export async function saveAttendanceRecordAction(
  record: AttendanceRecord,
): Promise<AttendanceRecord> {
  const employee = await getEmployeeById(record.employeeId)
  if (!employee) {
    throw new Error('Empleado no encontrado')
  }

  const sessionEmployee = await getSessionEmployee()
  if (sessionEmployee && sessionEmployee.id !== record.employeeId) {
    throw new Error('Solo puedes registrar tu propia asistencia')
  }

  const settings = await getClofiSettings()
  const stored = fromAttendanceRecord(record)
  if (!stored.id) {
    stored.id = randomUUID()
  }
  const index = settings.attendance.findIndex((item) => item.id === stored.id)

  if (index >= 0) {
    settings.attendance[index] = stored
  } else {
    settings.attendance.push(stored)
  }

  await saveClofiSettings(settings)
  // Only the kiosk path: revalidating admin routes can redirect (Vendedor / unauth)
  // and corrupt the Server Action response body.
  revalidateKioskPath()

  const saved =
    settings.attendance.find((item) => item.id === stored.id) ??
    settings.attendance.at(-1)!

  return toAttendanceRecord(saved)
}

export async function deleteAttendanceRecordAction(id: string): Promise<void> {
  await assertAdminAccess()
  const settings = await getClofiSettings()
  const exists = settings.attendance.some((record) => record.id === id)
  if (!exists) {
    throw new Error('Registro de asistencia no encontrado')
  }

  settings.attendance = settings.attendance.filter((item) => item.id !== id)
  await saveClofiSettings(settings)
  revalidateClofiPaths()
}
