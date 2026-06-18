import { CLOFI_PAYROLL_CURRENCY } from '@/lib/clofi/constants'

const HOURLY_RATE_DECIMALS = 4

/** Round hourly rate to 4 decimal places (payroll precision). */
export function roundHourlyRate(value: number): number {
  const factor = 10 ** HOURLY_RATE_DECIMALS
  return Math.round(value * factor) / factor
}

/**
 * Format a number as USD currency (Clofi payroll).
 */
export function formatCurrency(
  value: number,
  currency: string = CLOFI_PAYROLL_CURRENCY,
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Format hourly rate with up to 4 decimal places. */
export function formatHourlyRate(
  value: number,
  currency: string = CLOFI_PAYROLL_CURRENCY,
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: HOURLY_RATE_DECIMALS,
  }).format(value)
}

/**
 * Format a date to Spanish locale
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a date to short format (DD/MM/YYYY)
 */
export function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/** Local calendar date as YYYY-MM-DD (avoids UTC drift in attendance). */
export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Whether two dates fall on the same local calendar day. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return getLocalDateKey(a) === getLocalDateKey(b)
}

/** Whether an attendance record still has an open shift (no exit yet). */
export function isOpenAttendanceShift(record: {
  entryTime: string
  exitTime: string
}): boolean {
  return Boolean(record.entryTime?.trim()) && !record.exitTime?.trim()
}

/**
 * Elapsed seconds from a local HH:mm entry time until now.
 */
export function getElapsedSecondsSince(entryTime: string, now = new Date()): number {
  const [entryHour, entryMin] = entryTime.split(':').map(Number)
  const entryDate = new Date(now)
  entryDate.setHours(entryHour, entryMin, 0, 0)
  return Math.max(0, Math.floor((now.getTime() - entryDate.getTime()) / 1000))
}

/** Format seconds as HH:MM:SS for live shift timers. */
export function formatElapsedDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Calculate hours worked between two times (HH:mm format)
 */
export function calculateHoursWorked(entryTime: string, exitTime: string): number {
  const [entryHour, entryMin] = entryTime.split(':').map(Number)
  const [exitHour, exitMin] = exitTime.split(':').map(Number)
  
  const entryTotalMin = entryHour * 60 + entryMin
  const exitTotalMin = exitHour * 60 + exitMin
  
  const diffMin = exitTotalMin - entryTotalMin
  return diffMin / 60
}

/**
 * Calculate daily salary
 */
export function calculateDailySalary(
  hoursWorked: number,
  hourlyRate: number
): number {
  return hoursWorked * hourlyRate
}

/**
 * Parse time string (HH:mm) and return total minutes
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes to time string (HH:mm)
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Validate time format (HH:mm)
 */
export function isValidTimeFormat(timeStr: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(timeStr)
}

/** Parse HH:mm into hour/minute parts. */
export function parseTimeHHmm(value: string): { hours: number; minutes: number } | null {
  if (!isValidTimeFormat(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return { hours, minutes }
}

/** Build HH:mm from hour and minute. */
export function buildTimeHHmm(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** Current local time as HH:mm. */
export function getCurrentTimeHHmm(): string {
  const now = new Date()
  return buildTimeHHmm(now.getHours(), now.getMinutes())
}

/** Human-readable 12h label for HH:mm (es-ES). */
export function formatTimeLabel(value: string): string {
  const parsed = parseTimeHHmm(value)
  if (!parsed) return ''
  const date = new Date()
  date.setHours(parsed.hours, parsed.minutes, 0, 0)
  return new Intl.DateTimeFormat('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * Get weeks in date range
 */
export function getWeeksInRange(startDate: Date, endDate: Date): Date[] {
  const weeks = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    weeks.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}
