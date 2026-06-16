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
