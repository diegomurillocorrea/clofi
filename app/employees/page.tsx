import { LayoutWrapper } from '@/components/layout-wrapper'
import { EmployeesPage } from '@/components/pages/employees-page'
import { getEmployees } from '@/app/actions/clofi'
import { renderClofiError } from '@/lib/clofi/page-loader'

export const dynamic = 'force-dynamic'

export default async function Page() {
  try {
    const employees = await getEmployees()

    return (
      <LayoutWrapper>
        <EmployeesPage initialEmployees={employees} />
      </LayoutWrapper>
    )
  } catch (error) {
    return <LayoutWrapper>{renderClofiError(error)}</LayoutWrapper>
  }
}
