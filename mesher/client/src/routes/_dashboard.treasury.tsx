import { createFileRoute } from '@tanstack/react-router'
import { TreasuryPage } from '@/components/dashboard/treasury-page'

export const Route = createFileRoute('/_dashboard/treasury')({
  ssr: false,
  component: DashboardTreasuryRoute,
})

function DashboardTreasuryRoute() {
  return <TreasuryPage />
}
