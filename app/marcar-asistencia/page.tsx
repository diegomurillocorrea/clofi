import { EmployeeAttendanceKiosk } from '@/components/pages/employee-attendance-kiosk'
import { ClofiConfigError } from '@/components/clofi-config-error'
import { getAttendanceRecords, getEmployees } from '@/app/actions/clofi'
import { getSessionEmployee } from '@/lib/auth/session-employee'
import { getClofiErrorMessage } from '@/lib/clofi/page-loader'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const [employees, initialRecords, sessionEmployee] = await Promise.all([
      getEmployees(),
      getAttendanceRecords(),
      getSessionEmployee(),
    ])

    return (
      <EmployeeAttendanceKiosk
        employees={employees}
        initialRecords={initialRecords}
        sessionEmployee={sessionEmployee}
      />
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ClofiConfigError message={getClofiErrorMessage(error)} />
      </div>
    )
  }
}
