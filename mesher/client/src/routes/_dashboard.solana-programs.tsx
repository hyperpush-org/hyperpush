import { createFileRoute } from '@tanstack/react-router'
import { SolanaProgramsPage } from '@/components/dashboard/solana-programs-page'

export const Route = createFileRoute('/_dashboard/solana-programs')({
  ssr: false,
  component: DashboardSolanaProgramsRoute,
})

function DashboardSolanaProgramsRoute() {
  return <SolanaProgramsPage />
}
