// Employee type (dominio de la app; persistido en organization_settings.settings.clofi)
export interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email?: string
  hourlyRate: number
  status: 'active' | 'inactive'
  startDate: Date
  /** Vinculo opcional con organization_members.id en la DB del store */
  memberId?: string
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
