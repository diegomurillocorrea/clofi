import { LayoutWrapper } from '@/components/layout-wrapper'
import { Dashboard } from '@/components/pages/dashboard'
import { getAttendanceRecords, getEmployees } from '@/app/actions/clofi'
import { renderClofiError } from '@/lib/clofi/page-loader'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const [employees, attendanceRecords] = await Promise.all([
      getEmployees(),
      getAttendanceRecords(),
    ])

    return (
      <LayoutWrapper>
        <Dashboard employees={employees} attendanceRecords={attendanceRecords} />
      </LayoutWrapper>
    )
  } catch (error) {
    return <LayoutWrapper>{renderClofiError(error)}</LayoutWrapper>
  }
}
