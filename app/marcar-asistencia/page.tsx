import { EmployeeAttendanceKiosk } from '@/components/pages/employee-attendance-kiosk'
import { ClofiConfigError } from '@/components/clofi-config-error'
import { getAttendanceRecords, getEmployees } from '@/app/actions/clofi'
import { getClofiErrorMessage } from '@/lib/clofi/page-loader'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const [employees, initialRecords] = await Promise.all([
      getEmployees(),
      getAttendanceRecords(),
    ])

    return (
      <EmployeeAttendanceKiosk employees={employees} initialRecords={initialRecords} />
    )
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <ClofiConfigError message={getClofiErrorMessage(error)} />
      </div>
    )
  }
}
