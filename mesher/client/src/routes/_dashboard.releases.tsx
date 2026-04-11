import { createFileRoute } from '@tanstack/react-router'
import { ReleasesPage } from '@/components/dashboard/releases-page'

export const Route = createFileRoute('/_dashboard/releases')({
  ssr: false,
  component: DashboardReleasesRoute,
})

function DashboardReleasesRoute() {
  return <ReleasesPage />
}
