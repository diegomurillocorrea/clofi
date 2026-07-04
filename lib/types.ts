// Employee type (dominio de la app; fuente: public.employees)
export interface Employee {
  id: string
  name: string
  /** Nombre del rol en public.roles */
  position: string
  phone: string
  email?: string
  /** Tarifa Clofi (USD), en organization_settings.settings.clofi.payroll_rates */
  hourlyRate: number
  status: 'active' | 'inactive'
  /** public.employees.created_at */
  startDate: Date
  /** public.employees.role_id */
  roleId?: string
}

// Attendance record type
export interface AttendanceRecord {
  id: string
  employeeId: string
  date: Date
  entryTime: string // HH:mm
  exitTime: string // HH:mm
  hoursWorked: number
  dailySalary: number
  observations?: string
  entrySignature?: string
  exitSignature?: string
}

// Summary types
export interface DaySummary {
  date: Date
  totalEmployees: number
  totalHours: number
  totalPayment: number
  records: AttendanceRecord[]
}

export interface PayrollReport {
  employeeId: string
  employeeName: string
  startDate: Date
  endDate: Date
  hourlyRate: number
  daysWorked: number
  totalHours: number
  totalPayment: number
  records: AttendanceRecord[]
}
