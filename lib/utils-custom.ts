import { CLOFI_PAYROLL_CURRENCY } from '@/lib/clofi/constants'

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
