import { createFileRoute } from '@tanstack/react-router'
import { AlertsPage } from '@/components/dashboard/alerts-page'

export const Route = createFileRoute('/_dashboard/alerts')({
  ssr: false,
  component: DashboardAlertsRoute,
})

function DashboardAlertsRoute() {
  return <AlertsPage />
}
