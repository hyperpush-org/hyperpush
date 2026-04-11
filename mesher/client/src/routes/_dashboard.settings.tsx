import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/components/dashboard/settings/settings-page'

export const Route = createFileRoute('/_dashboard/settings')({
  ssr: false,
  component: DashboardSettingsRoute,
})

function DashboardSettingsRoute() {
  return <SettingsPage />
}
