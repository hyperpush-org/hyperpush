import { createFileRoute } from '@tanstack/react-router'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { IssuesPage } from '@/components/dashboard/issues-page'

export const Route = createFileRoute('/$')({
  ssr: false,
  component: DashboardCatchAllRoute,
})

function DashboardCatchAllRoute() {
  return (
    <DashboardShell>
      <IssuesPage />
    </DashboardShell>
  )
}
