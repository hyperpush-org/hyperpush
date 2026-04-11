import { Outlet, createFileRoute } from '@tanstack/react-router'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const Route = createFileRoute('/_dashboard')({
  ssr: false,
  component: DashboardLayoutRoute,
})

function DashboardLayoutRoute() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  )
}
