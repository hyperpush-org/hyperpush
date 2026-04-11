import { createFileRoute } from '@tanstack/react-router'
import { PerformancePage } from '@/components/dashboard/performance-page'

export const Route = createFileRoute('/_dashboard/performance')({
  ssr: false,
  component: DashboardPerformanceRoute,
})

function DashboardPerformanceRoute() {
  return <PerformancePage />
}
