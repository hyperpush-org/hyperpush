import { createFileRoute } from '@tanstack/react-router'
import { IssuesPage } from '@/components/dashboard/issues-page'

export const Route = createFileRoute('/_dashboard/')({
  ssr: false,
  component: DashboardIssuesRoute,
})

function DashboardIssuesRoute() {
  return <IssuesPage />
}
