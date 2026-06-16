import { LayoutWrapper } from '@/components/layout-wrapper'
import { HistoryPage } from '@/components/pages/history-page'
import { getAttendanceRecords, getEmployees } from '@/app/actions/clofi'
import { renderClofiError } from '@/lib/clofi/page-loader'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const [initialEmployees, initialRecords] = await Promise.all([
      getEmployees(),
      getAttendanceRecords(),
    ])

    return (
      <LayoutWrapper>
        <HistoryPage
          initialEmployees={initialEmployees}
          initialRecords={initialRecords}
        />
      </LayoutWrapper>
    )
  } catch (error) {
    return <LayoutWrapper>{renderClofiError(error)}</LayoutWrapper>
  }
}
