import { createFileRoute } from '@tanstack/react-router'
import { BountiesPage } from '@/components/dashboard/bounties-page'

export const Route = createFileRoute('/_dashboard/bounties')({
  ssr: false,
  component: DashboardBountiesRoute,
})

function DashboardBountiesRoute() {
  return <BountiesPage />
}
